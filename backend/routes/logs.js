const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware');
const adminMiddleware = require('../adminMiddleware');
const { startOfMonth } = require('date-fns');

module.exports = (pool) => {
  router.get('/', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
      const userId = req.user.user_id;
      
      const query = `
        -- Accounts activity
        SELECT 
          'Account' as entity_type,
          'created' as action,
          a.name as entity_name,
          a.created_at as timestamp
        FROM accounts a
        
        UNION ALL
        
        SELECT 
          'Account' as entity_type,
          'updated' as action,
          a.name as entity_name,
          a.updated_at as timestamp
        FROM accounts a
        
        UNION ALL
        
        -- Transactions activity
        SELECT 
          'Transaction' as entity_type,
          'created' as action,
          t.description as entity_name,
          t.created_at as timestamp
        FROM transactions t
        
        UNION ALL
        
        SELECT 
          'Transaction' as entity_type,
          'updated' as action,
          t.description as entity_name,
          t.updated_at as timestamp
        FROM transactions t
        
        UNION ALL
        
        -- Categories activity
        SELECT 
          'Category' as entity_type,
          'created' as action,
          c.name as entity_name,
          c.created_at as timestamp
        FROM categories c
        
        UNION ALL
        
        SELECT 
          'Category' as entity_type,
          'updated' as action,
          c.name as entity_name,
          c.updated_at as timestamp
        FROM categories c
        
        UNION ALL
        
        -- Budgets activity
        SELECT 
          'Budget' as entity_type,
          'created' as action,
          (SELECT name FROM categories WHERE category_id = b.category_id) as entity_name,
          b.created_at as timestamp
        FROM budgets b
        
        UNION ALL
        
        SELECT 
          'Budget' as entity_type,
          'updated' as action,
          (SELECT name FROM categories WHERE category_id = b.category_id) as entity_name,
          b.updated_at as timestamp
        FROM budgets b
        
        ORDER BY timestamp DESC
        LIMIT 100;
      `;
      
      const result = await pool.query(query);
      
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching logs:', err);
      res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
  });
router.get('/stats', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    // Get timeframe from query
    const timeframe = req.query.timeframe || 'week';
    const now = new Date();
    let startDate;
    switch (timeframe) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    startDate.setHours(0, 0, 0, 0);

    // 1. Count logins in timeframe
    const loginsResult = await pool.query(
      `SELECT COUNT(*) FROM activity_logs 
       WHERE action = 'LOGIN_SUCCESS' 
       AND timestamp >= $1`,
      [startDate]
    );
    const todayLogins = parseInt(loginsResult.rows[0].count);

    // 2. Find most active user in timeframe
    const mostActiveUserResult = await pool.query(
      `SELECT user_id, COUNT(*) as login_count 
       FROM activity_logs 
       WHERE timestamp >= $1 
       GROUP BY user_id 
       ORDER BY login_count DESC 
       LIMIT 1`,
      [startDate]
    );
    let mostActiveUser = { email: 'No logins', count: 0 };
    if (mostActiveUserResult.rows.length > 0) {
      const userId = mostActiveUserResult.rows[0].user_id;
      const userResult = await pool.query(
        'SELECT email FROM users WHERE user_id = $1',
        [userId]
      );
      if (userResult.rows.length > 0) {
        mostActiveUser = {
          email: userResult.rows[0].email,
          count: parseInt(mostActiveUserResult.rows[0].login_count)
        };
      }
    }

    // 3. Get biggest income transaction in timeframe
    const biggestIncomeResult = await pool.query(
      `SELECT amount, currency, description 
       FROM transactions 
       WHERE transaction_type = 'income' 
       AND transaction_date >= $1
       ORDER BY amount DESC 
       LIMIT 1`,
      [startDate]
    );
    const biggestIncome = biggestIncomeResult.rows.length > 0
      ? {
          amount: parseFloat(biggestIncomeResult.rows[0].amount),
          currency: biggestIncomeResult.rows[0].currency,
          description: biggestIncomeResult.rows[0].description
        }
      : { amount: 0, currency: 'RON', description: 'No income transactions' };

    // 4. Get biggest expense transaction in timeframe
    const biggestExpenseResult = await pool.query(
      `SELECT amount, currency, description 
       FROM transactions 
       WHERE transaction_type = 'expense' 
       AND transaction_date >= $1
       ORDER BY amount DESC 
       LIMIT 1`,
      [startDate]
    );
    const biggestExpense = biggestExpenseResult.rows.length > 0
      ? {
          amount: parseFloat(biggestExpenseResult.rows[0].amount),
          currency: biggestExpenseResult.rows[0].currency,
          description: biggestExpenseResult.rows[0].description
        }
      : { amount: 0, currency: 'RON', description: 'No expense transactions' };

    // 5. Count new users in timeframe
    const newUsersResult = await pool.query(
      `SELECT COUNT(*) FROM users 
       WHERE created_at >= $1`,
      [startDate]
    );
    const newUsersThisMonth = parseInt(newUsersResult.rows[0].count);

    // 6. Count imported transactions in timeframe
    const importedTransactionsResult = await pool.query(
      `SELECT COUNT(*) FROM transactions WHERE transaction_date >= $1`,
      [startDate]
    );
    const importedTransactions = parseInt(importedTransactionsResult.rows[0].count);

    // 7. Count all transactions in timeframe
    const totalTransactionsResult = await pool.query(
      'SELECT COUNT(*), AVG(amount) FROM transactions WHERE transaction_date >= $1',
      [startDate]
    );
    const totalTransactions = parseInt(totalTransactionsResult.rows[0].count);
    const avgTransactionAmount = parseFloat(totalTransactionsResult.rows[0].avg || 0);

    // 8. Get login success/failure stats in timeframe
    const successfulLoginsResult = await pool.query(
      `SELECT COUNT(*) FROM activity_logs 
       WHERE action = 'LOGIN_SUCCESS' AND timestamp >= $1`,
      [startDate]
    );
    const failedLoginsResult = await pool.query(
      `SELECT COUNT(*) FROM activity_logs 
       WHERE (action = 'LOGIN_FAILED_EMAIL' OR action = 'LOGIN_FAILED_PASS' OR action = 'LOGIN_FAILED')
       AND timestamp >= $1`,
      [startDate]
    );
    const successfulLogins = parseInt(successfulLoginsResult.rows[0].count);
    const failedLogins = parseInt(failedLoginsResult.rows[0].count);

    res.json({
      todayLogins,
      mostActiveUser,
      biggestIncome,
      biggestExpense,
      newUsersThisMonth,
      importedTransactions,
      totalTransactions,
      avgTransactionAmount,
      successfulLogins,
      failedLogins
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch activity statistics' });
  }
});

// Add an endpoint to get all logs (for admin only)
router.get('/all', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, u.email as user_email
       FROM activity_logs l
       LEFT JOIN users u ON l.user_id = u.user_id
       ORDER BY l.timestamp DESC
       LIMIT 1000` // Limit to prevent huge responses
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all logs:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});
  return router;
};