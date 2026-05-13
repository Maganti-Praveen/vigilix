const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'vigilix-dev-secret-change-in-production';

/**
 * Generate JWT token for user
 */
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Express middleware: Authenticate JWT from Authorization header
 * Sets req.userId on success
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Socket.IO middleware: Authenticate JWT from handshake auth
 * Sets socket.userId on success
 */
function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token;

  if (!token) {
    // Allow unauthenticated connections (backward compatible with v1.0)
    console.log('[Auth] Socket connected without auth (legacy mode)');
    return next();
  }

  try {
    const decoded = verifyToken(token);
    socket.userId = decoded.userId;
    socket.deviceId = socket.handshake.auth?.deviceId;
    console.log(`[Auth] Socket authenticated: user=${decoded.userId}`);
    next();
  } catch (error) {
    console.log('[Auth] Socket auth failed:', error.message);
    next(new Error('Authentication failed'));
  }
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  authenticateSocket,
  JWT_SECRET,
};
