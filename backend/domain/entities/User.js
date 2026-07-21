class User {
  constructor(id, name, email, passwordHash, createdAt = new Date(), profilePic = null, role = 'OPERATOR') {
    this.id = id;
    this.name = name;
    this.email = email;
    this.passwordHash = passwordHash;
    this.createdAt = createdAt;
    this.profilePic = profilePic;
    this.role = role;
  }

  static validateEmail(email) {
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address format.');
    }
    return email.toLowerCase().trim();
  }

  static validatePassword(password) {
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
  }
}

module.exports = User;
