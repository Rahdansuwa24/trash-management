const mysql = require('mysql2/promise');
const env = require('../src/config/env');

const poolConfig = {
  host: env.DB.host,
  port: env.DB.port,
  user: env.DB.user,
  password: env.DB.password,
  database: env.DB.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 10000
};

if (env.DB.ssl) {
  poolConfig.ssl = {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: false
  };
}

const pool = mysql.createPool(poolConfig);

pool.on('connection', (connection) => {
  if (env.NODE_ENV !== 'test') {
    // Session level configuration if needed
  }
});

module.exports = pool;
