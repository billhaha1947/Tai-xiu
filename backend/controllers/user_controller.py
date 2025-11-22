from flask import Blueprint, request, jsonify
from services.auth_service import decode_token, hash_password
from database import db
from models import User
import os
from config import UPLOAD_FOLDER

bp = Blueprint('user', __name__, url_prefix='/user')

def auth_user_from_header(req):
    token = req.headers.get('Authorization','').replace('Bearer ','')
    payload = decode_token(token)
    if not payload:
        return None
    return User.query.get(payload.get('uid'))

@bp.route('/profile', methods=['GET'])
def profile():
    u = auth_user_from_header(request)
    if not u:
        return jsonify({'error':'unauthorized'}), 401
    return jsonify({'user': u.to_dict()})

@bp.route('/change_password', methods=['POST'])
def change_password():
    u = auth_user_from_header(request)
    if not u:
        return jsonify({'error':'unauthorized'}), 401
    data = request.json or {}
    old = data.get('old')
    new = data.get('new')
    from services.auth_service import check_password
    if not check_password(old, u.password_hash):
        return jsonify({'error':'wrong password'}), 400
    u.password_hash = hash_password(new)
    db.session.add(u)
    db.session.commit()
    return jsonify({'ok':True})

@bp.route('/upload_avatar', methods=['POST'])
def upload_avatar():
    u = auth_user_from_header(request)
    if not u:
        return jsonify({'error':'unauthorized'}), 401
    if 'avatar' not in request.files:
        return jsonify({'error':'no file'}), 400
    f = request.files['avatar']
    filename = f.filename
    safe = os.path.join(UPLOAD_FOLDER, f"{u.id}_{filename}")
    f.save(safe)
    u.avatar = '/static/uploads/' + os.path.basename(safe)
    db.session.add(u)
    db.session.commit()
    return jsonify({'user': u.to_dict()})
