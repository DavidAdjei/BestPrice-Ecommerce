import { useEffect, useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useFeedbackStore } from "../store/feedbackStore";

export function Toast() {
  const feedback = useFeedbackStore((state) => state.feedback);
  const clear = useFeedbackStore((state) => state.clear);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (feedback) setOpen(true);
  }, [feedback]);

  const handleClose = () => {
    setOpen(false);
    setTimeout(clear, 200);
  };

  if (!feedback) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert onClose={handleClose} severity={feedback.type} variant="filled" sx={{ width: "100%" }}>
        {feedback.message}
      </Alert>
    </Snackbar>
  );
}
