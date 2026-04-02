const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Basic Validation
    if (!username || !email || !password) return res.status(400).json({ message: 'All fields are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (!email.includes('@')) return res.status(400).json({ message: 'Invalid email format' });

    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({ username, email, password });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User does not exist' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users (Protected)
router.get('/users', auth, async (req, res) => {
  try {
    const users = await User.find({}, 'username email avatar status online');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile (Protected)
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, avatar, status } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (username) user.username = username;
    if (avatar) user.avatar = avatar;
    if (status) user.status = status;

    await user.save();
    res.json({ id: user._id, username: user.username, email: user.email, avatar: user.avatar, status: user.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
