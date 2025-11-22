from models import Chat, User
from database import db
from datetime import datetime, timedelta

# Simple anti-spam: track last message per user in-memory
_last_message = {}
COOLDOWN_SECONDS = 2

def can_send(user_id):
    key = user_id or 'anon'
    now = datetime.utcnow()
    last = _last_message.get(key)
    if last and (now - last).total_seconds() < COOLDOWN_SECONDS:
        return False
    _last_message[key] = now
    return True

def save_chat(user: User, username: str, avatar: str, message: str, room='lobby'):
    c = Chat(user_id=user.id if user else None, username=username, avatar=avatar, message=message, room=room)
    db.session.add(c)
    db.session.commit()
    return c

def get_history(room='lobby', limit=100):
    return Chat.query.filter_by(room=room).order_by(Chat.created_at.asc()).limit(limit).all()
