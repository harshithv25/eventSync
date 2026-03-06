'use strict';
require('dotenv').config();
const app  = require('./app');
const pool = require('./db/pool');

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL connection verified');

    app.listen(PORT, () => {
      console.log(`🚀 EventScale API running at http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  }
};

start();
