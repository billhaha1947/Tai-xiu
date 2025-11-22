const path = require('path');

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'change-me-very-secret',
  UPLOAD_DIR: path.join(__dirname, 'uploads'),
  DB_PATH: path.join(__dirname, 'taixiu.db'),
  ROUND_SECONDS: parseInt(process.env.ROUND_SECONDS || '20', 10),
  SYSTEM_WINRATE_DEFAULT: parseFloat(process.env.SYSTEM_WINRATE || '20'), // %
};
