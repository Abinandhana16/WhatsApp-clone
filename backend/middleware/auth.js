const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No authentication token, access denied' });

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) return res.status(401).json({ message: 'Token verification failed, access denied' });

    req.user = { _id: verified.id };
    next();
  } catch (err) {
    res.status(500).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
