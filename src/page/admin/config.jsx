import React, { useState, useEffect } from 'react';
import { Settings, Save, TestTube, Server, MessageSquare, Eye, EyeOff } from 'lucide-react';

export default function Dashboard() {
  const [config, setConfig] = useState({});
  const [vpsInfo, setVpsInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingVps, setIsTestingVps] = useState(false);
  const [isTestingSms, setIsTestingSms] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [smsTestResult, setSmsTestResult] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});
  const [smsTestData, setSmsTestData] = useState({
    capture_id: '44c3acab-df5e-4556-96d7-f442fd861f48',
    phone: '+33667945730'
  });

  // Champs sensibles à masquer par défaut
  const sensitiveFields = [
    'ADMIN_API_KEY', 'SECRET_KEY', 'REMOTE_DATABASE_URL', 
    'OVH_APP_SECRET', 'OVH_CONSUMER_KEY'
  ];

  // Récupérer la configuration au chargement
  useEffect(() => {
    fetchConfig();
    fetchVpsInfo();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token d\'authentification manquant');
        setIsLoading(false);
        return;
      }

      const response = await fetch('https://selfikiosk.duckdns.org/api/admin/config', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else if (response.status === 401) {
        setError('Token d\'authentification invalide ou expiré');
      } else {
        setError('Erreur lors du chargement de la configuration');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVpsInfo = async () => {
    try {
      setIsTestingVps(true);
      
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('https://selfikiosk.duckdns.org/api/admin/test/vps', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVpsInfo(data);
      } else {
        console.error('Erreur lors du chargement des infos VPS');
        setVpsInfo({
          error: `Erreur ${response.status}`,
          message: 'Impossible de tester la connectivité VPS'
        });
      }
    } catch (error) {
      console.error('Erreur de connexion VPS:', error);
      setVpsInfo({
        error: 'Erreur de connexion',
        message: 'Impossible de contacter le serveur'
      });
    } finally {
      setIsTestingVps(false);
    }
  };

  const saveConfig = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSaveSuccess(false);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token d\'authentification manquant');
        return;
      }

      const response = await fetch('https://selfikiosk.duckdns.org/api/admin/config', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else if (response.status === 401) {
        setError('Token d\'authentification invalide ou expiré');
      } else {
        setError('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsSaving(false);
    }
  };

  const syncConfig = async () => {
    try {
      setIsSyncing(true);
      setError(null);
      setSyncSuccess(false);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token d\'authentification manquant');
        return;
      }

      const response = await fetch('https://selfikiosk.duckdns.org/api/admin/config/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setSyncSuccess(true);
        // Recharger la configuration après synchronisation
        await fetchConfig();
        setTimeout(() => setSyncSuccess(false), 3000);
        console.log('Synchronisation réussie:', result);
      } else if (response.status === 401) {
        setError('Token d\'authentification invalide ou expiré');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || 'Erreur lors de la synchronisation');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setIsSyncing(false);
    }
  };

  const testSms = async () => {
    if (!smsTestData.capture_id || !smsTestData.phone) {
      alert('Veuillez renseigner un ID de capture et un numéro de téléphone');
      return;
    }

    try {
      setIsTestingSms(true);
      setSmsTestResult(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token d\'authentification manquant');
        return;
      }

      const response = await fetch('https://selfikiosk.duckdns.org/api/admin/test/sms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(smsTestData),
      });

      const result = await response.json();
      
      if (response.ok) {
        setSmsTestResult({
          success: true,
          message: 'SMS test mis en file d\'attente avec succès !',
          data: result
        });
      } else {
        setSmsTestResult({
          success: false,
          message: result.detail || 'Erreur lors de l\'envoi du SMS test',
          data: result
        });
      }
    } catch (error) {
      console.error('Erreur lors du test SMS:', error);
      setSmsTestResult({
        success: false,
        message: 'Erreur de connexion au serveur',
        data: null
      });
    } finally {
      setIsTestingSms(false);
    }
  };

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSmsTestChange = (key, value) => {
    setSmsTestData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const formatFieldName = (key) => {
    return key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="bg-gray-50 border border-dashed border-gray-700 rounded-lg p-1 mb-6 grid grid-cols-4 gap-2 items-center justify-center">
          <a href="/admin" className="bg-white h-10 rounded-lg hover:bg-blue-200 justify-center items-center flex">Vue ensemble</a>
          <a href="/admin/fonds" className="bg-white h-10 rounded-lg hover:bg-blue-200 justify-center items-center flex">Fonds</a>
          <a href="/admin/capture" className="bg-white h-10 rounded-lg hover:bg-blue-200 justify-center items-center flex">Captures</a>
          <a href="/admin/config" className="bg-blue-300 h-10 rounded-lg hover:bg-blue-500 justify-center items-center flex">Configuration</a>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuration système</h1>
            <p className="text-gray-600 mt-1">Gérez les paramètres et testez les services</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={syncConfig}
              disabled={isSyncing || isLoading}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              {isSyncing ? 'Sync...' : 'Synchroniser DB'}
            </button>
            <button
              onClick={saveConfig}
              disabled={isSaving || isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        {/* Sync Success Banner */}
        {syncSuccess && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex items-center">
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
            <span className="text-orange-800 font-medium">Configuration synchronisée avec la base de données !</span>
          </div>
        )}

        {/* Success Banner */}
        {saveSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
            <span className="text-green-800 font-medium">Configuration sauvegardée avec succès !</span>
          </div>
        )}

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
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8 mb-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Chargement de la configuration...</p>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration générale */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-gray-900 text-lg font-semibold mb-6 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Configuration générale
              </h3>
              
              <div className="space-y-4">
                {Object.entries(config).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formatFieldName(key)}
                    </label>
                    <div className="relative">
                      <input
                        type={sensitiveFields.includes(key) && !showPasswords[key] ? "password" : "text"}
                        value={value || ''}
                        onChange={(e) => handleConfigChange(key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Entrez ${formatFieldName(key).toLowerCase()}`}
                      />
                      {/* Bouton pour afficher/masquer les champs sensibles */}
                      {sensitiveFields.includes(key) && (
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(key)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                    {sensitiveFields.includes(key) && (
                      <p className="text-xs text-gray-500 mt-1">
                        🔒 Champ sensible - cliquez sur l'œil pour afficher
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Informations VPS */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-gray-900 text-lg font-semibold flex items-center">
                  <Server className="w-5 h-5 mr-2" />
                  Informations VPS
                </h3>
                <button
                  onClick={fetchVpsInfo}
                  disabled={isTestingVps}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {isTestingVps ? 'Test...' : 'Tester VPS'}
                </button>
              </div>
              
              {isTestingVps ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600 text-sm">Test du VPS en cours...</p>
                </div>
              ) : vpsInfo ? (
                <div className="space-y-3">
                  {vpsInfo.error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800 text-sm font-medium">{vpsInfo.error}</p>
                      <p className="text-red-600 text-xs mt-1">{vpsInfo.message}</p>
                    </div>
                  ) : (
                    Object.entries(vpsInfo).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-gray-600 text-sm font-medium">
                          {formatFieldName(key)}
                        </span>
                        <span className="text-gray-900 text-sm font-mono bg-gray-50 px-2 py-1 rounded max-w-xs truncate">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Server className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Cliquez sur "Tester VPS" pour charger les informations</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Test SMS Section */}
        {!isLoading && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-gray-900 text-lg font-semibold mb-6 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Test SMS
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Formulaire de test */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID de capture
                  </label>
                  <input
                    type="text"
                    value={smsTestData.capture_id}
                    onChange={(e) => handleSmsTestChange('capture_id', e.target.value)}
                    placeholder="Ex: 44c3acab-df5e-4556-96d7-f442fd861f48"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Un ID d'exemple est déjà rempli pour le test
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de téléphone
                  </label>
                  <input
                    type="tel"
                    value={smsTestData.phone}
                    onChange={(e) => handleSmsTestChange('phone', e.target.value)}
                    placeholder="Ex: +261383572066"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    📱 Format international recommandé (+33, +261, etc.)
                  </p>
                </div>
                
                <button
                  onClick={testSms}
                  disabled={isTestingSms || !smsTestData.capture_id || !smsTestData.phone}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {isTestingSms ? 'Envoi en cours...' : 'Tester l\'envoi SMS'}
                </button>
              </div>

              {/* Résultat du test */}
              <div className="space-y-4">
                <h4 className="text-gray-700 font-medium">Résultat du test</h4>
                
                {isTestingSms ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-blue-800">Test SMS en cours...</span>
                    </div>
                  </div>
                ) : smsTestResult ? (
                  <div className={`border rounded-lg p-4 ${
                    smsTestResult.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
                        smsTestResult.success 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {smsTestResult.success ? '✓' : '×'}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${
                          smsTestResult.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {smsTestResult.message}
                        </p>
                        {smsTestResult.success && (
                          <p className="text-green-600 text-xs mt-1">
                            📱 Le SMS a été mis en file d'attente pour envoi
                          </p>
                        )}
                        {smsTestResult.data && (
                          <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                            {JSON.stringify(smsTestResult.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500 text-sm">Aucun test effectué</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}