const express = require("express");
const router = express.Router();
const authMiddleware = require("../authMiddleware");

module.exports = (pool) => {
  // GET all transactions for a user
  router.get("/:userId", authMiddleware, async (req, res) => {
    try {
      const userId = req.params.userId;

      // Validate that the authenticated user is requesting their own data
      if (req.user.user_id != userId) {
        return res
          .status(403)
          .json({ error: "Unauthorized access to this resource" });
      }

      const result = await pool.query(
        `SELECT t.*, a.name as account_name 
         FROM transactions t
         JOIN accounts a ON t.account_id = a.account_id
         WHERE t.user_id = $1
         ORDER BY t.transaction_date DESC`,
        [userId]
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Add this route to your existing transactions.js file
router.get('/account/:accountId', authMiddleware, async (req, res) => {
  try {
    const accountId = req.params.accountId;
    const { startDate, endDate } = req.query;
    
    // Ensure the account belongs to the authenticated user
    const accountCheck = await pool.query(
      'SELECT user_id FROM accounts WHERE account_id = $1',
      [accountId]
    );
    
    if (accountCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    if (accountCheck.rows[0].user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Unauthorized access to this account' });
    }
    
    let query = `
      SELECT t.*, c.name AS category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.category_id
      WHERE t.account_id = $1
    `;
    
    const queryParams = [accountId];
    
    // Add date filtering if provided
    if (startDate && endDate) {
      query += ' AND t.transaction_date::date BETWEEN $2::date AND $3::date';
      queryParams.push(startDate, endDate);
    }
    
    query += ' ORDER BY t.transaction_date DESC';
    
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching account transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

  // POST a new transaction
  router.post("/", async (req, res) => {
    const {
      user_id,
      account_id,
      amount,
      currency,
      transaction_type,
      category_id,
      description,
      transaction_date,
    } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO transactions
         (user_id, account_id, amount, currency, transaction_type, category_id, description, transaction_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          user_id,
          account_id,
          amount,
          currency,
          transaction_type,
          category_id,
          description,
          transaction_date,
        ]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error creating transaction");
    }
  });

  return router;
};
