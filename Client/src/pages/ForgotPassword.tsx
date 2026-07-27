import { useState } from "react";
import { Link } from "react-router-dom";
import { useRequestPasswordReset } from "../hooks/useAuth";
import { getErrorMessage } from "../lib/api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const requestReset = useRequestPasswordReset();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    requestReset.mutate(email, {
      onSuccess: () => setSent(true),
      onError: (err) => setError(getErrorMessage(err)),
    });
  };

  return (
    <div className="mx-auto max-w-[24rem] px-5 py-16">
      <h1 className="mb-1 text-2xl font-bold text-ink">Forgot your password?</h1>
      <p className="mb-6 text-sm text-muted">
        Enter your email and we'll send you a link to reset it.
      </p>

      {sent ? (
        <div className="card-surface p-5 text-sm text-body">
          If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your inbox.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="input-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={requestReset.isPending}>
            {requestReset.isPending ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        <Link to="/login" className="font-semibold text-primary-dark">Back to log in</Link>
      </p>
    </div>
  );
}
