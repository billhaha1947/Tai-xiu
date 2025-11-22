import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, 'taixiu.db')
SECRET_KEY = os.environ.get('TAIXIU_SECRET') or 'change-me-to-strong-secret'
JWT_SECRET = os.environ.get('TAIXIU_JWT') or 'jwt-secret-change-me'
SYSTEM_WINRATE = float(os.environ.get('TAIXIU_WINRATE', '20.0'))  # percent house win
TOKEN_EXP_SECONDS = 60 * 60 * 24 * 7
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Socket settings
ROUND_DURATION = 20  # seconds per round
