import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useResetPassword } from "../hooks/useAuth";
import { getErrorMessage } from "../lib/api";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const resetPassword = useResetPassword();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    resetPassword.mutate(
      { token, password },
      {
        onSuccess: () => navigate("/login"),
        onError: (err) => setError(getErrorMessage(err)),
      }
    );
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-[24rem] px-5 py-16 text-center">
        <h1 className="mb-2 text-xl font-bold text-ink">Missing reset token</h1>
        <p className="mb-4 text-sm text-muted">
          This link looks incomplete. Request a new one from the forgot-password page.
        </p>
        <Link to="/forgot-password" className="btn btn-primary">Request a new link</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[24rem] px-5 py-16">
      <h1 className="mb-1 text-2xl font-bold text-ink">Set a new password</h1>
      <p className="mb-6 text-sm text-muted">Choose a new password for your account.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="input-label" htmlFor="password">New password</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="input-label" htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={resetPassword.isPending}>
          {resetPassword.isPending ? "Saving..." : "Reset password"}
        </button>
      </form>
    </div>
  );
}
