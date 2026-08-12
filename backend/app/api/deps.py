from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core import security
from app.db.session import get_db
from app.models.user import User

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token",
    auto_error=False
)

async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> User:
    # Local development bypass: just return the first user, or create one
    result = await db.execute(select(User).options(selectinload(User.organization)))
    user = result.scalars().first()
    
    if not user:
        from app.models.organization import Organization
        org = Organization(name="Default Org", domain="example.com")
        db.add(org)
        await db.commit()
        await db.refresh(org)
        
        user = User(email="admin@example.com", full_name="Admin", is_active=True, organization_id=org.id)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    return current_user
