import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/context/AuthContext';

function Notfound() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleReturnClick = () => {
    if (user) {
      // User is authenticated, go to dashboard
      navigate('/');
    } else {
      // User is not authenticated, go to login
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center relative overflow-hidden">
      {/* Diagonal lines background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 35px,
            rgba(255,255,255,0.1) 35px,
            rgba(255,255,255,0.1) 70px
          )`
        }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        {/* 404 Numbers */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <div className="bg-white rounded-3xl w-24 h-24 flex items-center justify-center shadow-lg">
            <span className="text-5xl font-bold text-gray-900">4</span>
          </div>
          <div className="bg-white rounded-3xl w-24 h-24 flex items-center justify-center shadow-lg">
            <span className="text-5xl font-bold text-gray-900">0</span>
          </div>
          <div className="bg-white rounded-3xl w-24 h-24 flex items-center justify-center shadow-lg">
            <span className="text-5xl font-bold text-gray-900">4</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold text-white mb-6">
          Page Not Found
        </h1>

        {/* Description */}
        <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto leading-relaxed">
          The page you are looking for was removed, moved, renamed,
          <br />
          or might never existed.
        </p>

        {/* Return Button */}
        <button
          onClick={handleReturnClick}
          className="bg-white text-gray-900 px-8 py-3 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors duration-200 shadow-lg"
        >
          {user ? 'Return to Dashboard' : 'Return to Login'}
        </button>
      </div>
    </div>
  );
}

export default Notfound;