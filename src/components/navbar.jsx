import { AiFillExclamationCircle } from "react-icons/ai"; 
import { BsWifiOff } from "react-icons/bs"; 
import { AiOutlineWifi, AiFillCamera, AiOutlineLogout,  AiOutlineClose, AiOutlineCheckCircle } from "react-icons/ai";
import { useState, React, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: '', title: '', message: '' });
  const navigate = useNavigate();

  // Vérifier l'authentification au montage du composant
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  // Fonction pour afficher un modal
  const showModal = (type, title, message) => {
    setModal({ isOpen: true, type, title, message });
    
    // Auto-fermeture pour les notifications (pas pour les confirmations)
    if (type !== 'confirm') {
      setTimeout(() => {
        setModal(prev => ({ ...prev, isOpen: false }));
      }, 4000);
    }
  };

  // Fermer le modal
  const closeModal = () => {
    setModal({ isOpen: false, type: '', title: '', message: '' });
  };

  // Gérer les changements de statut réseau
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showModal('success', 'Connexion rétablie', 'Vous êtes maintenant connecté à Internet');
    };

    const handleOffline = () => {
      setIsOnline(false);
      showModal('warning', 'Connexion perdue', 'Vous êtes en mode hors ligne. Certaines fonctionnalités peuvent être limitées.');
    };

    // Écouter les événements de connexion
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Vérification périodique de la connectivité
    const checkConnectivity = async () => {
      try {
        const response = await fetch('/api/health-check', {
          method: 'HEAD',
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          setIsOnline(false);
        }
      } catch (error) {
        // Gestion silencieuse des erreurs de vérification
      }
    };

    // Vérifier la connectivité toutes les 30 secondes si en ligne
    const connectivityInterval = setInterval(() => {
      if (navigator.onLine) {
        checkConnectivity();
      }
    }, 30000);

    // Nettoyage
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectivityInterval);
    };
  }, []);

  // Fonction de déconnexion avec modal de confirmation
  const handleLogout = () => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Confirmer la déconnexion',
      message: 'Êtes-vous sûr de vouloir vous déconnecter de votre session administrateur ?'
    });
  };

  // Confirmer la déconnexion
  const confirmLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    closeModal();
    showModal('success', 'Déconnexion réussie', 'Vous avez été déconnecté avec succès');
    setTimeout(() => {
      navigate('/admin/login');
    }, 2000);
  };

  // Composant Modal
  const Modal = () => {
    if (!modal.isOpen) return null;

    const getModalStyles = () => {
      switch (modal.type) {
        case 'success':
          return {
            icon: <AiOutlineCheckCircle className="text-4xl text-green-500" />,
            bgColor: 'from-green-50 to-emerald-50',
            borderColor: 'border-green-200',
            buttonColor: 'bg-green-500 hover:bg-green-600'
          };
        case 'warning':
          return {
            icon: <AiFillExclamationCircle className="text-4xl text-orange-500" />,
            bgColor: 'from-orange-50 to-yellow-50',
            borderColor: 'border-orange-200',
            buttonColor: 'bg-orange-500 hover:bg-orange-600'
          };
        case 'confirm':
          return {
            icon: <AiFillExclamationCircle className="text-4xl text-blue-500" />,
            bgColor: 'from-blue-50 to-indigo-50',
            borderColor: 'border-blue-200',
            buttonColor: 'bg-blue-500 hover:bg-blue-600'
          };
        default:
          return {
            icon: <AiOutlineCheckCircle className="text-4xl text-gray-500" />,
            bgColor: 'from-gray-50 to-slate-50',
            borderColor: 'border-gray-200',
            buttonColor: 'bg-gray-500 hover:bg-gray-600'
          };
      }
    };

    const styles = getModalStyles();

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className={`bg-gradient-to-br ${styles.bgColor} border ${styles.borderColor} rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100`}>
          
          {/* Header avec bouton fermer */}
          <div className="flex justify-between items-center p-6 pb-4">
            <div className="flex items-center space-x-3">
              {styles.icon}
              <h3 className="text-xl font-bold text-gray-800">{modal.title}</h3>
            </div>
            {modal.type !== 'confirm' && (
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <AiOutlineClose className="text-xl" />
              </button>
            )}
          </div>

          {/* Contenu */}
          <div className="px-6 pb-6">
            <p className="text-gray-600 text-base leading-relaxed mb-6">
              {modal.message}
            </p>

            {/* Boutons */}
            <div className="flex gap-3 justify-end">
              {modal.type === 'confirm' ? (
                <>
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Déconnecter
                  </button>
                </>
              ) : (
                <button
                  onClick={closeModal}
                  className={`px-6 py-2 ${styles.buttonColor} text-white rounded-lg font-medium transition-colors`}
                >
                  Compris
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className='w-full h-14 flex items-center justify-between bg-white shadow-sm border-b border-gray-100 px-4'>
        {/* Logo et titre */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <AiFillCamera className="text-blue-500 text-xl"/>
          </div>
          <h1 className="text-lg font-bold text-gray-800">SelfieKiosk</h1>
        </div>

        {/* Section droite avec statut et boutons */}
        <div className="flex items-center gap-4">
          
          {/* Statut réseau */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <AiOutlineWifi className="text-green-500 text-xl"/>
                <span className="text-sm font-medium text-green-600">En ligne</span>
              </>
            ) : (
              <> 
                <BsWifiOff  className="text-red-500 text-xl"/>
                <span className="text-sm font-medium text-red-600">Hors ligne</span>
              </>
            )}
          </div>

          {/* Bouton de déconnexion (si authentifié) */}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-300"
              title="Se déconnecter"
            >
              <AiOutlineLogout className="text-lg"/>
              <span className="text-sm font-medium hidden sm:block">Déconnexion</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal />
    </>
  );
};

export default Navbar;