from datetime import datetime
from database import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    avatar = db.Column(db.String(200), nullable=True)
    balance = db.Column(db.Integer, default=10000)
    is_admin = db.Column(db.Boolean, default=False)
    locked = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'avatar': self.avatar or '/static/avatar-default.png',
            'balance': self.balance,
            'is_admin': self.is_admin,
            'locked': self.locked,
            'created_at': self.created_at.isoformat(),
        }

class Round(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    ended_at = db.Column(db.DateTime, nullable=True)
    dice = db.Column(db.String(50), nullable=True)  # e.g. "1,3,5"
    result = db.Column(db.String(10), nullable=True)  # 'tai' or 'xiu'

    def to_dict(self):
        return {
            'id': self.id,
            'started_at': self.started_at.isoformat(),
            'ended_at': self.ended_at.isoformat() if self.ended_at else None,
            'dice': self.dice,
            'result': self.result,
        }

class Bet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    round_id = db.Column(db.Integer, db.ForeignKey('round.id'), nullable=False)
    choice = db.Column(db.String(10), nullable=False)  # 'tai' or 'xiu'
    amount = db.Column(db.Integer, nullable=False)
    won = db.Column(db.Boolean, nullable=True)
    paid = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'round_id': self.round_id,
            'choice': self.choice,
            'amount': self.amount,
            'won': self.won,
            'paid': self.paid,
            'created_at': self.created_at.isoformat(),
        }

class Chat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    username = db.Column(db.String(80), nullable=False)
    avatar = db.Column(db.String(200), nullable=True)
    message = db.Column(db.Text, nullable=False)
    room = db.Column(db.String(80), default='lobby')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.username,
            'avatar': self.avatar,
            'message': self.message,
            'room': self.room,
            'created_at': self.created_at.isoformat(),
        }
