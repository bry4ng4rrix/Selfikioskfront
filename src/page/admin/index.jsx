import React, { useState ,useEffect } from 'react';
import { Tabs, Tab, Box, Typography, Button, TextField, Paper, Grid, CircularProgress } from '@mui/material';
import { CloudUpload, Delete, Save, Refresh, CloudDownload, Settings, Image, Visibility, Storage, Message } from '@mui/icons-material';

const Admin = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [settings, setSettings] = useState({
    ovh: { apiKey: '', endpoint: '' },
    vps: { host: '', username: '', password: '' },
    googleReviews: { url: '', isEnabled: true },
    countdown: 5,
    customMessages: { welcome: '', success: '', error: '' },
  });

  const [backgrounds, setBackgrounds] = useState([
    { id: 1, name: 'Plage', url: '/backgrounds/beach.jpg', isDefault: true },
    { id: 2, name: 'Montagne', url: '/backgrounds/mountain.jpg', isDefault: false },
    { id: 3, name: 'Ville', url: '/backgrounds/city.jpg', isDefault: false },
  ]);

  const [systemStatus, setSystemStatus] = useState({
    vps: { status: 'checking', message: 'Vérification...', lastChecked: null },
    sms: { status: 'checking', message: 'Vérification...', lastChecked: null },
    database: { status: 'checking', message: 'Vérification...', lastChecked: null },
    diskSpace: { status: 'checking', message: 'Vérification...', lastChecked: null },
  });

  const [exportData, setExportData] = useState({
    dateRange: { start: null, end: null },
    exportType: 'all',
    status: 'pending', // 'pending', 'processing', 'completed', 'error'
    downloadUrl: null,
    stats: {
      totalPhotos: 0,
      pending: 0,
      sent: 0,
      failed: 0,
      lastExport: null,
    },
  });

  const statusIcons = {
    success: { icon: '✓', color: 'success.main' },
    error: { icon: '✗', color: 'error.main' },
    warning: { icon: '!', color: 'warning.main' },
    checking: { icon: '⟳', color: 'info.main' },
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSettingsChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    // TODO: Implémenter la sauvegarde des paramètres
    setTimeout(() => {
      setIsLoading(false);
      // Afficher un message de succès
    }, 1000);
  };

  const handleUploadBackground = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newBackground = {
          id: Date.now(),
          name: file.name.split('.')[0],
          url: e.target.result,
          isDefault: false
        };
        setBackgrounds([...backgrounds, newBackground]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteBackground = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce fond ?')) {
      setBackgrounds(backgrounds.filter(bg => bg.id !== id));
    }
  };

  const handleSetDefaultBackground = (id) => {
    setBackgrounds(backgrounds.map(bg => ({
      ...bg,
      isDefault: bg.id === id
    })));
  };

  const checkSystemStatus = async () => {
    // Simuler la vérification du statut
    const now = new Date().toLocaleTimeString();
    setSystemStatus({
      vps: { status: 'success', message: 'Connecté', lastChecked: now },
      sms: { status: 'success', message: 'Service SMS opérationnel', lastChecked: now },
      database: { status: 'warning', message: 'Latence élevée (250ms)', lastChecked: now },
      diskSpace: { status: 'error', message: 'Espace disque critique (85% utilisé)', lastChecked: now },
    });
  };

  useEffect(() => {
    checkSystemStatus();
    // Vérifier toutes les 5 minutes
    const interval = setInterval(checkSystemStatus, 5 * 60 * 1000);
    
    // Charger les statistiques
    loadExportStats();
    
    return () => clearInterval(interval);
  }, []);

  const loadExportStats = async () => {
    // Simuler le chargement des statistiques
    setTimeout(() => {
      setExportData(prev => ({
        ...prev,
        stats: {
          totalPhotos: 1245,
          pending: 12,
          sent: 1200,
          failed: 33,
          lastExport: '2023-05-15 14:30',
        }
      }));
    }, 1000);
  };

  const handleExportData = async () => {
    setExportData(prev => ({ ...prev, status: 'processing' }));
    
    // Simuler un export
    setTimeout(() => {
      // Créer un blob factice pour la démo
      const blob = new Blob(['Données d\'export simulées'], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      setExportData(prev => ({
        ...prev,
        status: 'completed',
        downloadUrl: url,
        stats: {
          ...prev.stats,
          lastExport: new Date().toISOString(),
        }
      }));
    }, 2000);
  };

  const handleDateRangeChange = (field, date) => {
    setExportData(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: date
      }
    }));
  };

  const handleExportTypeChange = (event) => {
    setExportData(prev => ({
      ...prev,
      exportType: event.target.value
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Tableau de bord d'administration
      </Typography>
      
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Configuration système" icon={<Settings />} />
        <Tab label="Fonds d'écran" icon={<Image />} />
        <Tab label="Monitoring" icon={<Visibility />} />
        <Tab label="Données" icon={<CloudDownload />} />
      </Tabs>

      {activeTab === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>Paramètres système</Typography>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>API OVH</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Clé API"
                  value={settings.ovh.apiKey}
                  onChange={(e) => handleSettingsChange('ovh', 'apiKey', e.target.value)}
                  margin="normal"
                  type="password"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Endpoint"
                  value={settings.ovh.endpoint}
                  onChange={(e) => handleSettingsChange('ovh', 'endpoint', e.target.value)}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </Paper>

          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveSettings}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Enregistrer les paramètres'}
          </Button>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>Gestion des fonds d'écran</Typography>
          
          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUpload />}
            sx={{ mb: 3 }}
          >
            Téléverser un fond
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleUploadBackground}
            />
          </Button>

          <Grid container spacing={2}>
            {backgrounds.map((bg) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={bg.id}>
                <Paper
                  sx={{
                    p: 2,
                    border: bg.isDefault ? '2px solid #1976d2' : '1px solid #e0e0e0',
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: 150,
                      backgroundImage: `url(${bg.url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      mb: 2,
                      borderRadius: 1
                    }}
                  />
                  <Typography variant="subtitle1" gutterBottom>
                    {bg.name} {bg.isDefault && '(Par défaut)'}
                  </Typography>
                  <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant={bg.isDefault ? 'contained' : 'outlined'}
                      onClick={() => handleSetDefaultBackground(bg.id)}
                      disabled={bg.isDefault}
                      fullWidth
                    >
                      {bg.isDefault ? 'Défaut' : 'Définir par défaut'}
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      onClick={() => handleDeleteBackground(bg.id)}
                      disabled={bg.isDefault}
                    >
                      <Delete />
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Monitoring système</Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={checkSystemStatus}
              disabled={Object.values(systemStatus).some(s => s.status === 'checking')}
            >
              Actualiser
            </Button>
          </Box>

          <Grid container spacing={3}>
            {Object.entries(systemStatus).map(([key, status]) => (
              <Grid item xs={12} sm={6} md={3} key={key}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: statusIcons[status.status]?.color || 'grey.500',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1,
                        fontWeight: 'bold',
                      }}
                    >
                      {statusIcons[status.status]?.icon || '?'}
                    </Box>
                    <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                      {key === 'diskSpace' ? 'Espace disque' : key.toUpperCase()}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {status.message}
                  </Typography>
                  {status.lastChecked && (
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                      Dernière vérification: {status.lastChecked}
                    </Typography>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Paper sx={{ mt: 4, p: 3 }}>
            <Typography variant="h6" gutterBottom>Tests système</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Message />}
                  onClick={() => {
                    // TODO: Implémenter le test SMS
                    alert('Test SMS envoyé !');
                  }}
                >
                  Tester l'envoi SMS
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Storage />}
                  onClick={() => {
                    // TODO: Implémenter le test de base de données
                    alert('Test de connexion à la base de données effectué !');
                  }}
                >
                  Tester la base de données
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  startIcon={<Delete />}
                  onClick={() => {
                    if (window.confirm('Vider la file d\'attente des photos en attente ?')) {
                      // TODO: Implémenter la suppression des fichiers en attente
                      alert('File d\'attente vidée avec succès !');
                    }
                  }}
                >
                  Vider la file d'attente
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      )}

      {activeTab === 3 && (
        <Box>
          <Typography variant="h6" gutterBottom>Export des données</Typography>
          
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Options d'export</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Type d'export"
                  value={exportData.exportType}
                  onChange={handleExportTypeChange}
                  SelectProps={{ native: true }}
                  variant="outlined"
                >
                  <option value="all">Toutes les photos</option>
                  <option value="pending">En attente d'envoi</option>
                  <option value="sent">Envoyées avec succès</option>
                  <option value="failed">Échecs d'envoi</option>
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Date de début"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={exportData.dateRange.start || ''}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Date de fin"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={exportData.dateRange.end || ''}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CloudDownload />}
                  onClick={handleExportData}
                  disabled={exportData.status === 'processing'}
                >
                  {exportData.status === 'processing' ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      Préparation de l'export...
                    </>
                  ) : 'Exporter les données'}
                </Button>
                
                {exportData.status === 'completed' && exportData.downloadUrl && (
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<CloudDownload />}
                    component="a"
                    href={exportData.downloadUrl}
                    download={`export-${new Date().toISOString().split('T')[0]}.csv`}
                    sx={{ ml: 2 }}
                  >
                    Télécharger l'export
                  </Button>
                )}
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Statistiques</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                  <Typography variant="h4">{exportData.stats.totalPhotos}</Typography>
                  <Typography variant="body2">Photos totales</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                  <Typography variant="h4">{exportData.stats.pending}</Typography>
                  <Typography variant="body2">En attente</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                  <Typography variant="h4">{exportData.stats.sent}</Typography>
                  <Typography variant="body2">Envoyées</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light', color: 'white' }}>
                  <Typography variant="h4">{exportData.stats.failed}</Typography>
                  <Typography variant="body2">Échecs</Typography>
                </Paper>
              </Grid>
            </Grid>
            
            {exportData.stats.lastExport && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Dernier export: {new Date(exportData.stats.lastExport).toLocaleString()}
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Actions de maintenance</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  startIcon={<Delete />}
                  onClick={() => {
                    if (window.confirm('Supprimer toutes les photos de plus de 30 jours ? Cette action est irréversible.')) {
                      // TODO: Implémenter la suppression des anciennes photos
                      alert('Nettoyage des anciennes photos effectué avec succès !');
                    }
                  }}
                >
                  Nettoyer les anciennes photos
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  startIcon={<Refresh />}
                  onClick={() => {
                    // TODO: Implémenter la réinitialisation des statistiques
                    alert('Statistiques réinitialisées avec succès !');
                  }}
                >
                  Réinitialiser les statistiques
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="outlined"
                  color="warning"
                  fullWidth
                  startIcon={<CloudDownload />}
                  onClick={() => {
                    // TODO: Implémenter la sauvegarde de la base de données
                    alert('Sauvegarde de la base de données lancée !');
                  }}
                >
                  Sauvegarder la base de données
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default Admin;
