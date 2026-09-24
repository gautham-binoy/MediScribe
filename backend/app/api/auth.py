from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is inactive")

    access_token = create_access_token(
        subject=user.id, role=user.role, email=user.email, name=user.full_name
    )

    AuditService.log(
        db,
        action="DOCTOR_LOGIN" if user.role == "DOCTOR" else "ADMIN_LOGIN",
        actor_id=user.id,
        actor_name=user.full_name,
        actor_role=user.role,
        target_entity="User",
        target_id=user.id,
        details=f"{user.role} {user.full_name} logged in successfully.",
    )

    return TokenResponse(
        access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
