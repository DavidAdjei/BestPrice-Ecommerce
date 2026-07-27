import { api } from "./api";

export const reportError = (error: unknown, extraStack?: string) => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = extraStack ?? (error instanceof Error ? error.stack : undefined);

  // Fire-and-forget — error reporting should never itself throw or block
  // the UI.
  api
    .post("/errors", { message, stack, url: window.location.href })
    .catch(() => {
      /* if the error log endpoint itself is unreachable, there's nowhere
         further to report that */
    });

  if (import.meta.env.DEV) console.error(error);
};

export const installGlobalErrorReporting = () => {
  window.addEventListener("error", (event) => {
    reportError(event.error ?? event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    reportError(event.reason);
  });
};
