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
                <p className="text-xs text-gray-400">Lead Software Engineer & Full-Stack Architect</p>
              </div>
              <div>
                <p className="font-medium text-gray-200">Gaindu</p>
                <p className="text-xs text-gray-400">Mobile App Development</p>
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

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2 text-sm">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>by Development Team</span>
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
