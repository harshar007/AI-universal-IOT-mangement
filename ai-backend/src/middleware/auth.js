const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'nexus_super_secret_key_987654321';

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = { userId: 'default_operator', name: 'Operator', email: 'operator@nunnarri.io' };
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    req.user = { userId: 'default_operator', name: 'Operator', email: 'operator@nunnarri.io' };
    next();
  }
};
