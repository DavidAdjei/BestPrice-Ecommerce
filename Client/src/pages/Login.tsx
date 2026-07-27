import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { useSignIn } from "../hooks/useAuth";
import { useFeedbackStore } from "../store/feedbackStore";
import { getErrorMessage } from "../lib/api";
import { getGoogleAuthUrl } from "../lib/googleOAuth";
import Logo from "../assets/images/Logo.jpeg";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const signIn = useSignIn();
  const { showError, showSuccess } = useFeedbackStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn.mutate(
      { email, password },
      {
        onSuccess: () => {
          showSuccess("Logged in successfully");
          navigate(searchParams.get("page") || "/");
        },
        onError: (err) => showError(getErrorMessage(err)),
      }
    );
  };

  return (
    <div className="grid min-h-[calc(100vh-4.5rem)] grid-cols-1 md:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-secondary to-secondary-dark p-12 text-white md:flex">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

        <Link to="/" className="z-1 inline-flex items-center gap-2 text-lg font-bold">
          <img src={Logo} alt="Best Price" className="h-9 w-9 rounded-full object-cover" />
          Best Price
        </Link>

        <div className="z-1">
          <h2 className="mb-3 text-3xl font-extrabold tracking-tight">Welcome back to the best deals in town.</h2>
          <p className="max-w-sm text-white/70">
            Pick up right where you left off — track orders, chat with sellers, and keep shopping smarter.
          </p>
        </div>

        <p className="z-1 text-xs text-white/50">&copy; {new Date().getFullYear()} Best Price</p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[24rem]">
          <h1 className="mb-1 text-2xl font-bold text-ink">Log in</h1>
          <p className="mb-7 text-sm text-muted">Enter your details to access your account.</p>

          <a
            href={getGoogleAuthUrl("buyer")}
            className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-alt"
          >
            <FcGoogle size={20} />
            Continue with Google
          </a>

          <div className="mb-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

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
            <div>
              <label className="input-label" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-ink"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <IoEyeOffOutline size={18} /> : <IoEyeOutline size={18} />}
                </button>
              </div>
              <div className="mt-1.5 text-right">
                <Link to="/forgot-password" className="text-xs text-muted hover:text-primary-dark">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button className="btn btn-primary btn-block mt-1" type="submit" disabled={signIn.isPending}>
              {signIn.isPending ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-semibold text-primary-dark">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
