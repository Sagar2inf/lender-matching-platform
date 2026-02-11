import os
import redis.asyncio as redis

REDIS_URL = os.getenv("REDIS_URL", "redis://cache:6379/0")

async def init_redis():
    client = redis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
    return client