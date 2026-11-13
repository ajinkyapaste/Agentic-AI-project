const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticates user credentials and returns JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.trim() },
          { email: username.trim() },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user information
 */
router.get('/me', authenticateToken, async (req, res) => {
  return res.json({
    success: true,
    user: req.user,
  });
});

/**
 * POST /api/auth/register
 * Allows creating additional users (Admin or Analyst)
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email and password are required.',
      });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Username or email is already registered.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.trim(),
        passwordHash,
        role: role === 'ADMIN' ? 'ADMIN' : 'ANALYST',
      },
    });

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration.',
    });
  }
});

module.exports = router;

