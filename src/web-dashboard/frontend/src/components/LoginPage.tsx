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
      {/* Back to Citizen Portal Link */}
      <button
        onClick={() => navigate('/citizen')}
        className="absolute top-6 left-6 flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Back to Citizen Portal</span>
      </button>

      {/* Centered Login Container */}
      <div className="max-w-md w-full mx-4">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/favicon.png"
              alt="ResQ Hub Logo"
              className="w-12 h-12 mr-3"
            />
            <h1 className="text-2xl font-bold text-gray-900">
              ResQ Hub
            </h1>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Admin/Responder Login
          </h2>
          <p className="text-gray-500 text-sm">
            National Disaster Management Platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Individual ID Field */}
          <div>
            <input
              id="individualId"
              type="text"
              value={individualId}
              onChange={(e) => setIndividualId(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-400 shadow-sm"
              placeholder="Enter your ID"
              disabled={isLoading}
            />
          </div>

          {/* OTP Field */}
          <div>
            <div className="relative">
              <input
                id="otp"
                type={showOtp ? 'text' : 'password'}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-400 shadow-sm"
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowOtp(!showOtp)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                {showOtp ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-full font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-300 opacity-75">
          <h3 className="text-xs font-medium text-gray-600 mb-2">Demo Credentials (Click to use):</h3>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setIndividualId('responder001');
                setOtp('123456');
              }}
              className="w-full text-left p-1.5 text-xs bg-gray-200 hover:bg-gray-300 rounded border border-gray-400 transition-colors opacity-90 hover:opacity-100"
              disabled={isLoading}
            >
              <div className="font-medium text-gray-700">Responder Account</div>
              <div className="text-gray-600">responder001 / OTP: 123456</div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIndividualId('admin001');
                setOtp('123456');
              }}
              className="w-full text-left p-1.5 text-xs bg-gray-200 hover:bg-gray-300 rounded border border-gray-400 transition-colors opacity-90 hover:opacity-100"
              disabled={isLoading}
            >
              <div className="font-medium text-gray-700">Admin Account</div>
              <div className="text-gray-600">admin001 / OTP: 123456</div>
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            Click any credential above to auto-fill the form
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>ResQ Hub - National Disaster Management Platform © 2025</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
