import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const [individualId, setIndividualId] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!individualId || !otp) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await login(individualId, otp);
      
      if (success) {
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        toast.error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Back to Citizen Portal Link - Mobile Responsive */}
      <button
        onClick={() => navigate('/citizen')}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-1 sm:gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors text-sm sm:text-base"
      >
        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="hidden sm:inline">Back to Citizen Portal</span>
        <span className="sm:hidden">Back</span>
      </button>

      {/* Centered Login Container - Mobile Responsive */}
      <div className="max-w-md w-full px-4 sm:px-6">
        {/* Header Section - Mobile Responsive */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <img
              src="/favicon.png"
              alt="ResQ Hub Logo"
              className="w-10 h-10 sm:w-12 sm:h-12 mr-2 sm:mr-3"
            />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              ResQ Hub
            </h1>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">
            Admin/Responder Login
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm">
            National Disaster Management Platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Individual ID Field - Mobile Responsive */}
          <div>
            <input
              id="individualId"
              type="text"
              value={individualId}
              onChange={(e) => setIndividualId(e.target.value)}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base text-gray-700 placeholder-gray-400 shadow-sm"
              placeholder="Enter your ID"
              disabled={isLoading}
            />
          </div>

          {/* OTP Field - Mobile Responsive */}
          <div>
            <div className="relative">
              <input
                id="otp"
                type={showOtp ? 'text' : 'password'}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 pr-10 sm:pr-12 bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base text-gray-700 placeholder-gray-400 shadow-sm"
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowOtp(!showOtp)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                {showOtp ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button - Mobile Responsive */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2.5 px-4 sm:py-3 rounded-full font-medium text-sm sm:text-base hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Footer - Mobile Responsive */}
        <div className="text-center mt-4 sm:mt-6 text-xs sm:text-sm text-gray-500">
          <p>ResQ Hub - National Disaster Management Platform © 2025</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
