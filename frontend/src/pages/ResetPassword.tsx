import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';
import BrandMark from '../components/BrandMark';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    if (!token || !email) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(email, token, password);
      navigate('/login?reset=1');
    } catch (err: any) {
      const apiError = err.response?.data;
      const detail = apiError?.details?.[0]?.message;
      setError(detail || apiError?.error || 'Reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-[#f6f2eb] flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center space-y-4">
          <p className="text-slate-700 font-medium">Invalid reset link.</p>
          <Link to="/forgot-password" className="text-sm text-[#1f3b5c] font-medium hover:underline">
            Request a new one
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f2eb] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BrandMark centered className="mb-6" />
          <h2 className="text-2xl font-serif font-semibold mb-2">Choose a new password</h2>
          <p className="text-sm text-slate-600">
            Resetting password for <strong>{email}</strong>
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                New password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3b5c] focus:border-transparent"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-slate-700 mb-2">
                Confirm new password
              </label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3b5c] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1f3b5c] text-white py-3 rounded-lg font-medium hover:bg-[#1a324d] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
