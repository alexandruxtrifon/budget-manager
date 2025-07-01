const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token format is invalid' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied (after Bearer check)' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //req.user = decoded; // Add user payload to request object
      req.user = {
      user_id: decoded.user_id,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ error: 'Token is not valid' });
  }
};
