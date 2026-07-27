import { Link } from "react-router-dom";
import { IoCheckmark, IoCheckmarkDone, IoTimeOutline } from "react-icons/io5";
import type { Message } from "../../types";
import { formatPrice } from "../../lib/currency";

export type MessageStatus = "sending" | "sent" | "read";

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  status: MessageStatus;
}

function StatusTick({ status }: { status: MessageStatus }) {
  if (status === "sending") return <IoTimeOutline size={13} className="text-white/70" />;
  if (status === "read") return <IoCheckmarkDone size={15} className="text-sky-300" />;
  return <IoCheckmark size={15} className="text-white/70" />;
}

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

export function MessageBubble({ message, isMine, status }: MessageBubbleProps) {
  if (message.messageType === "PRODUCT" && message.productSnapshot) {
    const product = message.productSnapshot;
    return (
      <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
        <Link
          to={`/product/${product.id}`}
          className="flex w-64 items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-sm transition hover:border-primary hover:shadow-md"
        >
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-alt">
            {product.image && <img src={product.image} alt={product.title} className="h-full w-full object-contain" />}
          </div>
          <div className="min-w-0">
            <p className="mb-0.5 text-xs font-semibold text-muted uppercase tracking-wide">Talking about</p>
            <p className="truncate text-sm font-semibold text-ink">{product.title}</p>
            <p className="text-sm font-bold text-primary-dark">{formatPrice(product.price, product.currency)}</p>
          </div>
        </Link>
        <div className={`mt-1 flex items-center gap-1 px-1 text-[0.65rem] text-muted ${isMine ? "flex-row-reverse" : ""}`}>
          <span>{timeLabel(message.createdAt)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          isMine
            ? "rounded-br-sm bg-primary text-white"
            : "rounded-bl-sm bg-surface-alt text-ink"
        }`}
      >
        {message.message}
      </div>
      <div className={`mt-1 flex items-center gap-1 px-1 text-[0.65rem] text-muted ${isMine ? "flex-row-reverse" : ""}`}>
        <span>{timeLabel(message.createdAt)}</span>
        {isMine && <StatusTick status={status} />}
      </div>
    </div>
  );
}
