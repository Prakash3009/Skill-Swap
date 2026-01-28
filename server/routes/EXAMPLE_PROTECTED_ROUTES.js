/**
 * EXAMPLE: How to Protect Existing Routes with Authentication
 * 
 * This file demonstrates how to update your existing routes
 * to require authentication using the authMiddleware
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Skill = require('../models/Skill');
const User = require('../models/User');

// ============================================
// EXAMPLE 1: Protect a Single Route
// ============================================

// Public route - anyone can search
router.get('/search', async (req, res) => {
    try {
        const { skillName } = req.query;
        const skills = await Skill.find({
            skillName: { $regex: skillName, $options: 'i' },
            type: 'offered'
        }).populate('userId');

        res.json({
            success: true,
            count: skills.length,
            data: skills
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Protected route - only authenticated users can add skills
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { skillName, level, category, type } = req.body;

        // req.userId is available from authMiddleware
        const userId = req.userId;

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Create new skill
        const skill = new Skill({
            skillName,
            level: level || 'Beginner',
            category: category || 'Other',
            userId,
            type
        });

        await skill.save();

        // Update user's skill arrays
        if (type === 'offered') {
            user.skillsOffered.push(skill._id);
        } else if (type === 'wanted') {
            user.skillsWanted.push(skill._id);
        }
        await user.save();

        res.status(201).json({
            success: true,
            message: 'Skill added successfully',
            data: skill
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// ============================================
// EXAMPLE 2: Protect All Routes After a Point
// ============================================

// All routes below this line require authentication
router.use(authMiddleware);

router.get('/my-skills', async (req, res) => {
    try {
        // req.userId is available
        const skills = await Skill.find({ userId: req.userId });

        res.json({
            success: true,
            count: skills.length,
            data: skills
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const skill = await Skill.findById(req.params.id);

        // Verify ownership
        if (skill.userId.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this skill'
            });
        }

        await skill.remove();

        res.json({
            success: true,
            message: 'Skill deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// EXAMPLE 3: Optional Authentication
// ============================================

// Middleware to optionally attach userId if token exists
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            const jwt = require('jsonwebtoken');
            const { JWT_SECRET } = require('../middleware/auth');

            const decoded = jwt.verify(token, JWT_SECRET);
            req.userId = decoded.userId;
        }

        next();
    } catch (error) {
        // If token is invalid, just continue without userId
        next();
    }
};

router.get('/browse', optionalAuth, async (req, res) => {
    try {
        const skills = await Skill.find({ type: 'offered' })
            .populate('userId');

        // If user is logged in, exclude their own skills
        const filteredSkills = req.userId
            ? skills.filter(s => s.userId._id.toString() !== req.userId)
            : skills;

        res.json({
            success: true,
            count: filteredSkills.length,
            data: filteredSkills,
            isAuthenticated: !!req.userId
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

// ============================================
// FRONTEND EXAMPLES
// ============================================

/*
// Example 1: Making an authenticated request
async function addSkill() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3000/api/skills', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      skillName: 'JavaScript',
      level: 'Advanced',
      category: 'Tech',
      type: 'offered'
    })
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('Skill added!', result.data);
  } else {
    console.error('Error:', result.message);
  }
}

// Example 2: Using the authenticatedFetch helper
async function getMySkills() {
  const response = await authenticatedFetch('http://localhost:3000/api/skills/my-skills');
  const result = await response.json();
  
  if (result.success) {
    console.log('My skills:', result.data);
  }
}

// Example 3: Handling 401 errors (token expired/invalid)
async function makeAuthRequest() {
  try {
    const response = await authenticatedFetch('http://localhost:3000/api/skills/my-skills');
    
    if (response.status === 401) {
      // Token expired or invalid
      showAlert('Session expired. Please login again.', 'danger');
      logout(); // Redirect to login
      return;
    }

    const result = await response.json();
    // Handle success
  } catch (error) {
    console.error('Request failed:', error);
  }
}
*/
