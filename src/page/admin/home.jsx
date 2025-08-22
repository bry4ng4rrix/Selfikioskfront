import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, Camera, Zap, Download, Trash2, Users } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_captures: 0,
    unsynced_captures: 0,
    backgrounds: 0,
    admins: 0,
    captures_last_24h: 0
  });
  const [health, setHealth] = useState({
    status: 'En attente...',
    checks: {},
    connectivity: { status: 'unknown' }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({
    sync: false,
    export: false,
    cleanup: false
  });

  // Récupérer les statistiques au chargement
  useEffect(() => {
    fetchStats();
    fetchHealth();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token d\'authentification manquant');
        setIsLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8000/admin/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else if (response.status === 401) {
        setError('Token d\'authentification invalide ou expiré');
        // Optionnel: rediriger vers la page de connexion
        // window.location.href = '/login';
      } else {
        setError('Erreur lors du chargement des statistiques');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStats = () => {
    fetchStats();
  };

  // Fonction pour récupérer l'état de santé du système
  

  // Fonction pour récupérer l'état de santé du système
  const fetchHealth = async () => {
    try {
      setHealthLoading(true);
      
      const response = await fetch('http://localhost:8000/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHealth(data);
      } else {
        console.error('Erreur lors du chargement de l\'état de santé');
        setHealth({
          status: 'Erreur',
          checks: {},
          connectivity: { status: 'offline' }
        });
      }
    } catch (error) {
      console.error('Erreur de connexion pour l\'état de santé:', error);
      setHealth({
        status: 'Erreur de connexion',
        checks: {},
        connectivity: { status: 'offline' }
      });
    } finally {
      setHealthLoading(false);
    }
  };

  // Fonction pour tester l'état de santé
  const testHealth = () => {
    fetchHealth();
  };

  // Fonction pour synchroniser la base de données
  const syncDatabase = async () => {
    try {
      setActionLoading(prev => ({ ...prev, sync: true }));
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token d\'authentification manquant');
        return;
      }

      const response = await fetch('http://localhost:8000/admin/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Actualiser les statistiques après la synchronisation
        await fetchStats();
        console.log('Synchronisation réussie');
      } else if (response.status === 401) {
        setError('Token d\'authentification invalide ou expiré');
      } else {
        setError('Erreur lors de la synchronisation');
      }
    } catch (error) {
      console.error('Erreur de connexion lors de la synchronisation:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setActionLoading(prev => ({ ...prev, sync: false }));
    }
  };

  // Fonction pour exporter les données en CSV (compatible Excel)
 
  const exportData = async () => {
    try {
      setActionLoading(prev => ({ ...prev, export: true }));

      // Créer les données CSV
      const csvData = [
        ['Statistique', 'Valeur'],
        ['Captures totales', stats.total_captures],
        ['Captures non synchronisées', stats.unsynced_captures],
        ['Captures dernières 24h', stats.captures_last_24h],
        ['Fonds d\'écran', stats.backgrounds],
        ['Administrateurs', stats.admins],
        ['Date d\'export', new Date().toLocaleString('fr-FR')]
      ];

      // Convertir en CSV
      const csvContent = csvData.map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n');

      // Créer le blob avec BOM pour Excel
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });

      // Créer le lien de téléchargement
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const fileName = `export-donnees-${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('download', fileName);
      
      // Déclencher le téléchargement
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Export réussi');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      setError('Erreur lors de l\'export des données');
    } finally {
      setActionLoading(prev => ({ ...prev, export: false }));
    }
  };

  // Fonction pour nettoyer toutes les données
  const cleanupAllData = async () => {
    if (!window.confirm('⚠️ ATTENTION: Cette action va supprimer TOUTES les données de façon permanente. Êtes-vous absolument sûr de vouloir continuer ?')) {
      return;
    }

    if (!window.confirm('Dernière confirmation: Toutes les captures, fonds d\'écran et données seront définitivement supprimés. Confirmer ?')) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, cleanup: true }));
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token d\'authentification manquant');
        return;
      }

      const response = await fetch('http://localhost:8000/admin/cleanup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Actualiser les statistiques après le nettoyage
        await fetchStats();
        console.log('Nettoyage réussi');
      } else if (response.status === 401) {
        setError('Token d\'authentification invalide ou expiré');
      } else {
        setError('Erreur lors du nettoyage des données');
      }
    } catch (error) {
      console.error('Erreur de connexion lors du nettoyage:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setActionLoading(prev => ({ ...prev, cleanup: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
       <div className="bg-gray-50 border border-dashed border-gray-700 rounded-lg p-1 mb-6 grid grid-cols-4 gap-2 items-center justify-center">
          <a href="/admin" className="bg-blue-300 h-10 rounded-lg hover:bg-blue-200 justify-center items-center flex">Vue ensemble</a>
          <a href="/admin/fonds" className="bg-white h-10 rounded-lg hover:bg-blue-200 justify-center items-center flex">Fonds</a>
          <a href="/admin/capture" className="bg-white h-10 rounded-lg hover:bg-blue-200 justify-center items-center flex">Capture</a>
          <a href="/admin/config" className="bg-white h-10 rounded-lg hover:bg-blu-200 justify-center items-center flex">Configuration</a>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">×</span>
              </div>
              <span className="text-red-800 font-medium">{error}</span>
            </div>
            <button 
              onClick={refreshStats}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8 mb-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Chargement des statistiques...</p>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Captures Totales */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-4">Capture Totale</h3>
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Photos totales</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_captures}</p>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-4">Configuration</h3>
            <div className="flex items-center">
              <div className="bg-orange-100 p-2 rounded-lg mr-3">
                <RefreshCw className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">En attente sync</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unsynced_captures}</p>
              </div>
            </div>
          </div>

          {/* Fonds d'écran */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-4">Fonds</h3>
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <Camera className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Fonds disponibles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.backgrounds}</p>
              </div>
            </div>
          </div>

          {/* Admins */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-gray-600 text-sm font-medium mb-4">Administration</h3>
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-lg mr-3">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Administrateurs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* État du système */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-gray-900 text-lg font-semibold">État du système</h3>
              <button
                onClick={testHealth}
                disabled={healthLoading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                {healthLoading ? 'Test...' : 'Test'}
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Statut global */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Statut global</span>
                <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                  health.status === 'Bonne' ? 'bg-green-100 text-green-800' :
                  health.status === 'Mauvaise' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {health.status}
                </span>
              </div>

              {/* Connectivité */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Connectivité</span>
                <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                  health.connectivity?.status === 'online' ? 'bg-green-100 text-green-800' :
                  health.connectivity?.status === 'offline' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {health.connectivity?.online ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>

              {/* Base de données locale */}
              {health.checks?.database?.local_db && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Base locale</span>
                  <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                    health.checks.database.local_db.status === 'Bonne' ? 'bg-green-100 text-green-800' :
                    health.checks.database.local_db.status === 'Mauvaise' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {health.checks.database.local_db.status}
                  </span>
                </div>
              )}

              {/* Base de données distante */}
              {health.checks?.database?.remote_db && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Base distante</span>
                  <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                    health.checks.database.remote_db.status === 'Bonne' ? 'bg-green-100 text-green-800' :
                    health.checks.database.remote_db.status === 'Mauvaise' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {health.checks.database.remote_db.status}
                  </span>
                </div>
              )}

              {/* Disque */}
              {health.checks?.disk && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Disque</span>
                  <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                    health.checks.disk.status === 'Bonne' ? 'bg-green-100 text-green-800' :
                    health.checks.disk.status === 'Mauvaise' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {health.checks.disk.status}
                  </span>
                </div>
              )}

              {/* VPS */}
              {health.checks?.vps && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">VPS</span>
                  <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                    health.checks.vps.status === 'Bonne' ? 'bg-green-100 text-green-800' :
                    health.checks.vps.status === 'Mauvaise' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {health.checks.vps.status}
                  </span>
                </div>
              )}

              {/* OVH API */}
              {health.checks?.ovh_api && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">API OVH</span>
                  <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                    health.checks.ovh_api.status === 'Bonne' ? 'bg-green-100 text-green-800' :
                    health.checks.ovh_api.status === 'Mauvaise' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {health.checks.ovh_api.status}
                  </span>
                </div>
              )}

              {/* Redis */}
              {health.checks?.redis && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Redis</span>
                  <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                    health.checks.redis.status === 'Bonne' ? 'bg-green-100 text-green-800' :
                    health.checks.redis.status === 'Mauvaise' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {health.checks.redis.status}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-gray-900 text-lg font-semibold mb-6">Actions rapides</h3>
            <div className="space-y-3">
              <button 
                onClick={refreshStats}
                disabled={isLoading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Syncronisation...' : 'Syncroniser les base de donne'}
              </button>
              <button 
                onClick={refreshStats}
                disabled={isLoading}
                className="w-full bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Actualisation...' : 'Actualiser les statistiques'}
              </button>
              <button 
                onClick={exportData}
                disabled={actionLoading.export}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" />
                {actionLoading.export ? 'Export en cours...' : 'Exporter les données'}
              </button>
              <button 
                onClick={cleanupAllData}
                disabled={actionLoading.cleanup}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {actionLoading.cleanup ? 'Suppression...' : 'Effacer toutes les données'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}