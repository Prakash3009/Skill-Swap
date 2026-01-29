const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * Protects routes by verifying JWT tokens
 * Extracts userId from token and attaches to req.userId
 */

// Secret key for JWT (In production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'skillswap_secret_key_2024';

const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from Authorization header
        // ... (lines 14-38 omitted for brevity in replacement, but logically we just insert update here)
        // Note: The previous lines are inside the function. I will target the end of successful verification. 

        // Extract token and verify (restoring context)
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });

        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        if (!token) return res.status(401).json({ success: false, message: 'Invalid token format' });

        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;

        // TRACK ACTIVE STATUS
        await User.findByIdAndUpdate(req.userId, { lastActiveAt: new Date() });

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Authorization denied.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error during authentication'
        });
    }
};

// Export both the middleware and the secret for use in auth routes
module.exports = {
    authMiddleware,
    JWT_SECRET
};
