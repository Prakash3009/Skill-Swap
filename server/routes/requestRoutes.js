const express = require('express');
const router = express.Router();
const MentorshipRequest = require('../models/MentorshipRequest');
const User = require('../models/User');
const Skill = require('../models/Skill');

const Transaction = require('../models/Transaction');

/**
 * Mentorship Request Routes
 * Handles request creation, acceptance, and completion
 * Implements coin system logic
 */

// @route   POST /api/requests
// @desc    Send a mentorship request (costs 2 coins)
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { learnerId, mentorId, skillId, message } = req.body;

        // Validate required fields
        if (!learnerId || !mentorId || !skillId) {
            return res.status(400).json({
                success: false,
                message: 'LearnerId, mentorId, and skillId are required'
            });
        }

        // Verify learner exists and has enough coins
        const learner = await User.findById(learnerId);
        if (!learner) {
            return res.status(404).json({
                success: false,
                message: 'Learner not found'
            });
        }

        if (learner.coins < 2) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient coins. You need at least 2 coins to send a request.'
            });
        }

        // Verify mentor exists
        const mentor = await User.findById(mentorId);
        if (!mentor) {
            return res.status(404).json({
                success: false,
                message: 'Mentor not found'
            });
        }

        // Verify skill exists
        const skill = await Skill.findById(skillId);
        if (!skill) {
            return res.status(404).json({
                success: false,
                message: 'Skill not found'
            });
        }

        // Deduct 2 coins from learner
        learner.coins -= 2;
        await learner.save();

        // Log spend transaction
        const transaction = new Transaction({
            userId: learnerId,
            type: 'spend',
            amount: 2,
            description: `Sent Mentorship Request to ${mentor.name}`
        });
        await transaction.save();

        // Create mentorship request
        const request = new MentorshipRequest({
            learnerId,
            mentorId,
            skillId,
            message: message || '',
            status: 'pending'
        });

        await request.save();

        res.status(201).json({
            success: true,
            message: 'Mentorship request sent successfully. 2 coins deducted.',
            data: request,
            remainingCoins: learner.coins
        });
    } catch (error) {
        console.error('Error creating request:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   PUT /api/requests/:id/accept
// @desc    Accept a mentorship request
// @access  Public
router.put('/:id/accept', async (req, res) => {
    try {
        const request = await MentorshipRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending requests can be accepted'
            });
        }

        // Update request status
        request.status = 'accepted';
        request.acceptedAt = new Date();
        await request.save();

        res.json({
            success: true,
            message: 'Request accepted successfully',
            data: request
        });
    } catch (error) {
        console.error('Error accepting request:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   PUT /api/requests/:id/complete
// @desc    Mark mentorship as completed (Waiting for feedback)
// @access  Public
router.put('/:id/complete', async (req, res) => {
    try {
        const request = await MentorshipRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        if (request.status !== 'accepted') {
            return res.status(400).json({
                success: false,
                message: 'Only accepted requests can be completed'
            });
        }

        // Update request status
        request.status = 'completed';
        request.completedAt = new Date();
        await request.save();

        res.json({
            success: true,
            message: 'Mentorship marked as completed. Waiting for learner feedback to release coins.',
            data: request
        });
    } catch (error) {
        console.error('Error completing request:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   GET /api/requests/user/:userId
// @desc    Get all requests for a user (both as learner and mentor)
// @access  Public
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Get requests where user is learner
        const asLearner = await MentorshipRequest.find({ learnerId: userId })
            .populate('mentorId')
            .populate('skillId')
            .sort({ createdAt: -1 });

        // Get requests where user is mentor
        const asMentor = await MentorshipRequest.find({ mentorId: userId })
            .populate('learnerId')
            .populate('skillId')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                outgoing: asLearner,  // Requests sent by user
                incoming: asMentor    // Requests received by user
            }
        });
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   PUT /api/requests/:id/notes
// @desc    Add or update session notes (Mentor only)
// @access  Public (Should be protected in production)
router.put('/:id/notes', async (req, res) => {
    try {
        const { sessionNotes } = req.body;
        const request = await MentorshipRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        if (request.status !== 'accepted') {
            return res.status(400).json({
                success: false,
                message: 'Can only add notes to accepted requests'
            });
        }

        request.sessionNotes = sessionNotes || '';
        await request.save();

        res.json({
            success: true,
            message: 'Session notes updated successfully',
            data: request
        });
    } catch (error) {
        console.error('Error updating notes:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/requests/:id/quiz
// @desc    Mentor sets a quiz for the mentorship request
// @access  Public (Should be Private in prod)
router.post('/:id/quiz', async (req, res) => {
    try {
        const { questions } = req.body;
        const request = await MentorshipRequest.findById(req.params.id);

        if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

        // MVP: Assume caller is mentor (validation skipped for brevity)
        if (request.status !== 'accepted') {
            return res.status(400).json({ success: false, message: 'Can only add quiz to accepted requests' });
        }

        request.quiz = {
            questions: questions.map(q => ({
                text: q.text,
                options: q.options,
                correctAnswer: q.correctAnswer
            })),
            isEnabled: true
        };

        // Reset any previous score if quiz changes
        request.quizScore = null;

        await request.save();

        res.json({ success: true, message: 'Quiz assigned successfully', data: request });
    } catch (error) {
        console.error('Error assigning quiz:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/requests/:id/quiz/submit
// @desc    Learner submits quiz answers. Pass (2/3) => Completed.
// @access  Public (Should be Private in prod)
router.post('/:id/quiz/submit', async (req, res) => {
    try {
        const { answers } = req.body; // Array of indices like [0, 2, 1]
        const request = await MentorshipRequest.findById(req.params.id);

        if (!request || !request.quiz.isEnabled) {
            return res.status(404).json({ success: false, message: 'Quiz not found or disabled' });
        }

        let correctCount = 0;
        const questions = request.quiz.questions;

        if (answers.length !== questions.length) {
            return res.status(400).json({ success: false, message: 'Answer all questions' });
        }

        // Evaluate
        answers.forEach((ans, index) => {
            if (ans === questions[index].correctAnswer) correctCount++;
        });

        request.quizScore = correctCount;

        // Pass Logic: Need >= 66% (e.g., 2 out of 3, or 1 out of 1)
        const total = questions.length;
        const passed = (correctCount / total) >= 0.66;

        let message = `You scored ${correctCount}/${total}. `;

        if (passed) {
            message += 'Congratulations! Mentorship marked as completed.';
            request.status = 'completed';
            request.completedAt = new Date();

            // Award 3 coins to mentor (Logic duplicated from complete route)
            // Ideally extract this to a helper, but for MVP keeping it inline
            const mentor = await User.findById(request.mentorId);
            if (mentor) {
                mentor.coins += 3;
                await mentor.save();

                const transaction = new Transaction({
                    userId: mentor._id,
                    type: 'earn',
                    amount: 3,
                    description: `Session Expert Reward (Quiz Passed by Learner)`
                });
                await transaction.save();
            }

            // Award 1 coin to learner (New Logic)
            const learner = await User.findById(request.learnerId);
            if (learner) {
                learner.coins += 1;
                await learner.save();

                const transaction = new Transaction({
                    userId: learner._id,
                    type: 'earn',
                    amount: 1,
                    description: `Course Completion Reward (Quiz Passed)`
                });
                await transaction.save();

                message += ' You earned 1 🪙 coin!';
            }

        } else {
            message += 'Please review the material and try again.';
            // Do not complete request, let them retry
        }

        await request.save();

        res.json({
            success: true,
            passed,
            score: correctCount,
            total,
            message,
            data: request
        });

    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ========================================
// MESSAGING & SCHEDULING ROUTES
// ========================================

const Message = require('../models/Message');

// @route   POST /api/requests/:id/message
// @desc    Send a message in a mentorship request thread
// @access  Public (should be private in production)
router.post('/:id/message', async (req, res) => {
    try {
        const { senderId, message } = req.body;
        const requestId = req.params.id;

        if (!senderId || !message) {
            return res.status(400).json({
                success: false,
                message: 'SenderId and message are required'
            });
        }

        // Verify request exists
        const request = await MentorshipRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        // Verify sender is part of this request
        if (senderId !== request.learnerId.toString() && senderId !== request.mentorId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to message in this request'
            });
        }

        // Create message
        const newMessage = new Message({
            requestId,
            senderId,
            message
        });

        await newMessage.save();
        await newMessage.populate('senderId', 'name email');

        res.status(201).json({
            success: true,
            message: 'Message sent',
            data: newMessage
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/requests/:id/messages
// @desc    Get all messages for a mentorship request
// @access  Public (should be private in production)
router.get('/:id/messages', async (req, res) => {
    try {
        const messages = await Message.find({ requestId: req.params.id })
            .populate('senderId', 'name email')
            .sort({ createdAt: 1 });

        res.json({
            success: true,
            count: messages.length,
            data: messages
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/requests/:id/schedule
// @desc    Propose a meeting schedule
// @access  Public (should be private in production)
router.post('/:id/schedule', async (req, res) => {
    try {
        const { date, time, note } = req.body;
        const requestId = req.params.id;

        if (!date || !time) {
            return res.status(400).json({
                success: false,
                message: 'Date and time are required'
            });
        }

        // Find request and update schedule
        const request = await MentorshipRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        // Store schedule as plain fields (simple MVP)
        request.suggestedDate = date;
        request.suggestedTime = time;
        request.sessionNotes = note || request.sessionNotes; // Use sessionNotes for meeting details
        await request.save();

        res.json({
            success: true,
            message: 'Schedule proposed successfully',
            data: request
        });
    } catch (error) {
        console.error('Error scheduling:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
