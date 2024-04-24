const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();


router.patch('/userinfo' ,authController.userInfo)
router.patch('/updateinfo' ,authController.updateInfo)
router.post('/signup', authController.signup);
router.post('/login', authController.login)
router.get('/logout', authController.logout)
router.post('/forgotpassword', authController.forgotPassword)
router.patch('/resetpassword/:token', authController.resetPassword)
// router.patch('/updateMyPassword', authController.protect, authController.updatePassword)


module.exports = router;
