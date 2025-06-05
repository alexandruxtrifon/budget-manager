// const client = require('../db');

// module.exports = async function (req, res) {
//   if (req.method === 'GET') {
//     const result = await client.query('SELECT * FROM accounts WHERE user_id = 1');
//     res.writeHead(200, { 'Content-Type': 'application/json' });
//     res.end(JSON.stringify(result.rows));
//   }

//   if (req.method === 'POST') {
//     let body = '';
//     req.on('data', chunk => body += chunk);
//     req.on('end', async () => {
//       const data = JSON.parse(body);
//       await client.query(
//         `INSERT INTO accounts (user_id, name, account_type, currency, initial_balance, current_balance)
//          VALUES ($1, $2, $3, $4, $5, $5)`,
//         [1, data.name, data.account_type, data.currency, data.initial_balance]
//       );
//       res.writeHead(201);
//       res.end('Account created');
//     });
//   }
// };

const express = require('express');
const router = express.Router();

// Accepts a pool instance as dependency injection
module.exports = (pool) => {
  // GET /api/accounts
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM accounts ORDER BY account_id');
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching accounts');
    }
  });

  // POST /api/accounts
  router.post('/', async (req, res) => {
    const { name, account_type, currency, initial_balance } = req.body;
    try {
      const result = await pool.query(
        `INSERT INTO accounts (user_id, name, account_type, currency, initial_balance, current_balance)
         VALUES (1, $1, $2, $3, $4, $4) RETURNING *`,
        [name, account_type, currency, initial_balance]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error creating account');
    }
  });

  return router;
};

