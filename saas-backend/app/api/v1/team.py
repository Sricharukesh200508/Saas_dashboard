from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.base import get_db_session
from app.models.user import User
from app.schemas.user import UserResponse
from app.core.security import decode_token, TokenPayload

router = APIRouter()

@router.get("", response_model=List[UserResponse])
async def list_team_members(
    db: AsyncSession = Depends(get_db_session),
    token: TokenPayload = Depends(decode_token)
):
    result = await db.execute(select(User).where(User.tenant_id == token.tenant_id))
    return result.scalars().all()

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_team_member(
    user_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    token: TokenPayload = Depends(decode_token)
):
    if token.role not in ['owner', 'admin']:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    if str(user_id) == str(token.sub):
        raise HTTPException(status_code=400, detail="Cannot remove yourself")
        
    result = await db.execute(
        select(User).where(User.id == user_id, User.tenant_id == token.tenant_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # In a real app we might just set is_active=False instead of hard delete
    await db.delete(user)
    await db.commit()

from app.schemas.user import UserInvite
from passlib.context import CryptContext
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("", response_model=UserResponse)
async def invite_team_member(
    invite_data: UserInvite,
    db: AsyncSession = Depends(get_db_session),
    token: TokenPayload = Depends(decode_token)
):
    if token.role not in ['owner', 'admin']:
        raise HTTPException(status_code=403, detail="Not enough permissions to invite members")

    # Check if user already exists
    result = await db.execute(select(User).where(User.email == invite_data.email, User.tenant_id == token.tenant_id))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already exists in this workspace")

    # Generate a random password for invited users
    random_password = str(uuid.uuid4())
    hashed_password = pwd_context.hash(random_password)

    new_user = User(
        email=invite_data.email,
        hashed_password=hashed_password,
        tenant_id=token.tenant_id,
        role=invite_data.role,
        is_active=True
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # In a real app, send an email here with the generated password or a reset link
    
    return new_user
