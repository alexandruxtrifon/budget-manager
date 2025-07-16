const express = require("express");
const router = express.Router();
const authMiddleware = require("../authMiddleware");
const { logActivity } = require('../logActivity');
const { findMatchingCategory } = require('../services/utils');

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
        `SELECT t.*, a.name as account_name, c.name as category_name
         FROM transactions t
         JOIN accounts a ON t.account_id = a.account_id
         LEFT JOIN categories c on t.category_id = c.category_id
         WHERE t.user_id = $1
         ORDER BY t.transaction_date DESC`,
        [userId]
      );
    await logActivity(pool, req.user.user_id, 'VIEW_TRANSACTIONS', 'TRANSACTION', null, {
      user_email: req.user.email,
      transaction_count: result.rows.length,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

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
    await logActivity(pool, req.user.user_id, 'VIEW_ACCOUNT_TRANSACTIONS', 'TRANSACTION', null, {
      user_email: req.user.email,
      account_id: accountId,
      transaction_count: result.rows.length,
      date_range: startDate && endDate ? `${startDate} to ${endDate}` : 'all',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching account transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

  // POST a new transaction
  router.post("/", async (req, res) => {
    let {
      user_id,
      account_id,
      amount,
      currency,
      transaction_type,
      category_id,
      description,
      transaction_date,
    } = req.body;

    // If category_id is not provided, try to auto-attribute
    if (!category_id) {
      try {
        const categoriesResult = await pool.query('SELECT * FROM categories');
        const categories = categoriesResult.rows;
        category_id = findMatchingCategory(description, categories) || null;
      } catch (err) {
        console.error('Error auto-attributing category:', err);
        // fallback: leave category_id as null
      }
    }

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
    await logActivity(pool, user_id, 'CREATE_TRANSACTION', 'TRANSACTION', description, {
      account_id,
      amount,
      currency,
      transaction_type,
      category_id,
      transaction_date
    });
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error creating transaction");
    }
  });

  // PUT (update) a transaction
  router.put("/:transactionId", authMiddleware, async (req, res) => {
    try {
      const transactionId = req.params.transactionId;
      let {
        user_id,
        account_id,
        amount,
        currency,
        transaction_type,
        category_id,
        description,
        transaction_date,
      } = req.body;

      // First, verify the transaction exists and belongs to the authenticated user
      const existingTransaction = await pool.query(
        `SELECT * FROM transactions WHERE transaction_id = $1 AND user_id = $2`,
        [transactionId, req.user.user_id]
      );

      if (existingTransaction.rows.length === 0) {
        return res.status(404).json({ error: "Transaction not found or unauthorized" });
      }

      // If category_id is not provided, try to auto-attribute
      if (!category_id) {
        try {
          const categoriesResult = await pool.query('SELECT * FROM categories');
          const categories = categoriesResult.rows;
          category_id = findMatchingCategory(description, categories) || null;
        } catch (err) {
          console.error('Error auto-attributing category:', err);
          // fallback: leave category_id as null
        }
      }

      const result = await pool.query(
        `UPDATE transactions
         SET account_id = $1, amount = $2, currency = $3, transaction_type = $4, 
             category_id = $5, description = $6, transaction_date = $7, updated_at = NOW()
         WHERE transaction_id = $8 AND user_id = $9
         RETURNING *`,
        [
          account_id,
          amount,
          currency,
          transaction_type,
          category_id,
          description,
          transaction_date,
          transactionId,
          req.user.user_id,
        ]
      );

      await logActivity(pool, req.user.user_id, 'UPDATE_TRANSACTION', 'TRANSACTION', description, {
        transaction_id: transactionId,
        account_id,
        amount,
        currency,
        transaction_type,
        category_id,
        transaction_date
      });

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error updating transaction" });
    }
  });

  // DELETE a transaction
  router.delete("/:transactionId", authMiddleware, async (req, res) => {
    try {
      const transactionId = req.params.transactionId;

      // First, verify the transaction exists and belongs to the authenticated user
      const existingTransaction = await pool.query(
        `SELECT * FROM transactions WHERE transaction_id = $1 AND user_id = $2`,
        [transactionId, req.user.user_id]
      );

      if (existingTransaction.rows.length === 0) {
        return res.status(404).json({ error: "Transaction not found or unauthorized" });
      }

      const result = await pool.query(
        `DELETE FROM transactions WHERE transaction_id = $1 AND user_id = $2 RETURNING *`,
        [transactionId, req.user.user_id]
      );

      await logActivity(pool, req.user.user_id, 'DELETE_TRANSACTION', 'TRANSACTION', result.rows[0]?.description, {
        transaction_id: transactionId,
        account_id: result.rows[0]?.account_id,
        amount: result.rows[0]?.amount,
        transaction_type: result.rows[0]?.transaction_type
      });

      res.json({ message: "Transaction deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error deleting transaction" });
    }
  });

  return router;
};
