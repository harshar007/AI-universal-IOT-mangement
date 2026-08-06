const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');
const auth = require('../middleware/auth');

router.post('/signup', (req, res) => authController.signup(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.get('/auth/github', (req, res) => authController.redirectToGithub(req, res));
router.get('/auth/github/callback', (req, res) => authController.handleGithubCallback(req, res));
router.put('/profile/pic', auth, (req, res) => authController.updateProfilePic(req, res));

module.exports = router;
