'use client';

import { FormEvent, useState } from 'react';
import { getDb } from '@/lib/db';

export default function LoginPage() {
  const db = getDb();
  const { user, isLoading } = db.useAuth();
  const [email, setEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await db.auth.sendMagicCode({ email });
      setCodeSent(true);
    } catch (err) {
      setError('Unable to send magic code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await db.auth.signInWithMagicCode({ email, code });
    } catch (err) {
      setError('Invalid or expired code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-chalk">Log in</h1>
      <p className="text-sm text-neon/70">
        Use a one-time 6-digit code emailed to you via InstantDB. No passwords
        to remember.
      </p>

      {isLoading ? (
        <p className="text-sm text-neon/60">Checking your session…</p>
      ) : user ? (
        <p className="rounded-lg border border-neon/20 bg-neon/10 p-3 text-sm text-neon">
          You are logged in as <span className="font-medium text-chalk">{user.email}</span>.
        </p>
      ) : null}

      {!codeSent ? (
        <form onSubmit={handleSendCode} className="card space-y-3">
          <label className="text-sm font-medium text-chalk">
            Email
            <input
              className="input mt-1"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          {error && (
            <p className="text-xs text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn w-full"
            disabled={submitting || !email}
          >
            {submitting ? 'Sending code…' : 'Send magic code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="card space-y-3">
          <p className="text-xs text-neon/70">
            We sent a 6-digit code to <span className="font-medium text-chalk">{email}</span>. Enter it
            below to finish signing in.
          </p>
          <label className="text-sm font-medium text-chalk">
            Code
            <input
              className="input mt-1 tracking-[0.3em]"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </label>
          {error && (
            <p className="text-xs text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn w-full"
            disabled={submitting || code.length !== 6}
          >
            {submitting ? 'Verifying…' : 'Verify and log in'}
          </button>
        </form>
      )}
    </div>
  );
}
