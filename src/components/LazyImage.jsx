import { useState, useEffect, useRef } from 'react'

export default function LazyImage({ src, alt, className, style, placeholder }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px' // Start loading 50px before image enters viewport
      }
    )

    observer.observe(imgRef.current)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={imgRef}
      className={className}
      style={{
        ...style,
        background: isLoaded ? 'transparent' : (placeholder || 'var(--sand)'),
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {isInView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
          onLoad={() => setIsLoaded(true)}
        />
      )}
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '12px',
            color: 'var(--text-muted)'
          }}
        >
          ...
        </div>
      )}
    </div>
  )
}
