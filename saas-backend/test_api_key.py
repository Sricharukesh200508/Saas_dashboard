import asyncio
from uuid import UUID
from app.db.base import async_session_maker
from app.models.api_key import ApiKey
from app.models.user import User
from sqlalchemy.future import select
import hashlib

async def main():
    async with async_session_maker() as session:
        # Get a user
        result = await session.execute(select(User))
        user = result.scalars().first()
        if not user:
            print("No users found.")
            return

        print(f"Found User: {user.id}, Tenant: {user.tenant_id}")
        
        raw_key = "sk_live_test_123"
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        key_prefix = raw_key[:8]

        try:
            api_key = ApiKey(
                tenant_id=user.tenant_id,
                user_id=user.id,
                name="Test Key",
                key_hash=key_hash,
                key_prefix=key_prefix,
                scopes=["metrics:write", "metrics:read"]
            )
            session.add(api_key)
            await session.commit()
            await session.refresh(api_key)
            print("API Key created successfully:", api_key.id)
            print("Created at:", api_key.created_at)
        except Exception as e:
            print("EXCEPTION CAUGHT:")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
