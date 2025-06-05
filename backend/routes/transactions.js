const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  // GET all transactions for a user
  router.get('/:user_id', async (req, res) => {
    const { user_id } = req.params;
    try {
      const result = await pool.query(
        `SELECT * FROM transactions WHERE user_id = $1 ORDER BY transaction_date DESC`,
        [user_id]
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching transactions');
    }
  });

  // POST a new transaction
  router.post('/', async (req, res) => {
    const {
      user_id, account_id, amount, currency, transaction_type,
      category_id, description, transaction_date
    } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO transactions
         (user_id, account_id, amount, currency, transaction_type, category_id, description, transaction_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [user_id, account_id, amount, currency, transaction_type, category_id, description, transaction_date]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error creating transaction');
    }
  });

  return router;
};
