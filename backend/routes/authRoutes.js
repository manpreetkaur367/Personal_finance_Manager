const express = require('express');
const { check } = require('express-validator');
const {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const protect = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  [
    check('name', 'Name is required').notEmpty().trim(),
    check('email', 'Please provide a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  ],
  registerUser
);

router.post(
  '/login',
  [
    check('email', 'Please provide a valid email').isEmail(),
    check('password', 'Password is required').notEmpty(),
  ],
  loginUser
);

router.post('/logout', logoutUser);
router.get('/me', protect, getCurrentUser);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
