import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="empty-state min-h-[60vh]">
      <span className="text-6xl font-black text-border-strong">404</span>
      <h3>Page not found</h3>
      <p>The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
      <Link to="/" className="btn btn-primary">Back to home</Link>
    </div>
  );
}
