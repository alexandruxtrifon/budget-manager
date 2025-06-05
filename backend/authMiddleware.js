// const jwt = require('jsonwebtoken');

// function authenticateToken(req, res, next) {
//   const authHeader = req.headers['authorization']; // Bearer <token>
//   const token = authHeader && authHeader.split(' ')[1];

//   if (!token) return res.status(401).json({ error: 'Missing token' });

//   jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//     if (err) return res.status(403).json({ error: 'Invalid token' });

//     req.user = user; // Add user info to request
//     next();
//   });
// }

// module.exports = authenticateToken;

const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  // Check if the header starts with 'Bearer '
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token format is invalid' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied (after Bearer check)' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add user payload to request object
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ error: 'Token is not valid' });
  }
};
