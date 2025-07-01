const express = require('express');
const router = express.Router();
const authMiddleware = require('../authMiddleware');
const adminMiddleware = require('../adminMiddleware');

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

  return router;
};