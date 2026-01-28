const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * Protects routes by verifying JWT tokens
 * Extracts userId from token and attaches to req.userId
 */

// Secret key for JWT (In production, use environment variable)
const JWT_SECRET = 'skillswap_secret_key_2024';

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from Authorization header
        // Expected format: "Bearer <token>"
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Authorization denied.'
            });
        }

        // Extract token from "Bearer <token>"
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : authHeader;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format. Authorization denied.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Attach userId to request object
        req.userId = decoded.userId;

        // Continue to next middleware/route
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
