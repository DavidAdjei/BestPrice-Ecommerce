import { useRef, useState } from "react";
import { IoSendSharp } from "react-icons/io5";
import { socket } from "../../lib/socket";

interface ChatComposerProps {
  roomId: string;
  userId: string;
  onSend: (text: string) => void;
  sending: boolean;
}

const TYPING_STOP_DELAY = 2000;

export function ChatComposer({ roomId, userId, onSend, sending }: ChatComposerProps) {
  const [draft, setDraft] = useState("");
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const stopTyping = () => {
    if (isTypingRef.current) {
      socket.emit("stoppedTyping", { roomId, userId });
      isTypingRef.current = false;
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  };

  const handleChange = (value: string) => {
    setDraft(value);
    if (!isTypingRef.current) {
      socket.emit("typing", { roomId, userId });
      isTypingRef.current = true;
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(stopTyping, TYPING_STOP_DELAY);
  };

  const handleSend = () => {
    const text = draft.trim();
    if (!text || sending) return;
    onSend(text);
    setDraft("");
    stopTyping();
  };

  return (
    <div className="flex items-end gap-2 border-t border-border bg-surface p-3">
      <textarea
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={stopTyping}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Type a message..."
        rows={1}
        className="input max-h-32 flex-1 resize-none py-2.5"
      />
      <button
        onClick={handleSend}
        disabled={!draft.trim() || sending}
        aria-label="Send message"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : (
          <IoSendSharp size={18} />
        )}
      </button>
    </div>
  );
}
