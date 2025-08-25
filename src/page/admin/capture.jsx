import {React ,useState ,useEffect ,useRef} from 'react';
import { Trash2, Eye, Camera, Calendar, Phone, Mail, Download } from 'lucide-react';

export default function Dashboard() {
  const [captures, setCaptures] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, capture: null });

  // Récupérer les captures au chargement
  useEffect(() => {
    fetchCaptures();
  }, []);

  const fetchCaptures = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token d\'authentification manquant');
        alert('Token d\'authentification manquant');
        return;
      }

      const response = await fetch('https://selfikiosk.duckdns.org/api/admin/captures', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Captures récupérées:', data);
        
        // Convertir l'objet en tableau si nécessaire
        const capturesArray = Array.isArray(data) ? data : Object.values(data);
        
        // Trier par date de création (plus récent en premier)
        capturesArray.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        setCaptures(capturesArray);
      } else if (response.status === 401) {
        console.error('Token d\'authentification invalide ou expiré');
        alert('Erreur d\'authentification. Veuillez vous reconnecter.');
      } else {
        console.error('Erreur lors de la récupération des captures');
        alert('Erreur lors de la récupération des captures');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      alert('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCapture = async (captureId) => {
    console.log('Tentative de suppression:', captureId);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token d\'authentification manquant');
        alert('Token d\'authentification manquant');
        return;
      }

      console.log('Envoi de la requête DELETE...');
      
      const response = await fetch(`https://selfikiosk.duckdns.org/api/admin/captures/${captureId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Réponse reçue:', response.status);

      if (response.ok) {
        console.log('Suppression réussie');
        // Retirer la capture de la liste
        setCaptures(prev => {
          const updated = prev.filter(capture => capture.id !== captureId);
          console.log('Liste mise à jour:', updated);
          return updated;
        });
        // Fermer le modal
        setDeleteModal({ isOpen: false, capture: null });
      } else if (response.status === 401) {
        console.error('Token d\'authentification invalide ou expiré');
        alert('Erreur d\'authentification');
      } else {
        console.error('Erreur lors de la suppression de la capture, status:', response.status);
        const errorText = await response.text();
        console.error('Détails de l\'erreur:', errorText);
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur de connexion lors de la suppression:', error);
      alert('Erreur de connexion');
    }
  };

  // Fonction pour ouvrir le modal de confirmation
  const openDeleteModal = (capture) => {
    setDeleteModal({ isOpen: true, capture });
  };

  // Fonction pour fermer le modal
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, capture: null });
  };

  // Fonction pour confirmer la suppression
  const confirmDelete = () => {
    if (deleteModal.capture) {
      deleteCapture(deleteModal.capture.id);
    }
  };

  // Fonction pour construire l'URL de l'image
  const getImageUrl = (capture) => {
    // Le backend génère photo_remote_url comme "/uploads/{capture_id}.jpg"
    if (capture.photo_remote_url) {
      if (capture.photo_remote_url.startsWith('/uploads/')) {
        return `http://localhost:8000${capture.photo_remote_url}`;
      }
      if (capture.photo_remote_url.startsWith('/')) {
        return `http://localhost:8000${capture.photo_remote_url}`;
      }
      return capture.photo_remote_url;
    }
    
    // Fallback vers photo_local_path
    if (capture.photo_local_path) {
      // Si le chemin complet /var/www/html/uploads/filename.jpg
      if (capture.photo_local_path.includes('/var/www/html/uploads/')) {
        const filename = capture.photo_local_path.split('/').pop();
        return `http://localhost:8000/uploads/${filename}`;
      }
      // Si c'est déjà un chemin relatif
      if (!capture.photo_local_path.startsWith('/')) {
        return `http://localhost:8000/uploads/${capture.photo_local_path}`;
      }
    }
    
    return null;
  };

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fonction pour télécharger l'image avec authentification
  const downloadImage = (capture) => {
    const imageUrl = getImageUrl(capture);
    if (imageUrl) {
      // Créer un lien de téléchargement avec token si nécessaire
      const token = localStorage.getItem('token');
      
      if (token && imageUrl.includes('localhost:8000')) {
        // Pour les images du serveur local, ajouter le token dans les headers via fetch
        fetch(imageUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        .then(response => response.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `capture_${capture.id}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        })
        .catch(error => {
          console.error('Erreur lors du téléchargement:', error);
          alert('Erreur lors du téléchargement de l\'image');
        });
      } else {
        // Pour les autres images, téléchargement direct
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `capture_${capture.id}.jpg`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="bg-gray-50 border border-dashed border-gray-700 rounded-lg p-1 mb-6 grid grid-cols-4 gap-2 items-center justify-center">
          <a href="/admin" className="bg-white h-10 rounded-lg hover:bg-blue-200 justify-center items-center flex">Vue ensemble</a>
          <a href="/admin/fonds" className="bg-white h-10 rounded-lg hover:bg-blue-200 justify-center items-center flex">Fonds</a>
          <a href="/admin/capture" className="bg-blue-300 h-10 rounded-lg hover:bg-blue-500 justify-center items-center flex">Captures</a>
          <a href="/admin/config" className="bg-white h-10 rounded-lg hover:bg-blue-200 justify-center items-center flex">Configuration</a>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des captures</h1>
            <p className="text-gray-600 mt-1">Consultez et gérez toutes les photos prises</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchCaptures}
              disabled={isLoading}
              className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <Camera className="w-4 h-4 mr-2" />
              {isLoading ? 'Chargement...' : 'Actualiser'}
            </button>
           
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Chargement des captures...</p>
          </div>
        )}

        {/* Stats Summary */}
        {!isLoading && captures.length > 0 && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center">
                <Camera className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{captures.length}</p>
                  <p className="text-gray-600 text-sm">Captures totales</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center">
                <Phone className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {captures.filter(c => c.phone).length}
                  </p>
                  <p className="text-gray-600 text-sm">Avec téléphone</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center">
                <Mail className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {captures.filter(c => c.email).length}
                  </p>
                  <p className="text-gray-600 text-sm">Avec email</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Captures Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {captures.map((capture) => {
            const imageUrl = getImageUrl(capture);
            
            return (
              <div key={capture.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Image Preview */}
                <div className="aspect-square bg-gray-200 flex items-center justify-center relative overflow-hidden group">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`Capture ${capture.id}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Erreur de chargement image:', imageUrl);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback si pas d'image */}
                  <div 
                    className={`text-center ${imageUrl ? 'hidden' : 'flex'} flex-col items-center justify-center h-full`}
                    style={{ display: imageUrl ? 'none' : 'flex' }}
                  >
                    <div className="w-12 h-12 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-gray-500" />
                    </div>
                    <span className="text-gray-500 text-sm">Capture</span>
                    <span className="text-gray-400 text-xs mt-1">Image indisponible</span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Download Button */}
                    <button
                      onClick={() => downloadImage(capture)}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full"
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => openDeleteModal(capture)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Sync Status */}
                  <div className="absolute bottom-2 left-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      capture.is_synced 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {capture.is_synced ? '✓ Sync' : '⏳ En attente'}
                    </span>
                  </div>
                </div>
                
                {/* Capture Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm">Capture #{capture.id.slice(-8)}</h3>
                    <span className="text-xs text-gray-400 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(capture.created_at)}
                    </span>
                  </div>
                  
                  {/* Contact Info */}
                  <div className="space-y-1 mb-3">
                    {capture.phone && (
                      <div className="flex items-center text-xs text-gray-600">
                        <Phone className="w-3 h-3 mr-2 text-green-600" />
                        <span className="truncate">{capture.phone}</span>
                      </div>
                    )}
                    {capture.email && (
                      <div className="flex items-center text-xs text-gray-600">
                        <Mail className="w-3 h-3 mr-2 text-blue-600" />
                        <span className="truncate">{capture.email}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Metadata */}
                  <div className="space-y-1 text-xs text-gray-400">
                    <div>Background ID: {capture.background_id || 'Aucun'}</div>
                    <div>Tentatives sync: {capture.sync_attempts}</div>
                    <div title={capture.photo_local_path}>Path: {capture.photo_local_path ? capture.photo_local_path.split('/').pop() : 'N/A'}</div>
                    <div>URL: {getImageUrl(capture) ? '✓' : '❌'}</div>
                  </div>
                  
                  {/* Actions */}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => downloadImage(capture)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Télécharger
                    </button>
                    <button
                      onClick={() => openDeleteModal(capture)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State when no captures */}
        {!isLoading && captures.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Camera className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune capture</h3>
            <p className="text-gray-500 mb-4">Les captures de selfies apparaîtront ici une fois prises</p>
            <a
              href="/capture"
              className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center"
            >
              <Camera className="w-4 h-4 mr-2" />
              Prendre un selfie
            </a>
          </div>
        )}

        {/* Modal de confirmation de suppression */}
        {deleteModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              {/* En-tête du modal */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirmer la suppression
                </h3>
                <button
                  onClick={closeDeleteModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Corps du modal */}
              <div className="mb-6">
                {deleteModal.capture && (
                  <>
                    <p className="text-gray-600 mb-3">
                      Êtes-vous sûr de vouloir supprimer cette capture ?
                    </p>
                    
                    {/* Aperçu de la capture à supprimer */}
                    <div className="bg-gray-100 rounded-lg p-3 mb-3">
                      <div className="flex items-center space-x-3">
                        {getImageUrl(deleteModal.capture) && (
                          <img
                            src={getImageUrl(deleteModal.capture)}
                            alt={`Capture ${deleteModal.capture.id}`}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            Capture #{deleteModal.capture.id.slice(-8)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(deleteModal.capture.created_at)}
                          </p>
                          {deleteModal.capture.phone && (
                            <p className="text-xs text-gray-600 flex items-center mt-1">
                              <Phone className="w-3 h-3 mr-1" />
                              {deleteModal.capture.phone}
                            </p>
                          )}
                          {deleteModal.capture.email && (
                            <p className="text-xs text-gray-600 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {deleteModal.capture.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800 text-sm">
                        ⚠️ Cette action est irréversible. La capture sera définitivement supprimée du serveur.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Fonction supprimée car elle est maintenant définie dans le composant