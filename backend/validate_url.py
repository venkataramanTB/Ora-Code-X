"""
SSRF prevention for Oracle Cloud SaaS instance URLs.

Defence layers applied in order:
  1. Require https: scheme.
  2. Hostname must be *.oraclecloud.com (strict allowlist).
  3. DNS pre-flight: resolve hostname and reject private/loopback/link-local IPs.
  4. Callers set follow_redirects=False so 3xx cannot bypass validation.
"""

import asyncio
import re
import socket
from urllib.parse import urlparse

_PRIVATE_IPV4 = [
    re.compile(r"^127\."),
    re.compile(r"^10\."),
    re.compile(r"^172\.(1[6-9]|2\d|3[01])\."),
    re.compile(r"^192\.168\."),
    re.compile(r"^169\.254\."),          # link-local / AWS metadata
    re.compile(r"^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\."),  # CGNAT
    re.compile(r"^0\."),
]


def _is_private_ip(ip: str) -> bool:
    if ip in ("::1", "0:0:0:0:0:0:0:1"):
        return True
    lc = ip.lower()
    if lc.startswith(("fc", "fd", "fe80")):
        return True
    # IPv4-mapped IPv6 (::ffff:10.x.x.x)
    if lc.startswith("::ffff:"):
        ip = lc.removeprefix("::ffff:")
    return any(p.match(ip) for p in _PRIVATE_IPV4)


async def validate_oracle_instance_url(raw_url: str) -> tuple[bool, str]:
    """Returns (True, '') if valid, (False, error) otherwise."""
    try:
        parsed = urlparse(raw_url)
    except Exception:
        return False, "Instance URL is not a valid URL"

    if parsed.scheme != "https":
        return False, "Instance URL must use HTTPS (https://)"

    hostname = (parsed.hostname or "").rstrip(".").lower()
    if not hostname:
        return False, "Instance URL has no hostname"

    if not hostname.endswith(".oraclecloud.com"):
        return False, "Instance URL must be an *.oraclecloud.com hostname"

    # DNS pre-flight — resolve and reject private IPs
    try:
        loop = asyncio.get_event_loop()
        addr_infos = await loop.run_in_executor(
            None, lambda: socket.getaddrinfo(hostname, None)
        )
        for _, _, _, _, sockaddr in addr_infos:
            ip = sockaddr[0]
            if _is_private_ip(ip):
                return False, "Instance URL hostname resolves to a non-public IP address"
    except socket.gaierror:
        return False, f"Cannot resolve instance hostname: {hostname}"

    return True, ""
