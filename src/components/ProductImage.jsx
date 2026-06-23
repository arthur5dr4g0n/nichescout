import { useState } from 'react'

// Image with a graceful gradient fallback (mock images need internet).
export default function ProductImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(!src)
  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-brand-tint to-surface2 text-2xl ${className}`}
      >
        📦
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  )
}
