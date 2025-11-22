from flask import Blueprint, jsonify, request
from models import Round
from database import db

bp = Blueprint('round', __name__, url_prefix='/round')

@bp.route('/current')
def current():
    r = Round.query.order_by(Round.started_at.desc()).first()
    if not r:
        return jsonify({'round': None})
    return jsonify({'round': r.to_dict()})

@bp.route('/history')
def history():
    rs = Round.query.order_by(Round.started_at.desc()).limit(100).all()
    return jsonify({'rounds': [r.to_dict() for r in rs]})
