from sqlalchemy.orm import Session
from app.models.models import User
from app.schemas.schemas import UserCreate


def get_or_create_user(db: Session, data: UserCreate) -> User:
    user = db.query(User).filter(User.device_id == data.device_id).first()
    if not user:
        user = User(
            device_id=data.device_id,
            language=data.language,
            district=data.district or "Chennai",
            state=data.state or "Tamil Nadu",
            name=data.name,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if data.language:
            user.language = data.language
            db.commit()
            db.refresh(user)
    return user


def update_user_language(db: Session, user_id: int, language: str) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.language = language
        db.commit()
        db.refresh(user)
    return user
