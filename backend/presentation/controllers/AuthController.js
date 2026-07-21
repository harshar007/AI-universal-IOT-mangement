const UserRepository = require('../../domain/repositories/UserRepository');
const RegisterUser = require('../../application/usecases/RegisterUser');
const LoginUser = require('../../application/usecases/LoginUser');

class AuthController {
  constructor() {
    this.userRepository = new UserRepository();
    this.registerUserUseCase = new RegisterUser(this.userRepository);
    this.loginUserUseCase = new LoginUser(this.userRepository);
  }

  async signup(req, res) {
    const { name, email, password } = req.body;
    try {
      const user = await this.registerUserUseCase.execute({ name, email, password });
      res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        user
      });
    } catch (err) {
      console.error('PostgreSQL Signup error:', err.message);
      res.status(400).json({ error: err.message });
    }
  }

  async login(req, res) {
    const { email, password } = req.body;
    try {
      const result = await this.loginUserUseCase.execute({ email, password });
      res.status(200).json({
        success: true,
        message: 'Authenticated successfully!',
        ...result
      });
    } catch (err) {
      console.error('PostgreSQL Login error:', err.message);
      res.status(401).json({ error: err.message });
    }
  }

  async updateProfilePic(req, res) {
    const { profilePic } = req.body;
    const userId = req.user?.userId;

    if (!profilePic) {
      return res.status(400).json({ error: 'Profile picture data is required.' });
    }

    // Limit check: Check if size is around less KB (e.g. 50 KB)
    // Max base64 length = 51200 * 4 / 3 = ~68266 characters. We allow up to 70,000.
    if (profilePic.length > 70000) {
      return res.status(400).json({ error: 'Image file size is too large. Limit is 50 KB.' });
    }

    try {
      const user = await this.userRepository.updateProfilePic(userId, profilePic);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json({
        success: true,
        message: 'Profile picture updated successfully!',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          profilePic: user.profilePic
        }
      });
    } catch (err) {
      console.error('Update profile pic error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new AuthController();
