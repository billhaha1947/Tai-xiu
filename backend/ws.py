import time
import threading
import random
from flask_socketio import SocketIO, emit, join_room, leave_room
from models import Round
from database import db
from config import ROUND_DURATION, SYSTEM_WINRATE
from services.ws_service import random_three_dice_for, dice_sum_to_result
from services.bet_service import settle_bets

socketio = SocketIO(async_mode='eventlet', cors_allowed_origins='*')

# Game loop thread
_game_thread = None
_current_round = None
_round_lock = threading.Lock()

def start_background_thread(app):
    global _game_thread
    if _game_thread is None:
        _game_thread = socketio.start_background_task(target=game_loop, app=app)

def game_loop(app):
    with app.app_context():
        while True:
            # create round
            r = Round()
            db.session.add(r)
            db.session.commit()
            global _current_round
            with _round_lock:
                _current_round = r
            socketio.emit('round_start', {'round': r.to_dict()})
            # countdown
            for t in range(ROUND_DURATION, 0, -1):
                socketio.emit('round_tick', {'left': t, 'round_id': r.id})
                time.sleep(1)
            # close bets and roll
            dice = random_three_dice_for(random.choice(['tai','xiu']))
            total = sum(dice)
            result = dice_sum_to_result(total)
            r.dice = ','.join(map(str, dice))
            r.result = result
            r.ended_at = time.strftime('%Y-%m-%d %H:%M:%S')
            db.session.add(r)
            db.session.commit()
            # settle bets
            settled = settle_bets(r, result)
            socketio.emit('round_end', {'round': r.to_dict(), 'settled': [b.to_dict() for b in settled]})
            time.sleep(2)

@socketio.on('connect')
def on_connect():
    emit('connected', {'msg':'ok'})

@socketio.on('join')
def on_join(data):
    room = data.get('room','lobby')
    join_room(room)
    emit('joined', {'room':room})

@socketio.on('leave')
def on_leave(data):
    room = data.get('room','lobby')
    leave_room(room)
    emit('left', {'room':room})
