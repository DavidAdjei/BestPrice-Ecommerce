import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { useAuthStore } from "../store/authStore";
import { useChatContacts, useMarkRoomRead, useMessages, useSendMessage } from "../hooks/useChat";
import { socket } from "../lib/socket";
import { MessageBubble, type MessageStatus } from "../components/chat/MessageBubble";
import { ChatComposer } from "../components/chat/ChatComposer";
import type { Message } from "../types";

interface PendingMessage {
  tempId: string;
  text: string;
  status: "sending" | "error";
  createdAt: string;
}

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function ChatPage() {
  const { roomId: roomIdParam, participantId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: contacts = [] } = useChatContacts(user?.id);
  const [activeRoomId, setActiveRoomId] = useState(roomIdParam);
  const { data: messages = [] } = useMessages(activeRoomId);
  const sendMessage = useSendMessage(activeRoomId);
  const markRoomRead = useMarkRoomRead();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeContact = useMemo(
    () => contacts.find((c) => c.roomId === activeRoomId),
    [contacts, activeRoomId]
  );
  const otherUserId = activeContact?.id ?? participantId;

  useEffect(() => {
    if (roomIdParam) setActiveRoomId(roomIdParam);
  }, [roomIdParam]);

  // Presence: announce ourselves once per session.
  useEffect(() => {
    if (!user) return;
    if (!socket.connected) socket.connect();
    socket.emit("userOnline", { userId: user.id });
  }, [user]);

  // Join the active room's socket channel, listen for live messages and
  // typing indicators, and mark it read now that we're looking at it.
  useEffect(() => {
    if (!activeRoomId || !user) return;
    socket.emit("joinRoom", { userId: user.id, roomId: activeRoomId });
    markRoomRead.mutate({ roomId: activeRoomId, userId: user.id });
    setOtherTyping(false);

    const handleTyping = ({ userId: typingUserId }: { userId: string }) => {
      if (typingUserId !== user.id) setOtherTyping(true);
    };
    const handleStoppedTyping = ({ userId: typingUserId }: { userId: string }) => {
      if (typingUserId !== user.id) setOtherTyping(false);
    };

    socket.on("userTyping", handleTyping);
    socket.on("userStoppedTyping", handleStoppedTyping);

    return () => {
      socket.off("userTyping", handleTyping);
      socket.off("userStoppedTyping", handleStoppedTyping);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId, user]);

  // Live incoming messages (and delivery/read updates) refresh the thread
  // instead of waiting on the polling interval.
  useEffect(() => {
    if (!activeRoomId) return;
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "messages", activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ["chat", "contacts"] });
    };
    socket.on("chatMessage", invalidate);
    socket.on("updateSeenStatus", invalidate);
    return () => {
      socket.off("chatMessage", invalidate);
      socket.off("updateSeenStatus", invalidate);
    };
  }, [activeRoomId, queryClient]);

  // Mark the other person's messages as seen once they're on screen.
  useEffect(() => {
    if (!activeRoomId || !user) return;
    const unseen = messages.filter((m) => m.senderId !== user.id && !m.seenBy?.includes(user.id));
    if (unseen.length > 0) {
      socket.emit("messageSeen", { roomId: activeRoomId, messageIds: unseen.map((m) => m.id), userId: user.id });
    }
  }, [activeRoomId, messages, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  const sendText = (tempId: string, text: string) => {
    if (!activeRoomId || !user) return;
    sendMessage.mutate(
      { roomId: activeRoomId, userId: user.id, message: { message: text } },
      {
        onSuccess: () => {
          setPending((prev) => prev.filter((p) => p.tempId !== tempId));
        },
        onError: () => {
          setPending((prev) => prev.map((p) => (p.tempId === tempId ? { ...p, status: "error" } : p)));
        },
      }
    );
  };

  const handleSend = (text: string) => {
    if (!activeRoomId || !user) return;
    const tempId = `pending-${Date.now()}`;
    setPending((prev) => [...prev, { tempId, text, status: "sending", createdAt: new Date().toISOString() }]);
    sendText(tempId, text);
  };

  const retryPending = (tempId: string, text: string) => {
    setPending((prev) => prev.map((p) => (p.tempId === tempId ? { ...p, status: "sending" } : p)));
    sendText(tempId, text);
  };

  const statusFor = (message: Message): MessageStatus => {
    if (otherUserId && message.seenBy?.includes(otherUserId)) return "read";
    return "sent";
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-4.5rem)] max-w-6xl gap-0 overflow-hidden rounded-none border-t border-border bg-surface md:my-4 md:h-[80vh] md:gap-4 md:rounded-2xl md:border">
      <aside
        className={`w-full shrink-0 flex-col overflow-y-auto border-border md:flex md:w-80 md:border-r ${
          activeRoomId ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="border-b border-border px-4 py-4">
          <h2 className="text-lg font-bold text-ink">Messages</h2>
        </div>

        {contacts.length === 0 && (
          <div className="empty-state">
            <IoChatbubbleEllipsesOutline size={36} />
            <h3>No conversations yet</h3>
            <p>Chat with a seller from any product page to start one.</p>
          </div>
        )}

        {contacts.map((contact) => (
          <button
            key={contact.roomId}
            onClick={() => {
              setActiveRoomId(contact.roomId);
              navigate(`/chat/${contact.roomId}/${contact.id}`, { replace: true });
            }}
            className={`flex w-full items-center gap-3 border-b border-border/60 px-4 py-3 text-left transition ${
              activeRoomId === contact.roomId ? "bg-surface-alt" : "hover:bg-surface-alt/60"
            }`}
          >
            <div className="relative shrink-0">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-bold text-white">
                {contact.image ? (
                  <img src={contact.image} alt={contact.name} className="h-full w-full object-cover" />
                ) : (
                  initials(contact.name)
                )}
              </div>
              {contact.online && (
                <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-surface bg-success" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-ink">{contact.name}</span>
                {contact.lastMessage && (
                  <span className="shrink-0 text-[0.65rem] text-muted">
                    {new Date(contact.lastMessage.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`truncate text-xs ${
                    contact.unreadCount > 0 ? "font-semibold text-ink" : "text-muted"
                  }`}
                >
                  {contact.lastMessage
                    ? `${contact.lastMessage.isMine ? "You: " : ""}${contact.lastMessage.preview}`
                    : "Say hello \u{1F44B}"}
                </span>
                {contact.unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[0.65rem] font-bold text-white">
                    {contact.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </aside>

      <div className={`flex min-w-0 flex-1 flex-col ${activeRoomId ? "flex" : "hidden md:flex"}`}>
        {!activeRoomId ? (
          <div className="empty-state m-auto">
            <IoChatbubbleEllipsesOutline size={40} />
            <h3>Select a conversation</h3>
            <p>Pick someone from the list to see your messages.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <button
                className="text-muted hover:text-ink md:hidden"
                onClick={() => {
                  setActiveRoomId(undefined);
                  navigate("/chat", { replace: true });
                }}
              >
                &larr;
              </button>
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-bold text-white">
                {activeContact?.image ? (
                  <img src={activeContact.image} alt={activeContact.name} className="h-full w-full object-cover" />
                ) : (
                  activeContact && initials(activeContact.name)
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{activeContact?.name ?? "Conversation"}</p>
                <p className="text-xs text-muted">
                  {otherTyping ? (
                    <span className="text-primary-dark">typing...</span>
                  ) : activeContact?.online ? (
                    "Online"
                  ) : (
                    "Offline"
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isMine={message.senderId === user?.id}
                  status={statusFor(message)}
                />
              ))}

              {pending.map((p) => (
                <div key={p.tempId} className="flex flex-col items-end">
                  <button
                    onClick={() => p.status === "error" && retryPending(p.tempId, p.text)}
                    className={`max-w-[70%] rounded-2xl rounded-br-sm px-3.5 py-2 text-left text-sm leading-relaxed text-white ${
                      p.status === "error" ? "cursor-pointer bg-danger" : "cursor-default bg-primary/70"
                    }`}
                  >
                    {p.text}
                  </button>
                  <span className="mt-1 px-1 text-[0.65rem] text-muted">
                    {p.status === "error" ? "Failed to send \u2014 tap to retry" : "Sending..."}
                  </span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <ChatComposer
              roomId={activeRoomId}
              userId={user?.id ?? ""}
              onSend={handleSend}
              sending={sendMessage.isPending}
            />
          </>
        )}
      </div>
    </div>
  );
}
