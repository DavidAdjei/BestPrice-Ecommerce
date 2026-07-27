import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL,
  withCredentials: true,
});

// Every backend error response is shaped { error: string }. This pulls that
// out consistently so callers don't need to know axios's error shape.
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { error?: string } | undefined)?.error ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
};
