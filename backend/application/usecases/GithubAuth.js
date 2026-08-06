const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'nexus_super_secret_key_987654321';

class GithubAuth {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ code }) {
    if (!code) {
      throw new Error('OAuth authorization code is required.');
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('GitHub OAuth is not configured on the server. Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET.');
    }

    // 1. Exchange authorization code for GitHub access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: clientId,
        client_secret: clientSecret,
        code
      },
      {
        headers: { Accept: 'application/json' }
      }
    );

    const accessToken = tokenResponse.data?.access_token;
    if (!accessToken) {
      const errDetail = tokenResponse.data?.error_description || 'Failed to exchange authorization code with GitHub.';
      throw new Error(errDetail);
    }

    // 2. Fetch GitHub User Profile
    const profileResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'Nexus-IoT-App'
      }
    });

    const githubUser = profileResponse.data;
    const githubId = String(githubUser.id);
    let name = githubUser.name || githubUser.login || 'GitHub User';
    let email = githubUser.email;
    const avatarUrl = githubUser.avatar_url;

    // 3. Fetch user email if not exposed in public profile
    if (!email) {
      try {
        const emailsResponse = await axios.get('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'Nexus-IoT-App'
          }
        });
        const primaryEmailObj = emailsResponse.data.find((e) => e.primary && e.verified) || emailsResponse.data[0];
        if (primaryEmailObj) {
          email = primaryEmailObj.email;
        }
      } catch (err) {
        console.warn('Could not fetch GitHub user emails:', err.message);
      }
    }

    if (!email) {
      email = `${githubUser.login}@users.noreply.github.com`;
    }

    const cleanEmail = email.toLowerCase().trim();

    // 4. Find or Create User in PostgreSQL
    let user = await this.userRepository.findByGithubId(githubId);

    if (!user) {
      // Check if user already exists by email
      const existingUserByEmail = await this.userRepository.findByEmail(cleanEmail);
      if (existingUserByEmail) {
        // Link GitHub ID to existing user account
        user = await this.userRepository.linkGithubId(existingUserByEmail.id, githubId, avatarUrl);
      } else {
        // Create a new OAuth user
        user = await this.userRepository.createOAuthUser({
          name,
          email: cleanEmail,
          githubId,
          profilePic: avatarUrl,
          role: 'OPERATOR'
        });
      }
    }

    // 5. Generate JWT token
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
        role: user.role,
        githubId: user.githubId
      }
    };
  }
}

module.exports = GithubAuth;
