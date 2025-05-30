import { useEffect, ReactNode } from 'react';

interface ToastProps {
  message: ReactNode;
  icon?: React.ReactNode;
  onClose: () => void;
  duration?: number;
}

const Toast = ({ message, icon, onClose, duration = 4000 }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white border border-green-300 shadow-lg rounded-2xl px-6 py-4 animate-fade-in-out min-w-[220px] max-w-xs sm:max-w-md">
      {icon && <span className="text-2xl">{icon}</span>}
      <span className="text-green-800 font-semibold flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 text-green-700 hover:text-green-900 text-lg font-bold focus:outline-none">×</button>
    </div>
  );
};

export default Toast; 