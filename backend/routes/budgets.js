const express = require('express');
const router = express.Router();

module.exports = (pool) => {
  router.get('/:user_id', async (req, res) => {
    const { user_id } = req.params;
    try {
      const result = await pool.query(
        `SELECT * FROM budgets WHERE user_id = $1 ORDER BY period_start DESC`,
        [user_id]
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching budgets');
    }
  });

  router.post('/', async (req, res) => {
    const {
      user_id, category_id, amount, period_start, period_end
    } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO budgets
         (user_id, category_id, amount, period_start, period_end)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [user_id, category_id, amount, period_start, period_end]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error creating budget');
    }
  });

  return router;
};
