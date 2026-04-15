import { useEffect } from 'react';

export default function ImagePreviewModal({ src, alt = 'Preview', onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-6 backdrop-blur-md"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl font-light text-slate-800 shadow-lg ring-1 ring-slate-200/80 transition hover:scale-105 hover:bg-slate-50"
        aria-label="Close"
      >
        ×
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-[88vh] max-w-full rounded-2xl object-contain shadow-2xl ring-1 ring-white/30"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
