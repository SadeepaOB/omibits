import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Briefcase, Lock, Mail, UserCog, Users } from 'lucide-react';

export function SignUp() {
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState('employee'); // 'employee' | 'admin'
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

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
        options: {
          data: { role }, // stored in user_metadata
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Do NOT auto-login. Sign out if Supabase auto-created a session.
      if (data?.session) {
        await supabase.auth.signOut();
      }

      // Redirect to Sign In with a success message
      navigate('/login', {
        state: {
          email: cleanEmail,
          message: `Account created as ${role === 'admin' ? 'Admin' : 'Employee'}. Check your email to verify before logging in.`,
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

            {/* ── Role Selector ── */}
            <div className="form-group">
              <label>Account Type <span className="required">*</span></label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginTop: '4px',
                }}
              >
                {/* Employee option */}
                <button
                  type="button"
                  onClick={() => setRole('employee')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${role === 'employee' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: role === 'employee' ? 'var(--color-primary-light)' : 'var(--color-bg-surface)',
                    cursor: 'pointer',
                    color: role === 'employee' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    fontWeight: 600,
                    fontSize: '13px',
                    transition: 'all 0.15s ease',
                  }}
                  aria-pressed={role === 'employee'}
                  title="Select Employee role"
                >
                  <Users size={22} />
                  Employee
                </button>

                {/* Admin option */}
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${role === 'admin' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: role === 'admin' ? 'var(--color-primary-light)' : 'var(--color-bg-surface)',
                    cursor: 'pointer',
                    color: role === 'admin' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    fontWeight: 600,
                    fontSize: '13px',
                    transition: 'all 0.15s ease',
                  }}
                  aria-pressed={role === 'admin'}
                  title="Select Admin role"
                >
                  <UserCog size={22} />
                  Admin
                </button>
              </div>

              {/* Role description */}
              <p
                style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: 'var(--color-text-muted)',
                  lineHeight: '1.5',
                }}
              >
                {role === 'admin'
                  ? '🛡️ Admins can review, approve, and reject employee leave requests.'
                  : '📋 Employees can submit and track their own leave requests.'}
              </p>
            </div>

            {/* Email */}
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

            {/* Password */}
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
              {loading ? 'Creating account...' : `Sign Up as ${role === 'admin' ? 'Admin' : 'Employee'}`}
            </button>
          </div>

          {/* Error Message */}
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
