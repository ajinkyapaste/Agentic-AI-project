const jwt = require('jsonwebtoken');
const { prisma } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-sales-intelligence-jwt-secret';

/**
 * Middleware to authenticate requests via JWT Bearer token
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : null) || req.query.token || (req.cookies && req.cookies.token);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, email: true, role: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User account not found.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.',
    });
  }
}

/**
 * Middleware to restrict endpoints to admin users
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Admin privileges required.',
    });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
  JWT_SECRET,
};

