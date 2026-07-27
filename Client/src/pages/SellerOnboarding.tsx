import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCompleteSellerOnboarding } from "../hooks/useAuth";
import { useBanks } from "../hooks/useSeller";
import { useAuthStore } from "../store/authStore";
import { useFeedbackStore } from "../store/feedbackStore";
import { getErrorMessage } from "../lib/api";
import { Loading } from "../components/Loading";

export function SellerOnboardingPage({ userId: userIdProp }: { userId?: string } = {}) {
  const storeUserId = useAuthStore((state) => state.user?.id);
  const isAuth = useAuthStore((state) => state.isAuth);
  const userId = userIdProp ?? storeUserId;
  const { data: banks, isLoading: banksLoading } = useBanks();
  const [provider, setProvider] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const completeOnboarding = useCompleteSellerOnboarding();
  const { showSuccess, showError } = useFeedbackStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    completeOnboarding.mutate(
      { credentials: { user: { id: userId }, paymentInfo: { provider, accountNumber } } },
      {
        onSuccess: () => {
          if (isAuth) {
            // Resumed this after logging back in — a session already exists.
            showSuccess("You're all set — welcome to Best Price!");
            navigate("/dashboard");
          } else {
            // Completed right after step 1, in the same sitting — step 2
            // doesn't log anyone in (no cookie is issued), so there's no
            // session to land in a dashboard with yet.
            showSuccess("You're all set — log in to reach your dashboard.");
            navigate("/login");
          }
        },
        onError: (err) => showError(getErrorMessage(err)),
      }
    );
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[30rem] flex-col justify-center px-5 py-12">
      <div className="card-surface p-8">
        <span className="inline-block rounded-full bg-primary-tint px-3 py-1 text-xs font-bold tracking-wide text-primary-dark uppercase">
          One last step
        </span>
        <h1 className="mt-3 mb-1 text-2xl font-bold text-ink">Set up payouts</h1>
        <p className="mb-6 text-sm text-muted">
          Add where we should send your earnings. You can update this later from your dashboard.
        </p>

        {banksLoading ? (
          <Loading label="Loading banks..." />
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="input-label" htmlFor="provider">Bank / mobile money provider</label>
              <select
                id="provider"
                required
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="input"
              >
                <option value="" disabled>Select a provider</option>
                {banks?.map((bank) => (
                  <option key={bank.code} value={bank.code}>{bank.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="input-label" htmlFor="accountNumber">Account number</label>
              <input
                id="accountNumber"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="input"
                placeholder="0123456789"
              />
            </div>

            <button className="btn btn-primary btn-block mt-2" type="submit" disabled={completeOnboarding.isPending}>
              {completeOnboarding.isPending ? "Saving..." : "Finish setup"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
