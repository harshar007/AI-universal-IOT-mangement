const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../domain/entities/User');

const JWT_SECRET = process.env.JWT_SECRET || 'nexus_super_secret_key_987654321';

class LoginUser {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ email, password }) {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await this.userRepository.findByEmail(cleanEmail);

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        role: user.role
      }
    };
  }
}

module.exports = LoginUser;
