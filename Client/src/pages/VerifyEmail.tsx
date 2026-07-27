import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useResendVerification, useVerifyEmail } from "../hooks/useAuth";
import { getErrorMessage } from "../lib/api";
import { Loading } from "../components/Loading";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? undefined;
  const { isLoading, isError, error } = useVerifyEmail(token);
  const [resendEmail, setResendEmail] = useState("");
  const [resendSent, setResendSent] = useState(false);
  const resend = useResendVerification();

  if (!token) {
    return (
      <div className="mx-auto max-w-[24rem] px-5 py-16">
        <h1 className="mb-1 text-2xl font-bold text-ink">Resend verification email</h1>
        <p className="mb-6 text-sm text-muted">Enter your email and we'll send a new verification link.</p>
        {resendSent ? (
          <p className="text-sm text-body">Check your inbox for a new verification link.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <input
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
            <button
              className="btn btn-primary btn-block"
              onClick={() => resend.mutate(resendEmail, { onSuccess: () => setResendSent(true) })}
              disabled={resend.isPending || !resendEmail}
            >
              {resend.isPending ? "Sending..." : "Send verification email"}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (isLoading) return <Loading fullScreen label="Verifying your email..." />;

  return (
    <div className="mx-auto max-w-[24rem] px-5 py-16 text-center">
      {isError ? (
        <>
          <h1 className="mb-2 text-xl font-bold text-ink">Verification failed</h1>
          <p className="mb-4 text-sm text-muted">{getErrorMessage(error)}</p>
          <Link to="/verify-email" className="btn btn-primary">Resend verification email</Link>
        </>
      ) : (
        <>
          <h1 className="mb-2 text-xl font-bold text-ink">Email verified 🎉</h1>
          <p className="mb-4 text-sm text-muted">Your email is confirmed. You're all set.</p>
          <Link to="/login" className="btn btn-primary">Continue to log in</Link>
        </>
      )}
    </div>
  );
}
