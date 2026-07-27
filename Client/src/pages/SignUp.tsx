import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { useSignUp } from "../hooks/useAuth";
import { useFeedbackStore } from "../store/feedbackStore";
import { getErrorMessage } from "../lib/api";
import { getGoogleAuthUrl } from "../lib/googleOAuth";
import { SellerOnboardingPage } from "./SellerOnboarding";
import Logo from "../assets/images/Logo.jpeg";

export function SignUpPage() {
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newSellerId, setNewSellerId] = useState<string | null>(null);
  const signUp = useSignUp();
  const { showError, showSuccess } = useFeedbackStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signUp.mutate(
      { step: 1, role, credentials: { firstName, lastName, email, password } },
      {
        onSuccess: (user) => {
          if (role === "seller" && user.registrationStep === 2) {
            // Move straight into the payment-details step in this same
            // sitting instead of bouncing them to login (step 1 doesn't
            // issue a session, so there's nothing to "continue" — this
            // avoids losing them here entirely).
            setNewSellerId(user.id);
          } else {
            showSuccess("Account created — log in to continue");
            navigate("/login");
          }
        },
        onError: (err) => showError(getErrorMessage(err)),
      }
    );
  };

  if (newSellerId) {
    return <SellerOnboardingPage userId={newSellerId} />;
  }

  return (
    <div className="grid min-h-[calc(100vh-4.5rem)] grid-cols-1 md:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-secondary to-secondary-dark p-12 text-white md:flex">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

        <Link to="/" className="z-1 inline-flex items-center gap-2 text-lg font-bold">
          <img src={Logo} alt="Best Price" className="h-9 w-9 rounded-full object-cover" />
          Best Price
        </Link>

        <div className="z-1">
          <h2 className="mb-3 text-3xl font-extrabold tracking-tight">
            {role === "seller" ? "Start selling in minutes." : "Join thousands finding better deals."}
          </h2>
          <p className="max-w-sm text-white/70">
            {role === "seller"
              ? "List products, chat with buyers directly, and get paid straight to your bank or mobile money."
              : "Save products you love, chat with sellers before you buy, and track every order in one place."}
          </p>
        </div>

        <p className="z-1 text-xs text-white/50">&copy; {new Date().getFullYear()} Best Price</p>
      </div>

      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[24rem]">
          <h1 className="mb-1 text-2xl font-bold text-ink">Create your account</h1>
          <p className="mb-6 text-sm text-muted">Start buying or selling in just a minute.</p>

          <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-surface-alt p-1">
            <button
              type="button"
              onClick={() => setRole("buyer")}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                role === "buyer" ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              I&apos;m a buyer
            </button>
            <button
              type="button"
              onClick={() => setRole("seller")}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                role === "seller" ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              I&apos;m a seller
            </button>
          </div>

          <a
            href={getGoogleAuthUrl(role)}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label" htmlFor="firstName">First name</label>
                <input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input" />
              </div>
              <div>
                <label className="input-label" htmlFor="lastName">Last name</label>
                <input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="input" />
              </div>
            </div>
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
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="At least 8 characters"
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
            </div>

            <button className="btn btn-primary btn-block mt-1" type="submit" disabled={signUp.isPending}>
              {signUp.isPending ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary-dark">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
