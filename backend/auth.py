import os
from typing import Optional

import jwt
from jwt import PyJWKClient
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

_jwks_client: Optional[PyJWKClient] = None

bearer_scheme = HTTPBearer()


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        jwks_url = os.environ.get("CLERK_JWKS_URL", "")
        if not jwks_url:
            raise RuntimeError(
                "CLERK_JWKS_URL is required. "
                "Find it in Clerk dashboard → Configure → API Keys → Advanced → JWKS URL"
            )
        # Cache keys for 5 minutes — balances freshness vs. performance
        _jwks_client = PyJWKClient(jwks_url, cache_jwk_set=True, lifespan=300)
    return _jwks_client


async def require_admin(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
) -> str:
    """FastAPI dependency — verifies Clerk Bearer JWT, returns user_id (sub)."""
    token = credentials.credentials
    try:
        client = _get_jwks_client()
        signing_key = client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},  # Clerk JWTs have no standard audience claim
        )
        user_id: str = payload.get("sub", "")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
            )
        return user_id
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token has expired — please sign in again",
        )
    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {exc}",
        )
