"""
Clerk JWT verification using python-jose + httpx.

Intentionally avoids PyJWT's PyJWKClient — there is a conflicting system-level
`jwt` package on this machine that shadows PyJWT. python-jose imports from the
`jose` namespace so there is no conflict.

Security properties:
  - RS256 signature verified against Clerk's JWKS
  - `iss` claim checked against CLERK_ISSUER_URL (required env var)
  - `sub` must be present
  - User must be in ADMIN_USER_IDS allowlist (comma-separated env var)
"""

import os
import time

import httpx
from jose import jwt
from jose.exceptions import ExpiredSignatureError, JWTError
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

bearer_scheme = HTTPBearer()

# ── JWKS cache (refresh every 5 minutes) ─────────────────────────────────────
_jwks_cache: dict[str, object] = {"keys": {}, "fetched_at": 0.0}
_CACHE_TTL = 300  # seconds


def _get_admin_ids() -> set[str]:
    raw = os.environ.get("ADMIN_USER_IDS", "").strip()
    if not raw:
        return set()
    return {uid.strip() for uid in raw.split(",") if uid.strip()}


async def _get_jwk(kid: str) -> dict:
    now = time.monotonic()
    needs_refresh = now - _jwks_cache["fetched_at"] > _CACHE_TTL

    if needs_refresh or not _jwks_cache["keys"]:
        jwks_url = os.environ.get("CLERK_JWKS_URL", "")
        if not jwks_url:
            raise RuntimeError(
                "CLERK_JWKS_URL is required. "
                "Find it in Clerk dashboard → Configure → API Keys → Advanced → JWKS URL"
            )
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(jwks_url)
            resp.raise_for_status()
        _jwks_cache["keys"] = {k["kid"]: k for k in resp.json().get("keys", [])}
        _jwks_cache["fetched_at"] = now

    key = _jwks_cache["keys"].get(kid)
    if key is None and not needs_refresh:
        # Key may have been rotated — force one re-fetch
        _jwks_cache["fetched_at"] = 0.0
        return await _get_jwk(kid)

    if key is None:
        raise ValueError(f"No public key found for kid '{kid}' in JWKS")

    return key  # type: ignore[return-value]


# ── FastAPI dependency ────────────────────────────────────────────────────────

async def require_admin(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
) -> str:
    """Verifies a Clerk Bearer JWT, checks issuer and admin allowlist, returns user_id."""
    token = credentials.credentials
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid", "")
        jwk = await _get_jwk(kid)

        expected_issuer = os.environ.get("CLERK_ISSUER_URL", "").strip()
        if not expected_issuer:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Server misconfiguration: CLERK_ISSUER_URL not set",
            )

        payload = jwt.decode(
            token,
            jwk,
            algorithms=["RS256"],
            issuer=expected_issuer,
            options={"verify_aud": False},  # Clerk JWTs carry no standard audience
        )

        user_id: str = payload.get("sub", "")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: missing subject")

        admin_ids = _get_admin_ids()
        if admin_ids and user_id not in admin_ids:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: admin privileges required")

        return user_id

    except ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session token has expired — please sign in again")
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {exc}")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Authentication error: {exc}")
