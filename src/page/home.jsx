import { AiOutlineCamera } from "react-icons/ai";
import React from 'react';
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4'>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className='relative bg-white/70 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl w-full max-w-md lg:max-w-lg xl:max-w-xl p-8 lg:p-12 transform transition-all duration-500 hover:scale-105'>
        <div className="flex flex-col items-center space-y-8">
          
          {/* Camera Icon with modern styling */}
          <div className='relative'>
            <div className='h-24 w-24 lg:h-32 lg:w-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl transform transition-all duration-300 hover:rotate-6'>
              <AiOutlineCamera className="h-12 w-12 lg:h-16 lg:w-16 text-white"/>
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full blur opacity-30 animate-ping"></div>
          </div>

          {/* Title and description */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
              Kiosque Selfie
            </h1>
            <p className="text-gray-600 text-base lg:text-lg font-medium leading-relaxed max-w-sm">
              Créez des selfies uniques avec nos fonds personnalisés et partagez-les instantanément
            </p>
          </div>

          {/* CTA Button */}
          <Link 
            to="/capture" 
            className="group relative bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center gap-3 w-full justify-center sm:w-auto"
          >
            <AiOutlineCamera className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300"/> 
            <span>Commencer</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
          </Link>

          {/* Features list with modern styling */}
          <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-700 font-medium text-sm">Gratuit & Instantané</span>
              </div>
              <div className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-200"></div>
                <span className="text-gray-700 font-medium text-sm">Fonds Personnalisés</span>
              </div>
              <div className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-500"></div>
                <span className="text-gray-700 font-medium text-sm">Partage Instantané</span>
              </div>
            </div>
          </div>

          {/* Additional info */}
          <div className="text-center pt-4">
            <p className="text-xs text-gray-500">
              Envoi par SMS, email ou réseaux sociaux
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;