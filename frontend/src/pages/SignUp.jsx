import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Briefcase, Lock, Mail, ArrowRight } from 'lucide-react';

export function SignUp() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please provide both email and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Do NOT auto-login. If Supabase auto-created a session, sign out.
      if (data?.session) {
        await supabase.auth.signOut();
      }

      // Redirect user to the Sign In page with pre-filled email and verification message
      navigate('/login', {
        state: {
          email: cleanEmail,
          message: 'Your account has been created. Please check your email and verify your address before logging in.',
        },
      });
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg-app)',
        padding: '24px',
      }}
    >
      <div
        className="surface-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            className="brand-icon"
            style={{ margin: '0 auto 12px auto', width: '40px', height: '40px' }}
          >
            <Briefcase size={20} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Create an Account
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Register to access Omibits Leave Manager
          </p>
        </div>

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="signup-email">
                Email Address <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="signup-password">
                Password <span className="required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="signup-password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '10px 16px', marginTop: '4px' }}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </div>

          {/* Error Message Displayed Under Form */}
          {error && (
            <div
              style={{
                marginTop: '16px',
                padding: '10px 14px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                color: '#dc2626',
                fontSize: '13px',
                textAlign: 'center',
              }}
              role="alert"
            >
              {error}
            </div>
          )}
        </form>

        {/* Link to Sign In */}
        <div
          style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '13px',
            color: 'var(--color-text-muted)',
            borderTop: '1px solid var(--color-border)',
            paddingTop: '20px',
          }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--color-primary)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
