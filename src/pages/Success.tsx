import { Link } from 'react-router-dom';

const Success = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-4 bg-white">
      <img src="/coffee.svg" alt="Success" className="w-24 h-24 mb-6" />
      <h1 className="text-2xl font-semibold text-primary-700 mb-2">Success!</h1>
      <p className="text-gray-700 mb-4">Your action was completed.</p>
      <Link
        to="/"
        className="bg-orange-400 text-white px-6 py-3 rounded-full hover:bg-orange-500 transition"
      >
        Back to home
      </Link>
    </div>
  );
};

export default Success;
