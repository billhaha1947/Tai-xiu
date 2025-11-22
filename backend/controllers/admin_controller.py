from flask import Blueprint, request, jsonify
from models import User, Bet, Chat
from database import db
from services.admin_service import set_balance, lock_user
from services.auth_service import decode_token

bp = Blueprint('admin', __name__, url_prefix='/admin')

def is_admin(req):
    token = req.headers.get('Authorization','').replace('Bearer ','')
    payload = decode_token(token)
    if not payload:
        return False
    u = User.query.get(payload.get('uid'))
    return u and u.is_admin

@bp.route('/users')
def users():
    if not is_admin(request):
        return jsonify({'error':'unauthorized'}), 401
    us = User.query.order_by(User.balance.desc()).all()
    return jsonify({'users':[u.to_dict() for u in us]})

@bp.route('/set_balance', methods=['POST'])
def api_set_balance():
    if not is_admin(request):
        return jsonify({'error':'unauthorized'}), 401
    data = request.json or {}
    user_id = data.get('user_id')
    amount = data.get('amount')
    u = set_balance(user_id, amount)
    return jsonify({'user': u.to_dict()})

@bp.route('/lock', methods=['POST'])
def api_lock():
    if not is_admin(request):
        return jsonify({'error':'unauthorized'}), 401
    data = request.json or {}
    user_id = data.get('user_id')
    locked = bool(data.get('locked', True))
    u = lock_user(user_id, locked)
    return jsonify({'user': u.to_dict()})

@bp.route('/bets')
def bets():
    if not is_admin(request):
        return jsonify({'error':'unauthorized'}), 401
    bs = Bet.query.order_by(Bet.created_at.desc()).limit(500).all()
    return jsonify({'bets':[b.to_dict() for b in bs]})

@bp.route('/chats')
def chats():
    if not is_admin(request):
        return jsonify({'error':'unauthorized'}), 401
    cs = Chat.query.order_by(Chat.created_at.desc()).limit(500).all()
    return jsonify({'chats':[c.to_dict() for c in cs]})
