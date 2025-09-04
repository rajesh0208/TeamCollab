const { Router } = require('express');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const router = Router();

router.get('/me', authenticateJWT, (req, res) => {
  return res.json({ user: req.user });
});

router.get('/admin', authenticateJWT, requireRole(['admin']), (_req, res) => {
  return res.json({ message: 'Welcome, admin!' });
});

module.exports = router;
