import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import type { Address, User } from "../types";

interface SignUpStep1Input {
  step: 1;
  role: "buyer" | "seller";
  credentials: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    dateOfBirth?: string;
  };
}

interface SignUpStep2Input {
  step: 2;
  role: "seller";
  credentials: {
    user: { id: string };
    paymentInfo: {
      provider: string;
      accountNumber: string;
      expiryDate?: string;
      billingAddress?: Address;
    };
  };
}

interface SignInInput {
  email: string;
  password: string;
}

export const useIsAuth = () => {
  const setUser = useAuthStore((state) => state.setUser);

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const { data } = await api.get<{ user: User }>("/auth/isAuth");
        setUser(data.user);
        return data.user;
      } catch (error) {
        // The backend responds 400 (not 401) with the user payload still
        // attached when registration is incomplete — losing that user
        // here (by letting the request just fail) is what made an
        // interrupted signup look identical to "not logged in", with no
        // way to resume. Surface the user in that case instead.
        const responseUser = (error as { response?: { data?: { user?: User } } })?.response?.data?.user;
        if (responseUser) {
          setUser(responseUser);
          return responseUser;
        }
        setUser(null);
        throw error;
      }
    },
    retry: false,
    throwOnError: false,
  });
};

export const useSignIn = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: SignInInput) => {
      const { data } = await api.post<{ user: User }>("/auth/login", credentials);
      return data.user;
    },
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(["auth", "me"], user);
    },
  });
};

export const useSignUp = () => {
  return useMutation({
    mutationFn: async (input: SignUpStep1Input) => {
      const { data } = await api.post<{ user: User }>("/auth/signUp", input);
      return data.user;
    },
  });
};

export const useCompleteSellerOnboarding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<SignUpStep2Input, "step" | "role">) => {
      await api.post("/auth/signUp", { step: 2, role: "seller", ...input } satisfies SignUpStep2Input);
    },
    onSuccess: async () => {
      // Step 2 doesn't return a fresh user (the backend only replies with
      // a completion message), so refetch isAuth to get the real,
      // now-complete user record rather than guessing at its shape.
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
};

export const useLogout = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
    },
  });
};

export const useAddAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, address }: { userId: string; address: Address }) => {
      const { data } = await api.put<{ user: User }>(`/auth/addAddress/${userId}`, address);
      return data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "me"], user);
    },
    onError: (error) => getErrorMessage(error),
  });
};

export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await api.post<{ message: string }>("/auth/request-password-reset", { email });
      return data.message;
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (input: { token: string; password: string }) => {
      const { data } = await api.post<{ message: string }>("/auth/reset-password", input);
      return data.message;
    },
  });
};

export const useVerifyEmail = (token: string | undefined) => {
  return useQuery({
    queryKey: ["auth", "verify-email", token],
    queryFn: async () => {
      const { data } = await api.get<{ message: string }>(`/auth/verify-email?token=${token}`);
      return data.message;
    },
    enabled: !!token,
    retry: false,
  });
};

export const useResendVerification = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await api.post<{ message: string }>("/auth/resend-verification", { email });
      return data.message;
    },
  });
};
