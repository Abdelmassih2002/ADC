const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

// Existing routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// New routes for password reset
router.post('/updatePassword', authController.updatePassword);

router.post('/request-password-reset', authController.requestPasswordReset); // Add this line for requesting password reset
router.post('/reset-password', authController.resetPassword);

// Existing routes for user info and update info
router.patch('/userinfo', authController.userInfo);
router.patch('/updateinfo', authController.updateInfo);

module.exports = router;
