import React, { useRef, useState, useEffect, useCallback } from 'react';
import { AiOutlineCamera } from "react-icons/ai";
import { Link, Navigate, useNavigate } from 'react-router';

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

  const navigate = useNavigate();

  // Fonds personnalisés prédéfinis
  const backgrounds = [
    { id: 1, name: 'Aucun', url: null },
    { id: 2, name: 'Plage', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop' },
    { id: 3, name: 'Montagne', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop' },
    { id: 4, name: 'Ville', url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1920&h=1080&fit=crop' },
    { id: 5, name: 'Forêt', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop' },
    { id: 6, name: 'Espace', url: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=1920&h=1080&fit=crop' },
  ];

  // Précharger toutes les images de fond au démarrage
  useEffect(() => {
    const preloadImages = async () => {
      const imagePromises = backgrounds
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

    preloadImages();
  }, []);

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
    <div className='h-screen w-full flex justify-center items-center'>
      <div className='bg-white w-3/4 h-4/5 flex-col justify-between flex p-5 rounded-xl shadow-lg'>
        <div className="flex justify-between items-center">
          <p className='text-2xl font-bold'>Capture de Selfie</p>
          <Link to="/" className="bg-blue-600 hover:bg-blue-900 p-2 outline text-white px-3 rounded-lg flex items-center gap-2">Retour</Link>
        </div>
        
        <div className='relative bg-gray-500 p-5 h-full my-3 rounded-lg overflow-hidden'>
          {error ? (
            <div className='text-white text-center p-4'>
              <p>{error}</p>
            </div>
          ) : photo ? (
            <div className='h-full flex flex-col items-center justify-center'>
              <img 
                src={photo} 
                alt="Captured" 
                className='max-h-full w-full rounded-lg object-contain'
              />
              <div className='mt-4 flex gap-4'>
                <button
                  onClick={retakePhoto}
                  className='bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded'
                >
                  Reprendre
                </button>
                <button
                  onClick={valider}
                  className='bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded'
                >
                  Valider
                </button>
              </div>
            </div>
          ) : (
            <div className='h-full w-full flex flex-col items-center justify-between'>
             

              {/* Zone vidéo */}
              <div className='w-full h-full flex items-center justify-center overflow-hidden relative'>
                {/* Vidéo originale (toujours cachée maintenant) */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className='hidden'
                />
                
                {/* Canvas qui affiche toujours le résultat */}
                <canvas
                  ref={canvasRef}
                  className='h-full w-auto max-w-full object-cover lg:object-contain rounded-lg'
                />

                {/* Compteur */}
                {isCounting && (
                  <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10'>
                    <div className='text-white text-9xl font-bold'>{countdown}</div>
                  </div>
                )}
              </div>

              {/* Contrôles de capture */}
              <div className='w-full flex flex-col items-center gap-4 pb-4'>
                <button
                  onClick={() => capturePhoto(0)}
                  className='bg-white rounded-full p-4 m-1 shadow-lg hover:bg-gray-200 transition-colors'
                  aria-label="Prendre une photo"
                  disabled={isCounting}
                >
                  <AiOutlineCamera className='text-2xl' />
                </button>







 {/* Sélection des fonds en haut */}
 <div className='w-full mb-4'>
                <div className='flex gap-2 justify-center flex-wrap'>
                  {backgrounds.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => selectBackground(bg.url)}
                      className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                        selectedBackground === bg.url ? 'border-blue-400 scale-105' : 'border-white hover:border-gray-300'
                      }`}
                    >
                      {bg.url ? (
                        <>
                          <img 
                            src={bg.url} 
                            alt={bg.name}
                            className='w-16 h-12 object-cover'
                          />
                          {!backgroundImages[bg.url] && (
                            <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
                              <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className='w-16 h-12 bg-gray-600 flex items-center justify-center'>
                          <span className='text-white text-xs'>Original</span>
                        </div>
                      )}
                      <div className='absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center'>
                        {bg.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>










                <div className='flex gap-2'>
                  <button
                    onClick={() => capturePhoto(3)}
                    className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
                    disabled={isCounting}
                  >
                    3s
                  </button>
                  <button
                    onClick={() => capturePhoto(5)}
                    className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
                    disabled={isCounting}
                  >
                    5s
                  </button>
                  <button
                    onClick={() => capturePhoto(10)}
                    className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
                    disabled={isCounting}
                  >
                    10s
                  </button>
                  
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