const Database = require('better-sqlite3');
const { DB_PATH } = require('./config');

const db = new Database(DB_PATH);

// expose helper
function run(sql, params=[]) { return db.prepare(sql).run(...params); }
function all(sql, params=[]) { return db.prepare(sql).all(...params); }
function get(sql, params=[]) { return db.prepare(sql).get(...params); }

module.exports = { db, run, all, get };
