const express = require('express');
const protect = require('../middleware/auth');
const { verifyInvitation, acceptInvitation } = require('../controllers/tripInvitationController');

const router = express.Router();

router.post('/verify', verifyInvitation);
router.post('/accept', protect, acceptInvitation);

module.exports = router;
