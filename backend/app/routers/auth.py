from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    create_password_reset_token,
    decode_password_reset_token,
    generate_client_id,
    hash_password,
    password_fingerprint_matches,
    verify_password,
)
from app.config import get_settings
from app.database import get_db
from app.deps import get_current_user
from app.emailer import send_password_reset_email
from app.models import User
from app.schemas import (
    AuthResponse,
    AvatarUpdateRequest,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UserOut,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Ensure unique client_id
    client_id = generate_client_id()
    while db.query(User).filter(User.client_id == client_id).first():
        client_id = generate_client_id()

    user = User(
        client_id=client_id,
        name=payload.name.strip(),
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        company=(payload.company or "").strip() or None,
        city=(payload.city or "").strip() or None,
        country=(payload.country or "").strip() or None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return AuthResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    return AuthResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, background: BackgroundTasks, db: Session = Depends(get_db)):
    """Always answers the same way so it can't be used to discover which emails are registered."""
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user:
        token = create_password_reset_token(user.id, user.hashed_password)
        url = f"{get_settings().frontend_url.rstrip('/')}/reset-password?token={token}"
        background.add_task(send_password_reset_email, user.email, user.name, url)
    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    decoded = decode_password_reset_token(payload.token)
    user = db.get(User, decoded[0]) if decoded else None
    if not user or not password_fingerprint_matches(user.hashed_password, decoded[1]):
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired")
    user.hashed_password = hash_password(payload.password)
    db.commit()
    return {"message": "Password updated. You can now sign in."}


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if payload.current_password == payload.password:
        raise HTTPException(status_code=400, detail="New password must be different from the current one")
    current_user.hashed_password = hash_password(payload.password)
    db.commit()
    return {"message": "Password updated"}


@router.patch("/me", response_model=UserOut)
def update_profile(
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Updates name and phone. Email is intentionally not editable."""
    fields = payload.model_fields_set
    if "name" in fields and payload.name is not None:
        current_user.name = payload.name.strip()
    if "phone" in fields:
        raw = (payload.phone or "").strip()
        if raw:
            digits = "".join(ch for ch in raw if ch.isdigit())
            if not 10 <= len(digits) <= 15:
                raise HTTPException(status_code=422, detail="Enter a valid phone number (10-15 digits)")
            current_user.phone = ("+" if raw.startswith("+") else "") + digits
        else:
            current_user.phone = None
    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)


_AVATAR_PREFIXES = ("data:image/jpeg;base64,", "data:image/png;base64,", "data:image/webp;base64,")


@router.put("/avatar", response_model=UserOut)
def set_avatar(
    payload: AvatarUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.image.startswith(_AVATAR_PREFIXES):
        raise HTTPException(status_code=422, detail="Profile picture must be a JPEG, PNG or WebP image")
    current_user.avatar = payload.image
    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)


@router.delete("/avatar", response_model=UserOut)
def remove_avatar(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.avatar = None
    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)
