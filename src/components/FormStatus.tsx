export type FormStatusProps = {
  type: 'success' | 'error' | 'info';
  msg: string;
};

const FormStatus = ({ type, msg }: FormStatusProps) => {
  const baseClasses = 'p-4 rounded-md text-sm';
  const typeClasses = {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  if (!msg) return null;

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`} role="alert">
      {msg}
    </div>
  );
};

export default FormStatus;
