import os
import secrets

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _get_key() -> bytes:
    hex_key = os.environ.get("ENCRYPTION_KEY", "")
    if len(hex_key) != 64:
        raise RuntimeError(
            "ENCRYPTION_KEY must be a 64-char hex string (32 bytes). "
            'Generate with: python -c "import secrets; print(secrets.token_hex(32))"'
        )
    return bytes.fromhex(hex_key)


def encrypt(plaintext: str) -> str:
    """AES-256-GCM encrypt → 'ivHex:tagHex:ciphertextHex'"""
    key = _get_key()
    iv = secrets.token_bytes(12)  # 96-bit IV is optimal for GCM
    aesgcm = AESGCM(key)
    # AESGCM.encrypt() returns ciphertext || 16-byte auth-tag
    ct_and_tag = aesgcm.encrypt(iv, plaintext.encode(), None)
    ciphertext = ct_and_tag[:-16]
    tag = ct_and_tag[-16:]
    return f"{iv.hex()}:{tag.hex()}:{ciphertext.hex()}"


def decrypt(stored: str) -> str:
    """Decrypt 'ivHex:tagHex:ciphertextHex' → plaintext"""
    key = _get_key()
    parts = stored.split(":")
    if len(parts) != 3:
        raise ValueError("Malformed encrypted value")
    iv_hex, tag_hex, ct_hex = parts
    aesgcm = AESGCM(key)
    # AESGCM.decrypt() expects ciphertext || tag
    plaintext = aesgcm.decrypt(
        bytes.fromhex(iv_hex),
        bytes.fromhex(ct_hex) + bytes.fromhex(tag_hex),
        None,
    )
    return plaintext.decode()
