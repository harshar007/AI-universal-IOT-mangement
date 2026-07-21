const bcrypt = require('bcryptjs');
const User = require('../../domain/entities/User');

class RegisterUser {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ name, email, password }) {
    if (!name || !email || !password) {
      throw new Error('All fields (name, email, password) are required.');
    }

    const cleanEmail = User.validateEmail(email);
    User.validatePassword(password);

    const existingUser = await this.userRepository.findByEmail(cleanEmail);
    if (existingUser) {
      throw new Error('A user with this email address already exists.');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    return await this.userRepository.createUser(name.trim(), cleanEmail, hashedPassword);
  }
}

module.exports = RegisterUser;
