import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onDone: () => void;
}

export default function Toast({ message, type = 'success', onDone }: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
    const t = setTimeout(() => setShow(false), 1800);
    const t2 = setTimeout(onDone, 2200);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className={`fixed top-20 left-1/2 z-50 -translate-x-1/2 px-5 py-2.5 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 ${
      type === 'error'
        ? 'bg-red-500 text-white'
        : 'bg-emerald-500 text-white'
    } ${show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
      {type === 'success' && (
        <svg className="inline w-4 h-4 mr-1.5 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {message}
    </div>
  );
}
