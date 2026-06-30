import os
from typing import Optional

import asyncpg

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            os.environ["DATABASE_URL"],
            ssl="require",
            min_size=1,
            max_size=10,
        )
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


async def init_db() -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS oracle_saas_connections (
                id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                connection_name VARCHAR(255) NOT NULL UNIQUE,
                username        VARCHAR(255) NOT NULL,
                password_enc    TEXT         NOT NULL,
                instance_url    TEXT         NOT NULL,
                status          VARCHAR(20)  NOT NULL DEFAULT 'untested'
                                    CHECK (status IN ('untested', 'success', 'failed')),
                last_tested_at  TIMESTAMPTZ,
                error_message   TEXT,
                created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
            )
        """)
        await conn.execute("""
            CREATE OR REPLACE FUNCTION update_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        """)
        await conn.execute("""
            DROP TRIGGER IF EXISTS trg_oracle_saas_connections_updated_at
            ON oracle_saas_connections
        """)
        await conn.execute("""
            CREATE TRIGGER trg_oracle_saas_connections_updated_at
                BEFORE UPDATE ON oracle_saas_connections
                FOR EACH ROW EXECUTE FUNCTION update_updated_at()
        """)
    print("✓ DB initialised — oracle_saas_connections table ready")
