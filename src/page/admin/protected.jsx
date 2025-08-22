import React, { useEffect, useCallback, useRef } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { toast } from 'react-toastify';

const Protected = () => {
  const isAuthenticated = localStorage.getItem("token");
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  
  // Configuration du timeout (en millisecondes)
  const INACTIVITY_TIME = 15 * 60 * 1000; // 15 minutes
  const WARNING_TIME = 13 * 60 * 1000; // 13 minutes (2 min avant expiration)

  // Fonction de déconnexion
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    toast.error("Session expirée. Vous avez été déconnecté pour inactivité.");
    // Forcer le rechargement pour rediriger
    window.location.href = "/admin/login";
  }, []);

  // Fonction d'avertissement
  const showWarning = useCallback(() => {
    toast.warning("Votre session expirera dans 2 minutes. Bougez votre souris pour rester connecté.", {
      autoClose: 10000,
      toastId: "session-warning" // Éviter les doublons
    });
  }, []);

  // Réinitialiser le timer
  const resetTimer = useCallback(() => {
    // Nettoyer les timers existants
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Démarrer nouveaux timers seulement si authentifié
    if (isAuthenticated) {
      // Timer d'avertissement
      warningTimeoutRef.current = setTimeout(showWarning, WARNING_TIME);
      
      // Timer de déconnexion
      timeoutRef.current = setTimeout(logout, INACTIVITY_TIME);
    }
  }, [isAuthenticated, logout, showWarning]);

  // Gestionnaire d'événements d'activité
  const handleActivity = useCallback(() => {
    if (isAuthenticated) {
      resetTimer();
      // Fermer l'avertissement s'il existe
      toast.dismiss("session-warning");
    }
  }, [isAuthenticated, resetTimer]);

  useEffect(() => {
    if (!isAuthenticated) {
      return; // Pas de timer si non authentifié
    }

    // Liste des événements à surveiller
    const events = [
      'mousedown', 
      'mousemove', 
      'keypress', 
      'scroll', 
      'touchstart', 
      'click'
    ];

    // Démarrer le timer initial
    resetTimer();

    // Ajouter les event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Fonction de nettoyage
    return () => {
      // Supprimer les event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      // Nettoyer les timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [isAuthenticated, handleActivity, resetTimer]);

  // Si pas authentifié, rediriger vers login
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Si authentifié, rendre les routes protégées
  return <Outlet />;
};

export default Protected;