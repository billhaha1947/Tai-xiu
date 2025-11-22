from flask import Blueprint, request, jsonify
from services.chat_service import get_history

bp = Blueprint('chat', __name__, url_prefix='/chat')

@bp.route('/history')
def history():
    room = request.args.get('room','lobby')
    msgs = get_history(room=room, limit=200)
    return jsonify({'messages': [m.to_dict() for m in msgs]})
