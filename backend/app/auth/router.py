from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.auth.schemas import LoginRequest, TokenResponse, UserMe
from app.auth.service import authenticate_user, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, request.username, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
        )
    token = create_access_token(user.id, user.role)
    return TokenResponse(access_token=token, role=user.role, full_name=user.full_name)


@router.get("/me", response_model=UserMe)
def get_me(current_user=Depends(get_current_user)):
    return current_user
