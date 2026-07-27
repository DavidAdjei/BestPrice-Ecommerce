interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  className?: string;
}

// Cloudinary URLs look like:
//   https://res.cloudinary.com/<cloud>/image/upload/v123/abc.jpg
// Inserting a transform segment right after "/upload/" resizes and
// compresses on the fly — no extra requests, no build step.
const applyCloudinaryTransform = (url: string, width: number) => {
  const marker = "/image/upload/";
  const index = url.indexOf(marker);
  if (index === -1) return url; // not a Cloudinary URL — leave it alone
  const insertAt = index + marker.length;
  return `${url.slice(0, insertAt)}f_auto,q_auto,w_${width}/${url.slice(insertAt)}`;
};

export function ProductImage({ src, alt, width = 400, className }: ProductImageProps) {
  if (!src) return <div className={className} aria-hidden />;

  const optimizedSrc = applyCloudinaryTransform(src, width);

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
    />
  );
}
