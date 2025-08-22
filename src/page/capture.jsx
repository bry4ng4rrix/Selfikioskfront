import React, { useRef, useState, useEffect, useCallback } from 'react';
import { AiOutlineCamera } from "react-icons/ai";

const Capture = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [isCounting, setIsCounting] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [backgroundImages, setBackgroundImages] = useState({});
  const [isBackgroundEnabled, setIsBackgroundEnabled] = useState(false);
  const [apiBackgrounds, setApiBackgrounds] = useState([]);

  // Fonds prédéfinis par défaut
  const defaultBackgrounds = [
    { id: 'none', name: 'Aucun', url: null, type: 'default' }
  ];

  // Charger les fonds d'écran depuis l'API
  useEffect(() => {
    const fetchBackgrounds = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/backgrounds');
        if (response.ok) {
          const data = await response.json();
          console.log('Fonds d\'écran récupérés:', data);
          
          // Convertir l'objet en tableau et filtrer les éléments actifs
          const backgroundsArray = Object.values(data)
            .filter(bg => bg.is_active)
            .map(bg => ({
              id: bg.id,
              name: bg.name,
              url: `http://localhost:8000/${bg.file_path}`,
              type: 'api'
            }));
          
          setApiBackgrounds(backgroundsArray);
        } else {
          console.error('Erreur lors de la récupération des backgrounds');
        }
      } catch (error) {
        console.error('Erreur de connexion:', error);
      }
    };

    fetchBackgrounds();
  }, []);

  // Combiner tous les fonds d'écran
  const allBackgrounds = [...defaultBackgrounds, ...apiBackgrounds];

  // Précharger toutes les images de fond au démarrage
  useEffect(() => {
    const preloadImages = async () => {
      const imagePromises = allBackgrounds
        .filter(bg => bg.url)
        .map(bg => {
          return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve({ id: bg.id, url: bg.url, image: img });
            img.onerror = () => resolve({ id: bg.id, url: bg.url, image: null });
            img.src = bg.url;
          });
        });

      const loadedImages = await Promise.all(imagePromises);
      const imageMap = {};
      loadedImages.forEach(({ id, url, image }) => {
        if (image) imageMap[url] = image;
      });
      setBackgroundImages(imageMap);
    };

    if (allBackgrounds.length > 1) {
      preloadImages();
    }
  }, [allBackgrounds.length]);

  // Fonction pour traiter le fond en temps réel
  const processFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      if (animationRef.current) {
        animationRef.current = requestAnimationFrame(processFrame);
      }
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Vérifier si la vidéo est prête
    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      // S'assurer que le canvas a les bonnes dimensions
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      if (isBackgroundEnabled && selectedBackground && backgroundImages[selectedBackground]) {
        // Mode avec fond personnalisé
        const backgroundImg = backgroundImages[selectedBackground];
        
        // Dessiner le fond personnalisé
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

        // Créer un canvas temporaire pour traiter l'image de la vidéo
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        
        // Dessiner l'image de la vidéo
        tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
        
        // Obtenir les données d'image
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;

        // Algorithme simple de suppression de fond
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Détection simple des couleurs de fond à supprimer
          const isBackground = (
            (r > 200 && g > 200 && b > 200) || // Blanc
            (r < 50 && g < 50 && b < 50) || // Noir/très sombre
            (Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30 && r > 150) // Gris clair
          );

          if (isBackground) {
            data[i + 3] = 0; // Rendre transparent
          }
        }

        // Appliquer les modifications
        tempCtx.putImageData(imageData, 0, 0);
        
        // Dessiner l'image traitée sur le canvas principal
        ctx.drawImage(tempCanvas, 0, 0);
      } else {
        // Mode vidéo normale (copier la vidéo sur le canvas)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
    }

    // Continuer l'animation
    animationRef.current = requestAnimationFrame(processFrame);
  }, [isBackgroundEnabled, selectedBackground, backgroundImages]);

  useEffect(() => {
    // Démarrer la caméra au chargement du composant
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: "user"
          },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
        }
      } catch (err) {
        console.error("Erreur d'accès à la caméra:", err);
        setError("Impossible d'accéder à la caméra. Veuillez vérifier les autorisations.");
      }
    };

    startCamera();

    // Nettoyer le stream lors du démontage du composant
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Démarrer le traitement des frames quand la vidéo est prête
  useEffect(() => {
    if (videoRef.current) {
      const startProcessing = () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        animationRef.current = requestAnimationFrame(processFrame);
      };

      // Démarrer le traitement quand la vidéo commence à jouer
      videoRef.current.addEventListener('playing', startProcessing);
      
      // Si la vidéo joue déjà, démarrer immédiatement
      if (!videoRef.current.paused && !videoRef.current.ended) {
        startProcessing();
      }

      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('playing', startProcessing);
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [processFrame]);

  const startCountdown = (seconds) => {
    if (isCounting) return;
    
    setIsCounting(true);
    setCountdown(seconds);
    
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          takePhoto();
          setIsCounting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const takePhoto = () => {
    // Toujours utiliser le canvas qui affiche l'effet en cours
    if (canvasRef.current) {
      const photoUrl = canvasRef.current.toDataURL('image/jpeg');
      setPhoto(photoUrl);
    }
  };

  const capturePhoto = (seconds = 0) => {
    if (seconds > 0) {
      startCountdown(seconds);
    } else {
      takePhoto();
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
  };

  const selectBackground = (backgroundUrl) => {
    setSelectedBackground(backgroundUrl);
    
    if (backgroundUrl) {
      setIsBackgroundEnabled(true);
    } else {
      setIsBackgroundEnabled(false);
    }
  };

  const valider = async (e) => {
    console.log("Photo finale:", photo);
  };

  return (
    <div className='min-h-screen w-full bg-gray-100 flex'>
      {/* Sidebar pour les fonds d'écran */}
      <div className='w-80 bg-white shadow-lg flex flex-col'>
        {/* Header sidebar */}
        <div className='p-4 border-b border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-800 mb-2'>Fonds d'écran</h2>
          <p className='text-sm text-gray-600'>Choisissez un arrière-plan pour votre selfie</p>
        </div>

        {/* Liste des fonds d'écran */}
        <div className='flex-1 overflow-y-auto p-4'>
          <div className='space-y-3'>
            {allBackgrounds.map((bg) => (
              <button
                key={bg.id}
                onClick={() => selectBackground(bg.url)}
                className={`w-full relative overflow-hidden rounded-lg border-2 transition-all hover:scale-102 ${
                  selectedBackground === bg.url ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                {bg.url ? (
                  <>
                    <div className='aspect-video w-full'>
                      <img 
                        src={bg.url} 
                        alt={bg.name}
                        className='w-full h-full object-cover'
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      {/* Fallback en cas d'erreur */}
                      <div className='w-full h-full bg-gray-300 hidden items-center justify-center'>
                        <span className='text-gray-500 text-sm'>Image non disponible</span>
                      </div>
                    </div>
                    {!backgroundImages[bg.url] && (
                      <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
                        <div className='w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className='aspect-video w-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center'>
                    <span className='text-white font-medium'>Pas de fond</span>
                  </div>
                )}
                
                {/* Nom du fond */}
                <div className='p-3 text-left'>
                  <p className='font-medium text-gray-800 truncate'>{bg.name}</p>
                  {bg.type === 'api' && (
                    <span className='inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'>
                      Personnalisé
                    </span>
                  )}
                </div>

                {/* Indicateur de sélection */}
                {selectedBackground === bg.url && (
                  <div className='absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center'>
                    <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {/* Message si pas de fonds personnalisés */}
          {apiBackgrounds.length === 0 && (
            <div className='mt-6 p-4 bg-gray-50 rounded-lg text-center'>
              <p className='text-sm text-gray-500'>Aucun fond personnalisé disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* Zone principale */}
      <div className='flex-1 flex flex-col'>
        {/* Header principal */}
        <div className='bg-white shadow-sm p-4 border-b border-gray-200'>
          <div className='flex justify-between items-center'>
            <h1 className='text-2xl font-bold text-gray-800'>Capture de Selfie</h1>
            <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Retour
            </a>
          </div>
        </div>

        {/* Contenu principal */}
        <div className='flex-1 p-6'>
          {error ? (
            <div className='h-full flex items-center justify-center'>
              <div className='text-center p-8 bg-red-50 rounded-lg border border-red-200'>
                <p className='text-red-800 font-medium'>{error}</p>
              </div>
            </div>
          ) : photo ? (
            <div className='h-full flex flex-col items-center justify-center'>
              <div className='bg-white p-4 rounded-lg shadow-lg max-w-4xl w-full'>
                <img 
                  src={photo} 
                  alt="Captured" 
                  className='w-full max-h-96 object-contain rounded-lg'
                />
                <div className='mt-6 flex gap-4 justify-center'>
                  <button
                    onClick={retakePhoto}
                    className='bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg transition-colors'
                  >
                    Reprendre
                  </button>
                  <button
                    onClick={valider}
                    className='bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors'
                  >
                    Valider
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className='h-full flex flex-col'>
              {/* Zone de prévisualisation vidéo */}
              <div className='flex-1 bg-gray-900 rounded-lg overflow-hidden relative flex items-center justify-center'>
                {/* Vidéo cachée */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className='hidden'
                />
                
                {/* Canvas de rendu */}
                <canvas
                  ref={canvasRef}
                  className='max-h-full max-w-full object-contain'
                />

                {/* Overlay de compteur */}
                {isCounting && (
                  <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20'>
                    <div className='text-white text-8xl font-bold animate-pulse'>
                      {countdown}
                    </div>
                  </div>
                )}
              </div>

              {/* Contrôles de capture */}
              <div className='mt-6 flex flex-col items-center gap-6'>
                {/* Bouton principal de capture */}
                <button
                  onClick={() => capturePhoto(0)}
                  className='bg-white rounded-full p-6 shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50'
                  aria-label="Prendre une photo instantanée"
                  disabled={isCounting}
                >
                  <AiOutlineCamera className='text-4xl text-gray-700' />
                </button>

                {/* Boutons de temporisation */}
                <div className='flex gap-4'>
                  {[3, 5, 10].map((seconds) => (
                    <button
                      key={seconds}
                      onClick={() => capturePhoto(seconds)}
                      className='bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50'
                      disabled={isCounting}
                    >
                      {seconds}s
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Capture;