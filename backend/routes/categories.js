const express = require("express");
const router = express.Router();
const authMiddleware = require("../authMiddleware");
const adminMiddleware = require("../adminMiddleware");
const { logActivity } = require('../logActivity');

module.exports = (pool) => {
  // Get all categories (system + user's categories)
  router.get("/", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.user_id;
      
      // Get both system categories (user_id IS NULL) and user's custom categories
      const result = await pool.query(
        `SELECT * FROM categories 
         ORDER BY name ASC`
      );
      
      res.json(result.rows);
      //console.log("Fetched categories for user:", result.rows);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Get a specific category
  router.get("/:id", authMiddleware, async (req, res) => {
    try {
      const categoryId = req.params.id;
      const userId = req.user.user_id;
      
      const result = await pool.query(
        `SELECT * FROM categories WHERE category_id = $1`,
        [categoryId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  // Create a new custom category for user
  router.post("/", authMiddleware, async (req, res) => {
    try {
      const { name, match_keywords } = req.body;
      const userId = req.user.user_id;
      
      const result = await pool.query(
        `INSERT INTO categories (name, match_keywords)
         VALUES ($1, $2)
         RETURNING *`,
        [name, match_keywords || []]
      );
      
      await logActivity(pool, userId, 'CREATE_CATEGORY', 'CATEGORY', name, {
        user_email: req.user.email
      });
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  // Update a category (only user's custom categories or admin updating system categories)
  router.put("/:id", authMiddleware, async (req, res) => {
    try {
      const categoryId = req.params.id;
      const { name, match_keywords } = req.body;
      const userId = req.user.user_id;
      
      // Check if category exists
      const categoryCheck = await pool.query(
        `SELECT * FROM categories WHERE category_id = $1`,
        [categoryId]
      );
      
      if (categoryCheck.rows.length === 0) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      // Only admins can update categories
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to update categories" });
      }
      
      const result = await pool.query(
        `UPDATE categories 
         SET name = $1, match_keywords = $2
         WHERE category_id = $3
         RETURNING *`,
        [name, match_keywords || [], categoryId]
      );
      
      await logActivity(pool, userId, 'UPDATE_CATEGORY', 'CATEGORY', name, {
        user_email: req.user.email,
        category_id: categoryId
      });
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  // Delete a category (only user's custom categories)
  router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const categoryId = req.params.id;
      const userId = req.user.user_id;
      
      // Check if category exists
      const categoryCheck = await pool.query(
        `SELECT * FROM categories WHERE category_id = $1`,
        [categoryId]
      );
      
      if (categoryCheck.rows.length === 0) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      const category = categoryCheck.rows[0];
      
      // Check if category is in use
      const transactionCheck = await pool.query(
        `SELECT COUNT(*) FROM transactions WHERE category_id = $1`,
        [categoryId]
      );
      
      if (parseInt(transactionCheck.rows[0].count) > 0) {
        return res.status(400).json({ 
          error: "Category is in use by transactions. Reassign transactions before deleting." 
        });
      }
      
      await pool.query(
        `DELETE FROM categories WHERE category_id = $1`,
        [categoryId]
      );
      
      await logActivity(pool, userId, 'DELETE_CATEGORY', 'CATEGORY', category.name, {
        user_email: req.user.email,
        category_id: categoryId
      });
      
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  return router;
};