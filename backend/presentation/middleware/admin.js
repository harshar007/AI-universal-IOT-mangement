const { userPool } = require('../../config/db');

module.exports = async (req, res, next) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }

  try {
    const result = await userPool.query('SELECT role FROM users WHERE id = $1', [req.user.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRole = result.rows[0].role;
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    req.user.role = userRole; // Attach verified role to request
    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    return res.status(500).json({ error: 'Server error verifying admin privileges' });
  }
};
