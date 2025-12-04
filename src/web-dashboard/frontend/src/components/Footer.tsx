import React from 'react';
import { Github, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* ResQ Hub Info */}
          <div>
            <div className="flex items-center mb-4">
              <img
                src="/logo.png"
                alt="ResQ Hub Logo"
                className="w-10 h-10 rounded-lg mr-3"
              />
              <div>
                <h3 className="text-xl font-bold text-white">ResQ Hub</h3>
                <p className="text-xs text-gray-400">National Disaster Management Platform</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Production-ready emergency response system with real-time flood monitoring, 
              relief coordination, and volunteer management for Sri Lanka.
            </p>
          </div>

          {/* Development Team */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Development Team</h4>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium text-gray-200">Shalon Fernando</p>
                <p className="text-xs text-gray-400">Lead Software Engineer</p>
              </div>
              <div>
                <p className="font-medium text-gray-200">Gaindu</p>
                <p className="text-xs text-gray-400">Web Dashboard Development</p>
              </div>
              <div>
                <p className="font-medium text-gray-200">Lehan</p>
                <p className="text-xs text-gray-400">Web Dashboard Development</p>
              </div>
              <div>
                <p className="font-medium text-gray-200">Pavith</p>
                <p className="text-xs text-gray-400">Web Dashboard Development</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Platform Info</h4>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-400">Frontend: Vercel</p>
                <a 
                  href="https://resq-five.vercel.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors text-xs break-all"
                >
                  resq-five.vercel.app
                </a>
              </div>
              <div>
                <p className="text-gray-400">Backend: Render</p>
                <a 
                  href="https://resq-backend-3efi.onrender.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors text-xs break-all"
                >
                  resq-backend-3efi.onrender.com
                </a>
              </div>
              <div>
                <p className="text-gray-400">Data Sources:</p>
                <p className="text-xs text-gray-500">DMC Flood API • Supabase Relief API</p>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Warning */}
        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" aria-label="Warning" role="img">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-yellow-400 mb-2">Privacy Notice</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Due to the emergency nature of this situation, all personal information submitted through this platform 
                (including name, phone number, and location) will be <strong className="text-yellow-400">publicly visible</strong> to 
                relief groups, volunteers, and anyone accessing this platform. This enables fast coordination during the crisis. 
                If you do not want your details to be shared publicly, please do not submit information through this platform.
              </p>
            </div>
          </div>
        </div>

        {/* Open Source Callout */}
        <div className="bg-green-900/10 border border-green-800/20 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-200">
              ResQ is now fully open-source — we welcome contributions (frontend, backend, mobile, docs, UI/UX and more). 
              <a
                href="https://github.com/disaster-response-sl/resq"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-green-300 hover:text-green-200 underline"
              >Contribute on GitHub</a>
            </p>
            <span className="text-xl">🚀</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2 text-sm">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>by Shalon Fernando and Development Team</span>
          </div>
          
          <div className="text-sm text-gray-400">
            <p>© 2025 ResQ Hub. Built for Sri Lanka's disaster response needs.</p>
          </div>
          
          <a
            href="https://github.com/disaster-response-sl/resq"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
