import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Github } from 'lucide-react';
import axios from 'axios';
import '../css/Login.css';

/**
 * =========================================================================
 * POSTGRESQL DATABASE SCHEMA & BACKEND CONTROLLER INTEGRATION
 * =========================================================================
 * 
 * 1. PostgreSQL Database Schema:
 * 
 *    CREATE TABLE users (
 *        id SERIAL PRIMARY KEY,
 *        name VARCHAR(100) NOT NULL,
 *        email VARCHAR(255) UNIQUE NOT NULL,
 *        password_hash VARCHAR(255) NOT NULL,
 *        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 *    );
 * 
 * 2. Node.js Express Endpoints (Backend Controllers using 'pg' client):
 * 
 *    const express = require('express');
 *    const bcrypt = require('bcrypt');
 *    const jwt = require('jsonwebtoken');
 *    const { Pool } = require('pg');
 * 
 *    const router = express.Router();
 *    const pool = new Pool({
 *        connectionString: process.env.DATABASE_URL
 *    });
 * 
 *    // SIGNUP ENDPOINT
 *    router.post('/signup', async (req, res) => {
 *        const { name, email, password } = req.body;
 *        
 *        if (!name || !email || !password) {
 *            return res.status(400).json({ error: 'All fields are required' });
 *        }
 *        
 *        try {
 *            // Check if user already exists
 *            const checkUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
 *            if (checkUser.rows.length > 0) {
 *                return res.status(400).json({ error: 'User with this email already exists' });
 *            }
 *            
 *            // Hash password
 *            const saltRounds = 10;
 *            const hashedPassword = await bcrypt.hash(password, saltRounds);
 *            
 *            // Insert user into PostgreSQL (using prepared statements to prevent injection)
 *            const insertText = 'INSERT INTO users(name, email, password_hash) VALUES($1, $2, $3) RETURNING id, name, email';
 *            const { rows } = await pool.query(insertText, [name.trim(), email.toLowerCase().trim(), hashedPassword]);
 *            
 *            return res.status(201).json({
 *                success: true,
 *                message: 'User registered successfully',
 *                user: rows[0]
 *            });
 *        } catch (error) {
 *            console.error('PostgreSQL Signup Error:', error);
 *            return res.status(500).json({ error: 'Database signup error' });
 *        }
 *    });
 * 
 *    // LOGIN ENDPOINT
 *    router.post('/login', async (req, res) => {
 *        const { email, password } = req.body;
 *        
 *        if (!email || !password) {
 *            return res.status(400).json({ error: 'Email and password are required' });
 *        }
 *        
 *        try {
 *            const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
 *            if (rows.length === 0) {
 *                return res.status(401).json({ error: 'Invalid email or password' });
 *            }
 *            
 *            const user = rows[0];
 *            const isMatch = await bcrypt.compare(password, user.password_hash);
 *            if (!isMatch) {
 *                return res.status(401).json({ error: 'Invalid email or password' });
 *            }
 *            
 *            const token = jwt.sign(
 *                { userId: user.id, email: user.email, name: user.name },
 *                process.env.JWT_SECRET || 'nexus_super_secret_key',
 *                { expiresIn: '24h' }
 *            );
 *            
 *            return res.status(200).json({
 *                success: true,
 *                token,
 *                user: { id: user.id, name: user.name, email: user.email }
 *            });
 *        } catch (error) {
 *            console.error('PostgreSQL Login Error:', error);
 *            return res.status(500).json({ error: 'Database login error' });
 *        }
 *    });
 * 
 *    module.exports = router;
 */

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();

  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup Form States
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Universal UI States
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle GitHub OAuth callback redirect URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userStr = urlParams.get('user');
    const error = urlParams.get('error');

    if (error) {
      setErrorMsg(decodeURIComponent(error));
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        if (onLoginSuccess) {
          onLoginSuccess(user);
        }

        setSuccessMsg(`Welcome back, ${user.name || 'Operator'}! Redirecting...`);
        window.history.replaceState({}, document.title, window.location.pathname);

        setTimeout(() => {
          navigate('/');
        }, 500);
      } catch (e) {
        console.error('Failed to parse GitHub OAuth payload:', e);
        setErrorMsg('Failed to process GitHub authentication callback.');
      }
    }
  }, [navigate, onLoginSuccess]);

  const handleGithubLogin = () => {
    window.location.href = '/api/auth/github';
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter your email and password.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/login', {
        email: email.trim(),
        password: password
      });

      if (response.data && response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        if (onLoginSuccess) {
          onLoginSuccess(response.data.user);
        }

        setSuccessMsg(`Welcome back, ${response.data.user.name || 'Operator'}! Redirecting...`);

        setTimeout(() => {
          navigate('/');
        }, 500);
      } else {
        setErrorMsg('Authentication returned empty token response.');
      }
    } catch (err) {
      console.error('PostgreSQL Login API error:', err);
      const errMsg = err.response?.data?.error || 'Authentication failed. Please verify credentials.';
      setErrorMsg(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setErrorMsg('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/signup', {
        name: signupName.trim(),
        email: signupEmail.trim(),
        password: signupPassword
      });

      if (response.data && response.data.success) {
        setSuccessMsg('Account created successfully! Switching to login...');

        // Clear signup fields
        setSignupName('');
        setSignupEmail('');
        setSignupPassword('');

        // Pre-fill login email for convenience
        setEmail(signupEmail);

        // Flip back to login card side after delay
        setTimeout(() => {
          setIsSignUp(false);
          setSuccessMsg('');
        }, 1000);
      }
    } catch (err) {
      console.error('PostgreSQL Signup API error:', err);
      const errMsg = err.response?.data?.error || 'Signup failed. Please try a different email.';
      setErrorMsg(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Hero / brand side */}
      <aside className="login-hero">
        <div className="login-hero-content">
          <div className="login-hero-brand">
            <img
              src="/logo.png"
              alt="Nunnarri Logo"
              className="login-brand-logo"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span>நுண்ணறி (Nunnarri)</span>
          </div>
          <h1>Build, monitor, and control your IoT fleet.</h1>
          <p>
            A unified console for ESP32, ESP8266, and custom boards — with local AI,
            MQTT telemetry, and zero cloud lock-in.
          </p>
        </div>
        <div className="login-hero-foot">
          © {new Date().getFullYear()} Nunnarri · Open source IoT platform
        </div>
      </aside>

      {/* Auth side */}
      <div className="login-panel">
        <div className="login-card">
          <div className="login-mobile-logo-wrap">
            <img
              src="/logo.png"
              alt="Nunnarri Logo"
              className="login-mobile-logo"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div>
            <h2>{isSignUp ? 'Create your account' : 'Sign in'}</h2>
            <p className="subtitle">
              {isSignUp
                ? 'Get started managing your IoT fleet.'
                : 'Welcome back. Enter your credentials.'}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={!isSignUp ? 'active' : ''}
              onClick={() => { setIsSignUp(false); setErrorMsg(''); setSuccessMsg(''); }}
              disabled={loading}
            >
              Sign in
            </button>
            <button
              type="button"
              className={isSignUp ? 'active' : ''}
              onClick={() => { setIsSignUp(true); setErrorMsg(''); setSuccessMsg(''); }}
              disabled={loading}
            >
              Create account
            </button>
          </div>

          {!isSignUp ? (
            <form className="auth-form" onSubmit={handleLoginSubmit}>
              {errorMsg && (
                <div className="feedback-msg error">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="feedback-msg success">
                  <CheckCircle2 size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="md-field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  disabled={loading}
                  required
                />
              </div>

              <div className="md-field password-field">
                <label>Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>

              <div className="oauth-divider"><span>or</span></div>
              <button
                type="button"
                className="github-btn"
                onClick={handleGithubLogin}
                disabled={loading}
              >
                <Github size={18} />
                <span>Continue with GitHub</span>
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleSignupSubmit}>
              {errorMsg && (
                <div className="feedback-msg error">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="feedback-msg success">
                  <CheckCircle2 size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="md-field">
                <label>Full name</label>
                <input
                  type="text"
                  placeholder="Ada Lovelace"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="md-field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value.trim())}
                  disabled={loading}
                  required
                />
              </div>
              <div className="md-field password-field">
                <label>Password</label>
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={(e) => { e.preventDefault(); setShowSignupPassword(!showSignupPassword); }}
                  tabIndex={-1}
                  aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                >
                  {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Creating account…' : 'Create account'}
              </button>

              <div className="oauth-divider"><span>or</span></div>
              <button
                type="button"
                className="github-btn"
                onClick={handleGithubLogin}
                disabled={loading}
              >
                <Github size={18} />
                <span>Continue with GitHub</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
