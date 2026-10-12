const express = require('express');
const { getCurrentUser, updateProfile, changePassword } = require('../controllers/authController');
const protect = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/me', getCurrentUser);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

module.exports = router;
