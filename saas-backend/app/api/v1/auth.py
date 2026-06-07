from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import get_db_session
from app.schemas.auth import LoginRequest, Token
from app.services.auth_service import AuthService

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest, db: AsyncSession = Depends(get_db_session)):
    auth_service = AuthService(db)
    return await auth_service.authenticate_user(login_data)

@router.post("/logout")
async def logout():
    # In a real impl, you might blacklist the refresh token in Redis
    return {"message": "Successfully logged out"}
