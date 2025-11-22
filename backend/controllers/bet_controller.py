from flask import Blueprint, request, jsonify
from models import User, Round
from database import db
from services.bet_service import place_bet
from services.auth_service import decode_token

bp = Blueprint('bet', __name__, url_prefix='/bet')

def get_user(req):
    token = req.headers.get('Authorization','').replace('Bearer ','')
    payload = decode_token(token)
    if not payload:
        return None
    return User.query.get(payload.get('uid'))

@bp.route('/place', methods=['POST'])
def place():
    u = get_user(request)
    if not u:
        return jsonify({'error':'unauthorized'}), 401
    data = request.json or {}
    choice = data.get('choice')
    amount = int(data.get('amount',0))
    round_id = int(data.get('round_id'))
    round_obj = Round.query.get(round_id)
    if not round_obj:
        return jsonify({'error':'invalid round'}), 400
    try:
        b = place_bet(u, round_obj, choice, amount)
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    return jsonify({'bet': b.to_dict(), 'user': u.to_dict()})
