from sqlalchemy.orm import Session
from app.models.models import ActivityLog


def log_activity(db: Session, user_id: int, activity_type: str, description: str = "", metadata: dict = None):
    try:
        log = ActivityLog(
            user_id=user_id,
            activity_type=activity_type,
            description=description,
            metadata=metadata or {},
        )
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()
