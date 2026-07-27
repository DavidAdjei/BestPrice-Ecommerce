interface LoadingProps {
  label?: string;
  fullScreen?: boolean;
  size?: number;
}

export function Loading({ label, fullScreen, size = 32 }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <span
        className="inline-block animate-spin rounded-full border-[3px] border-border border-t-primary"
        style={{ width: size, height: size }}
      />
      {label && <p className="text-sm text-muted">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className="flex min-h-[60vh] w-full items-center justify-center">{content}</div>;
  }

  return content;
}
