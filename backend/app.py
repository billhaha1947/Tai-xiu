from flask import Flask, send_from_directory
from config import *
from database import init_db, db
from models import *  # ensure models are registered
from controllers.auth_controller import bp as auth_bp
from controllers.user_controller import bp as user_bp
from controllers.bet_controller import bp as bet_bp
from controllers.chat_controller import bp as chat_bp
from controllers.admin_controller import bp as admin_bp
from controllers.round_controller import bp as round_bp
from ws import socketio, start_background_thread
import os

app = Flask(__name__, static_folder='../frontend', static_url_path='/')
app.config['DATABASE_PATH'] = DATABASE_PATH
app.config['SECRET_KEY'] = SECRET_KEY

init_db(app)

app.register_blueprint(auth_bp)
app.register_blueprint(user_bp)
app.register_blueprint(bet_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(round_bp)

# serve frontend static files when present
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    # serve frontend files
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    with app.app_context():
        # create tables if not exists
        db.create_all()
    start_background_thread(app)
    socketio.init_app(app, cors_allowed_origins='*')
    socketio.run(app, host='0.0.0.0', port=5000)
