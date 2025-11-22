import bcrypt
import jwt
import time
from config import JWT_SECRET, TOKEN_EXP_SECONDS
from models import User
from database import db

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

def check_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def generate_token(user: User) -> str:
    payload = {
        'uid': user.id,
        'username': user.username,
        'exp': int(time.time()) + TOKEN_EXP_SECONDS
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def decode_token(token: str):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except Exception:
        return None
