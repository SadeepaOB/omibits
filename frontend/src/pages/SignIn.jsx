import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Briefcase, CheckCircle2 } from 'lucide-react';

export function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fill email and capture success message passed from SignUp via router state
  const initialEmail = location.state?.email || '';
  const signupSuccessMessage = location.state?.message || '';

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(signupSuccessMessage);

  useEffect(() => {
    // If user is already authenticated with an active session, redirect to Home ("/")
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/', { replace: true });
      }
    });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Only redirect when a real session exists after login
      if (data?.session) {
        navigate('/', { replace: true });
      } else {
        setError('Check your email and confirm your account before logging in.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during sign in.');
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
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            className="brand-icon"
            style={{ margin: '0 auto 12px auto', width: '40px', height: '40px' }}
          >
            <Briefcase size={20} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Sign in to your Omibits administrator portal
          </p>
        </div>

        {/* Clear Success Message Shown Above the Form (e.g. from signup) */}
        {successMessage && (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 14px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 'var(--radius-md)',
              color: '#065f46',
              fontSize: '13px',
              lineHeight: '1.5',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}
            role="status"
          >
            <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="signin-email">
                Email Address <span className="required">*</span>
              </label>
              <input
                id="signin-email"
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

            <div className="form-group">
              <label htmlFor="signin-password">
                Password <span className="required">*</span>
              </label>
              <input
                id="signin-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '10px 16px', marginTop: '4px' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          {/* Small Error Message Displayed Under Form */}
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

        {/* Link to Sign Up */}
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
          Don't have an account?{' '}
          <Link
            to="/signup"
            style={{
              color: 'var(--color-primary)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
