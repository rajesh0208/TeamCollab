const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const config = require('../config/env');

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

async function signup(req, res) {
  const parse = signupSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: 'Invalid input', errors: parse.error.flatten() });
  const { email, password, name } = parse.data;
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email already in use' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash, name });
  const token = jwt.sign({ id: user._id.toString(), role: user.role, email: user.email }, config.jwtSecret, { expiresIn: '7d' });
  return res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
}

async function login(req, res) {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ message: 'Invalid input', errors: parse.error.flatten() });
  const { email, password } = parse.data;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id.toString(), role: user.role, email: user.email }, config.jwtSecret, { expiresIn: '7d' });
  return res.status(200).json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
}

module.exports = { signup, login };
