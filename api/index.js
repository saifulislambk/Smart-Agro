// Vercel Serverless Function Adapter for Smart Agro Express Application
const app = require('../server');
const db = require('../db');

let dbInitialized = false;

module.exports = async (req, res) => {
  if (!dbInitialized) {
    try {
      await db.initDb();
    } catch (err) {
      console.warn('Serverless DB init warning:', err.message);
    }
    dbInitialized = true;
  }
  return app(req, res);
};
