import {React ,useState ,useEffect ,useRef} from 'react';
import { Upload, Plus, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const [wallpapers, setWallpapers] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, wallpaper: null });
  const fileInputRef = useRef(null);

  // Récupérer les backgrounds au chargement
  useEffect(() => {
    fetchBackgrounds();
  }, []);

  const fetchBackgrounds = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/api/backgrounds');
      if (response.ok) {
        const data = await response.json();
        console.log('Données brutes récupérées:', data); // Debug
        
        // Convertir l'objet en tableau et filtrer les éléments actifs
        const wallpapersArray = Object.values(data).filter(wallpaper => wallpaper.is_active);
        console.log('Fonds d\'écran actifs:', wallpapersArray); // Debug
        
        setWallpapers(wallpapersArray);
      } else {
        console.error('Erreur lors de la récupération des backgrounds');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    for (let file of files) {
      if (file.type.startsWith('image/')) {
        await uploadBackground(file);
      }
    }
  };

  const uploadBackground = async (file) => {
    const tempId = Date.now() + Math.random();
    
    // Ajouter un indicateur de progression temporaire
    setUploadProgress(prev => ({
      ...prev,
      [tempId]: { name: file.name, uploading: true }
    }));

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token d\'authentification manquant');
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[tempId];
          return updated;
        });
        return;
      }

      const formData = new FormData();
      formData.append('name', file.name.split('.')[0]);
      formData.append('display_order', wallpapers.length + 1);
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/admin/backgrounds', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const newBackground = await response.json();
        console.log('Nouveau background:', newBackground); // Debug
        
        // Ajouter le nouveau background à la liste
        setWallpapers(prev => [...prev, newBackground]);
        
        // Retirer l'indicateur de progression
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[tempId];
          return updated;
        });
      } else if (response.status === 401) {
        console.error('Token d\'authentification invalide ou expiré');
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[tempId];
          return updated;
        });
      } else {
        console.error('Erreur lors de l\'upload du background');
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[tempId];
          return updated;
        });
      }
    } catch (error) {
      console.error('Erreur de connexion lors de l\'upload:', error);
      setUploadProgress(prev => {
        const updated = { ...prev };
        delete updated[tempId];
        return updated;
      });
    }
  };

  const deleteBackground = async (backgroundId) => {
    console.log('Tentative de suppression:', backgroundId); // Debug
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token d\'authentification manquant');
        alert('Token d\'authentification manquant');
        return;
      }

      console.log('Envoi de la requête DELETE...'); // Debug
      
      const response = await fetch(`http://localhost:8000/admin/backgrounds/${backgroundId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Réponse reçue:', response.status); // Debug

      if (response.ok) {
        console.log('Suppression réussie'); // Debug
        // Retirer le background de la liste
        setWallpapers(prev => {
          const updated = prev.filter(wallpaper => wallpaper.id !== backgroundId);
          console.log('Liste mise à jour:', updated); // Debug
          return updated;
        });
        // Fermer le modal
        setDeleteModal({ isOpen: false, wallpaper: null });
      } else if (response.status === 401) {
        console.error('Token d\'authentification invalide ou expiré');
        alert('Erreur d\'authentification');
      } else {
        console.error('Erreur lors de la suppression du background, status:', response.status);
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
  const openDeleteModal = (wallpaper) => {
    setDeleteModal({ isOpen: true, wallpaper });
  };

  // Fonction pour fermer le modal
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, wallpaper: null });
  };

  // Fonction pour confirmer la suppression
  const confirmDelete = () => {
    if (deleteModal.wallpaper) {
      deleteBackground(deleteModal.wallpaper.id);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Fonction pour construire l'URL de l'image
  const getImageUrl = (wallpaper) => {
    // Priorité au file_path (nouveau format)
    if (wallpaper.file_path) {
      // Construire l'URL complète avec le serveur
      return `http://localhost:8000/${wallpaper.file_path}`;
    }
    
    // Fallback vers les autres propriétés possibles
    if (wallpaper.file_url) {
      if (wallpaper.file_url.startsWith('/')) {
        return `http://localhost:8000${wallpaper.file_url}`;
      }
      return wallpaper.file_url;
    }
    
    if (wallpaper.image) {
      return wallpaper.image;
    }
    
    if (wallpaper.url) {
      if (wallpaper.url.startsWith('/')) {
        return `http://localhost:8000${wallpaper.url}`;
      }
      return wallpaper.url;
    }
    
    if (wallpaper.path) {
      if (wallpaper.path.startsWith('/')) {
        return `http://localhost:8000${wallpaper.path}`;
      }
      return wallpaper.path;
    }
    
    // Si aucune URL trouvée, retourner null
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="bg-gray-50 border border-dashed border-gray-700 rounded-lg p-1 mb-6 grid grid-cols-4 gap-2 items-center justify-center">
          <a href="/admin" className="bg-white h-10 rounded-lg hover:bg-blue-200 justify-center items-center flex">Vue ensemble</a>
          <a href="/admin/fonds" className="bg-blue-300 h-10 rounded-lg hover:bg-blue-500 justify-center items-center flex">Fonds</a>
          <a href="/admin/capture" className="bg-white h-10 rounded-lg hover:bg-blue-200 justify-center items-center flex">Capture</a>
          <a href="/admin/config" className="bg-white h-10 rounded-lg hover:bg-blue-200 justify-center items-center flex">Configuration</a>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des fonds d'écran</h1>
         
        </div>

        {/* Drag and Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 mb-8 text-center transition-all ${
            isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
          <p className={`text-lg font-medium mb-2 ${isDragOver ? 'text-blue-700' : 'text-gray-700'}`}>
            {isDragOver ? 'Déposez vos images ici' : 'Glissez-déposez vos images ici'}
          </p>
          <p className="text-gray-500 text-sm">
            ou cliquez pour sélectionner des fichiers
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Formats supportés: JPG, PNG, GIF, WebP
          </p>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Chargement des fonds d'écran...</p>
          </div>
        )}

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload en cours...</h3>
            {Object.values(uploadProgress).map((progress, index) => (
              <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-blue-800">{progress.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Debug Info */}
        {wallpapers.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              Debug: {wallpapers.length} fond(s) d'écran trouvé(s)
            </p>
          </div>
        )}

        {/* Wallpapers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wallpapers.map((wallpaper) => {
            const imageUrl = getImageUrl(wallpaper);
            console.log(`Wallpaper ${wallpaper.id}:`, wallpaper, 'Image URL:', imageUrl); // Debug
            
            return (
              <div key={wallpaper.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Image Preview */}
                <div className="aspect-video bg-gray-200 flex items-center justify-center relative overflow-hidden group">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={wallpaper.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Erreur de chargement image:', imageUrl);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                      onLoad={() => {
                        console.log('Image chargée avec succès:', imageUrl);
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback si pas d'image */}
                  <div 
                    className={`text-center ${imageUrl ? 'hidden' : 'flex'} flex-col items-center justify-center h-full`}
                    style={{ display: imageUrl ? 'none' : 'flex' }}
                  >
                    <div className="w-12 h-12 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-gray-500" />
                    </div>
                    <span className="text-gray-500 text-sm">{wallpaper.name}</span>
                    <span className="text-gray-400 text-xs mt-1">Pas d'image</span>
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    onClick={() => openDeleteModal(wallpaper)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                 
                 
                </div>
                
                {/* Wallpaper Info */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-1">{wallpaper.name}</h3>
                  <div className="flex justify-between items-center mb-2">
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {wallpaper.category || 'custom'}
                    </span>
                    {wallpaper.display_order && (
                      <span className="text-xs text-gray-400">#{wallpaper.display_order}</span>
                    )}
                  </div>
                  
                  {/* Date de création */}
                  {wallpaper.created_at && (
                    <div className="text-xs text-gray-400 mb-1">
                      Créé le: {new Date(wallpaper.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                  
                  {/* Debug info pour chaque wallpaper */}
                  <div className="mt-2 text-xs text-gray-400">
                    URL: {imageUrl || 'Non définie'}
                  </div>
                  <div className="text-xs text-gray-400">
                    ID: {wallpaper.id}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State when no wallpapers */}
        {!isLoading && wallpapers.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun fond d'écran</h3>
            <p className="text-gray-500 mb-4">Ajoutez vos premiers fonds d'écran en les glissant-déposant ici</p>
            <button
              onClick={openFileDialog}
              className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Ajouter un fond d'écran
            </button>
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
                {deleteModal.wallpaper && (
                  <>
                    <p className="text-gray-600 mb-3">
                      Êtes-vous sûr de vouloir supprimer ce fond d'écran ?
                    </p>
                    
                    {/* Aperçu de l'image à supprimer */}
                    <div className="bg-gray-100 rounded-lg p-3 mb-3">
                      <div className="flex items-center space-x-3">
                        {getImageUrl(deleteModal.wallpaper) && (
                          <img
                            src={getImageUrl(deleteModal.wallpaper)}
                            alt={deleteModal.wallpaper.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {deleteModal.wallpaper.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Ordre: #{deleteModal.wallpaper.display_order}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800 text-sm">
                        ⚠️ Cette action est irréversible. Le fond d'écran sera définitivement supprimé.
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