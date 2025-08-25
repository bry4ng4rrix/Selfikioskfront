import { React, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AiOutlineMail, AiOutlineLock, AiOutlineEye, AiOutlineEyeInvisible, AiOutlineUser } from 'react-icons/ai';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    
    toast.dismiss();
    
    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs.');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('https://selfikiosk.duckdns.org/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const result = await response.json();
      console.log(result.access_token);
      
      if (response.ok) {
        localStorage.setItem('token', result.access_token);
        toast.success('Connexion réussie !');
        setTimeout(() => {
          navigate('/admin');
        }, 2000);
      } else {
        if (result.non_field_errors) {
          toast.error(result.non_field_errors[0]);
        }
      }
    } catch (error) {
      toast.error('Erreur réseau ou serveur indisponible.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 flex items-center justify-center p-4'>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        theme="light"
        pauseOnHover
        transition={Bounce}
      />

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-sky-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-3/4 w-48 h-48 bg-indigo-200/25 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className='relative bg-white/80 backdrop-blur-sm border border-blue-100/50 shadow-xl rounded-2xl w-full max-w-md lg:max-w-lg p-8 lg:p-10'>
        <div className="flex flex-col space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className='h-16 w-16 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center mx-auto shadow-lg'>
              <AiOutlineUser className="h-8 w-8 text-white"/>
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                Espace Admin
              </h1>
              <p className="text-gray-600 text-sm lg:text-base font-medium">
                Bienvenue ! Connectez-vous pour gérer votre kiosque
              </p>
            </div>
          </div>

          {/* Login Form */}
          <div className='space-y-6'>
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className='text-gray-700 font-medium text-sm'>
                Adresse email
              </label>
              <div className="relative">
                <AiOutlineMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-5 w-5" />
                <input 
                  id="email"
                  type="email" 
                  className='w-full bg-white/70 border-2 border-blue-100 rounded-xl pl-10 pr-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300'
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className='text-gray-700 font-medium text-sm'>
                Mot de passe
              </label>
              <div className="relative">
                <AiOutlineLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-5 w-5" />
                <input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className='w-full bg-white/70 border-2 border-blue-100 rounded-xl pl-10 pr-12 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300'
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <AiOutlineEyeInvisible className="h-5 w-5" /> : <AiOutlineEye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button 
              className={`w-full bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-102 hover:shadow-xl ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Connexion en cours...
                </div>
              ) : (
                'Se connecter'
              )}
            </button>
          </div>

          {/* Features */}
          <div className="pt-6 border-t border-blue-100">
            <p className="text-gray-500 text-xs text-center mb-4 font-medium">Fonctionnalités disponibles</p>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center space-x-3 text-gray-600 text-sm bg-green-50 p-3 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Gestion des photos et backgrounds</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-600 text-sm bg-blue-50 p-3 rounded-lg">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Configuration des paramètres</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-600 text-sm bg-purple-50 p-3 rounded-lg">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Analytics et statistiques</span>
              </div>
            </div>
          </div>

          {/* Help text */}
          <div className="text-center">
            <p className="text-gray-500 text-xs">
              Besoin d'aide ? Contactez le support technique
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;