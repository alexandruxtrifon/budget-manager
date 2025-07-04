const logActivity = async (pool, userId, action, entityType, entityName = null, details = null) => {
  try {
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_name, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, entityType, entityName, details ? JSON.stringify(details) : null]
    );
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

module.exports = { logActivity };