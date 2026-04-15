import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      if (err.code === 'FORBIDDEN_ROLE') {
        setError('This account is not an administrator.');
      } else if (err.response?.status === 401) {
        setError('Invalid email or password.');
      } else if (err.response?.status === 403) {
        setError(err.response?.data?.message || 'Access denied.');
      } else {
        setError(err.message || 'Unable to sign in.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(129,140,248,0.45), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(167,139,250,0.25), transparent)',
        }}
      />
      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/95 p-10 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">
              Secure access
            </p>
            <h1 className="page-title mt-2 text-slate-900">Admin sign in</h1>
            <p className="page-subtitle mt-1 text-slate-600">
              Token-based authentication · Admin only
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary mt-2 w-full py-3 text-base disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
