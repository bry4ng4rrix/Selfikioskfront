import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera } from "lucide-react";

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
  const [showGuides, setShowGuides] = useState(true);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [formData, setFormData] = useState({ phone: '', email: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Dimensions standards pour le canvas
  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 800;

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

  // Fonction pour traiter le fond en temps réel avec détection améliorée
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
      // Définir des dimensions fixes pour le canvas
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;

      if (isBackgroundEnabled && selectedBackground && backgroundImages[selectedBackground]) {
        // Mode avec fond personnalisé
        const backgroundImg = backgroundImages[selectedBackground];
        
        // Dessiner le fond personnalisé redimensionné pour correspondre au canvas
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

        // Créer un canvas temporaire pour traiter l'image de la vidéo
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        
        // Calculer le ratio pour adapter la vidéo au canvas en gardant les proportions
        const videoRatio = video.videoWidth / video.videoHeight;
        const canvasRatio = canvas.width / canvas.height;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (videoRatio > canvasRatio) {
          // Vidéo plus large : ajuster sur la hauteur
          drawHeight = canvas.height;
          drawWidth = drawHeight * videoRatio;
          offsetX = (canvas.width - drawWidth) / 2;
          offsetY = 0;
        } else {
          // Vidéo plus haute : ajuster sur la largeur
          drawWidth = canvas.width;
          drawHeight = drawWidth / videoRatio;
          offsetX = 0;
          offsetY = (canvas.height - drawHeight) / 2;
        }
        
        // Dessiner l'image de la vidéo redimensionnée et centrée
        tempCtx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
        
        // Obtenir les données d'image
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;

        // Algorithme de suppression de fond amélioré
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Calculer la position du pixel
          const pixelIndex = Math.floor(i / 4);
          const x = pixelIndex % canvas.width;
          const y = Math.floor(pixelIndex / canvas.width);
          
          // Zones de bords plus agressives
          const isEdgeZone = (
            x < canvas.width * 0.1 ||
            x > canvas.width * 0.9 ||
            y < canvas.height * 0.1 ||
            y > canvas.height * 0.9
          );
          
          // Détection de couleur de fond améliorée
          let isBackground = false;
          
          if (isEdgeZone) {
            // Zones de bords - détection plus agressive
            isBackground = (
              (r > 180 && g > 180 && b > 180) || // Blanc/gris clair
              (r < 60 && g < 60 && b < 60) || // Noir/très sombre
              (Math.abs(r - g) < 40 && Math.abs(g - b) < 40 && Math.abs(r - b) < 40) // Couleurs uniformes
            );
          } else {
            // Zones normales - détection standard
            isBackground = (
              (r > 200 && g > 200 && b > 200) || // Blanc
              (r < 40 && g < 40 && b < 40) || // Noir/très sombre
              (Math.abs(r - g) < 25 && Math.abs(g - b) < 25 && Math.abs(r - b) < 25 && r > 160) || // Gris clair
              // Détection de vert (green screen)
              (g > r + 50 && g > b + 50 && g > 100) ||
              // Détection de bleu (blue screen)
              (b > r + 50 && b > g + 50 && b > 100)
            );
          }

          if (isBackground) {
            data[i + 3] = 0; // Rendre transparent
          }
        }

        // Appliquer les modifications
        tempCtx.putImageData(imageData, 0, 0);
        
        // Dessiner l'image traitée sur le canvas principal
        ctx.drawImage(tempCanvas, 0, 0);
      } else {
        // Mode vidéo normale - adapter la vidéo au canvas
        const videoRatio = video.videoWidth / video.videoHeight;
        const canvasRatio = canvas.width / canvas.height;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (videoRatio > canvasRatio) {
          // Vidéo plus large : ajuster sur la hauteur
          drawHeight = canvas.height;
          drawWidth = drawHeight * videoRatio;
          offsetX = (canvas.width - drawWidth) / 2;
          offsetY = 0;
        } else {
          // Vidéo plus haute : ajuster sur la largeur
          drawWidth = canvas.width;
          drawHeight = drawWidth / videoRatio;
          offsetX = 0;
          offsetY = (canvas.height - drawHeight) / 2;
        }
        
        // Remplir d'abord le canvas en noir pour les zones non couvertes
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dessiner la vidéo redimensionnée et centrée
        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
      }
      
      // Dessiner les guides visuels par-dessus
      if (showGuides) {
        drawGuides(ctx, canvas.width, canvas.height);
      }
    }

    // Continuer l'animation
    animationRef.current = requestAnimationFrame(processFrame);
  }, [isBackgroundEnabled, selectedBackground, backgroundImages, showGuides]);

  // Fonction pour dessiner les guides visuels
  const drawGuides = (ctx, width, height) => {
    ctx.save();
    
    // Guide de positionnement du visage (ovale central parfaitement centré)
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = width * 0.12; // Réduire légèrement pour un meilleur centrage visuel
    const radiusY = height * 0.18;
    
    // Ovale pour le visage - parfaitement centré
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.setLineDash([15, 10]);
    ctx.stroke();
    
    // Grille de règle des tiers (subtile)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 12]);
    
    // Lignes verticales
    ctx.beginPath();
    ctx.moveTo(width / 3, 0);
    ctx.lineTo(width / 3, height);
    ctx.moveTo(2 * width / 3, 0);
    ctx.lineTo(2 * width / 3, height);
    ctx.stroke();
    
    // Lignes horizontales
    ctx.beginPath();
    ctx.moveTo(0, height / 3);
    ctx.lineTo(width, height / 3);
    ctx.moveTo(0, 2 * height / 3);
    ctx.lineTo(width, 2 * height / 3);
    ctx.stroke();
    
    // Instructions de positionnement
    if (!isCounting) {
      // Texte principal - centré
      ctx.font = `${Math.max(16, width * 0.025)}px Arial, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(centerX, centerY + radiusY + 40);
      
      // Point central de référence
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    ctx.restore();
  };

  useEffect(() => {
    // Démarrer la caméra au chargement du composant
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
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
    if (videoRef.current && stream) {
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
  }, [processFrame, stream]);

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
      const photoUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
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
    console.log("Ouverture du modal de validation");
    // Générer un QR code avec un lien vers la photo (simulé pour l'exemple)
    const qrData = `https://selfie.example.com/photo/${Date.now()}`;
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`);
    setShowValidationModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.phone && !formData.email) {
      alert('Veuillez renseigner au moins un numéro de téléphone ou un email');
      return;
    }

    setIsSaving(true);
    
    try {
      // Trouver l'ID du background sélectionné
      let backgroundId = null;
      if (selectedBackground) {
        const selectedBg = allBackgrounds.find(bg => bg.url === selectedBackground);
        backgroundId = selectedBg ? selectedBg.id : null;
      }

      // Préparer les données à envoyer
      const captureData = {
        photo_base64: photo.split(',')[1], // Enlever le préfixe data:image/jpeg;base64,
        phone: formData.phone || '',
        email: formData.email || '',
        background_id: backgroundId || ''
      };

      console.log('Envoi des données:', { ...captureData, photo_base64: 'base64_truncated...' });

      // 1. Sauvegarder la capture
      const response = await fetch('http://localhost:8000/api/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(captureData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Sauvegarde réussie:', result);
        
        // 2. Envoyer le SMS si un numéro de téléphone est fourni
        if (formData.phone && result.id) {
          console.log('Envoi du SMS...');
          
          try {
            const smsResponse = await fetch('http://localhost:8000/api/send-sms', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                capture_id: result.id,
                phone: formData.phone
              }),
            });

            if (smsResponse.ok) {
              const smsResult = await smsResponse.json();
              console.log('SMS envoyé avec succès:', smsResult);
            } else {
              const smsError = await smsResponse.text();
              console.error('Erreur envoi SMS:', smsResponse.status, smsError);
              // On continue même si le SMS échoue
            }
          } catch (smsError) {
            console.error('Erreur de connexion SMS:', smsError);
            // On continue même si le SMS échoue
          }
        }
        
        setSaveSuccess(true);
        
        // Fermer le modal après 2 secondes et réinitialiser
        setTimeout(() => {
          setShowValidationModal(false);
          setFormData({ phone: '', email: '' });
          setPhoto(null);
          setSaveSuccess(false);
        }, 2000);
      } else {
        const errorText = await response.text();
        console.error('Erreur de sauvegarde:', response.status, errorText);
        alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      alert('Erreur de connexion. Vérifiez votre réseau.');
    } finally {
      setIsSaving(false);
    }
  };

  const closeModal = () => {
    if (!isSaving) {
      setShowValidationModal(false);
      setFormData({ phone: '', email: '' });
      setSaveSuccess(false);
    }
  };

  return (
    <div className='min-h-screen w-full bg-gray-100 flex flex-col'>
      {/* Header compact */}
      <div className='bg-white shadow-sm p-3 border-b border-gray-200 flex-shrink-0'>
        <div className='flex justify-between items-center'>
          <h1 className='text-lg font-bold text-gray-800'>📸 Selfie</h1>
          <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm">
            ← Retour
          </a>
        </div>
      </div>

      {/* Contenu principal - Priorité à la caméra */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        
        {error ? (
          <div className='flex-1 flex items-center justify-center p-4'>
            <div className='text-center p-4 bg-red-50 rounded-lg border border-red-200 w-full max-w-sm'>
              <p className='text-red-800 font-medium text-sm'>{error}</p>
            </div>
          </div>
        ) : photo ? (
          <div className='flex-1 flex flex-col items-center justify-center p-4'>
            <div className='bg-white p-3 rounded-lg shadow-lg w-full max-w-sm'>
              <img 
                src={photo} 
                alt="Captured" 
                className='w-full h-auto rounded-lg'
              />
              <div className='mt-4 flex gap-3 justify-center'>
                <button
                  onClick={retakePhoto}
                  className='bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm flex-1'
                >
                  🔄 Reprendre
                </button>
                <button
                  onClick={valider}
                  className='bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm flex-1'
                >
                  ✅ Valider
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Zone caméra - Prend la majorité de l'espace */}
            <div className='flex-1  relative  m-3 flex items-center justify-center overflow-hidden min-h-[40vh]'>
              {/* Vidéo cachée */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className='hidden'
              />
              
              {/* Canvas de rendu avec dimensions fixes */}
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className='max-h-full max-w-full object-contain borderrounded-lg'
                style={{
                  aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`
                }}
              />

             
              {isCounting && (
                <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-20'>
                  <div className='text-white text-6xl font-bold animate-pulse'>
                    {countdown}
                  </div>
                </div>
              )}
            </div>

            {/* Contrôles de capture - Zone fixe en bas */}
            <div className='bg-white border-t border-gray-200 p-4 flex-shrink-0'>
              {/* Section principale avec bouton capture et fonds d'écran */}
              <div className='flex items-center justify-center gap-4 mb-4'>
                {/* Fonds d'écran à gauche */}
                <div className='flex-1 max-w-xs'>
                  <p className='text-xs text-gray-500 mb-2 text-center'>🎨 Fonds personnalisé</p>
                  <div className='flex gap-2 justify-center overflow-x-auto pb-1'>
                    {allBackgrounds.slice(0, 4).map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => selectBackground(bg.url)}
                        className={`relative overflow-hidden rounded-lg border-2 transition-all flex-shrink-0 ${
                          selectedBackground === bg.url ? 'border-blue-500 shadow-lg scale-110' : 'border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        {bg.url ? (
                          <>
                            <div className='w-12 h-9'>
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
                                <span className='text-gray-500 text-xs'>❌</span>
                              </div>
                            </div>
                            {!backgroundImages[bg.url] && (
                              <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
                                <div className='w-2 h-2 border border-white border-t-transparent rounded-full animate-spin'></div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className='w-12 h-9 bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center'>
                            <span className='text-white text-xs'>🚫</span>
                          </div>
                        )}
                        
                        {/* Badge API */}
                        {bg.type === 'api' && (
                          <div className='absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded-full w-4 h-4 flex items-center justify-center'>
                            <span className='text-xs font-bold'>•</span>
                          </div>
                        )}

                        {/* Indicateur de sélection */}
                        {selectedBackground === bg.url && (
                          <div className='absolute -top-1 -left-1 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center'>
                            <svg className='w-2 h-2' fill='currentColor' viewBox='0 0 20 20'>
                              <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                    
                    {/* Bouton "Plus" si plus de 4 fonds */}
                    {allBackgrounds.length > 4 && (
                      <button
                        onClick={() => {
                          const content = document.getElementById('more-backgrounds');
                          if (content.style.display === 'none' || !content.style.display) {
                            content.style.display = 'flex';
                          } else {
                            content.style.display = 'none';
                          }
                        }}
                        className='w-12 h-9 bg-gray-100 hover:bg-gray-200 border-2 border-gray-300 rounded-lg flex items-center justify-center transition-colors'
                      >
                        <span className='text-gray-600 text-xs'>+{allBackgrounds.length - 4}</span>
                      </button>
                    )}
                  </div>
                  
                  {/* Fonds supplémentaires (cachés par défaut) */}
                  {allBackgrounds.length > 4 && (
                    <div id="more-backgrounds" className='hidden gap-2 justify-center mt-2 overflow-x-auto pb-1'>
                      {allBackgrounds.slice(4).map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => selectBackground(bg.url)}
                          className={`relative overflow-hidden rounded-lg border-2 transition-all flex-shrink-0 ${
                            selectedBackground === bg.url ? 'border-blue-500 shadow-lg scale-110' : 'border-gray-300 hover:border-blue-300'
                          }`}
                        >
                          {bg.url ? (
                            <>
                              <div className='w-12 h-9'>
                                <img 
                                  src={bg.url} 
                                  alt={bg.name}
                                  className='w-full h-full object-cover'
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className='w-full h-full bg-gray-300 hidden items-center justify-center'>
                                  <span className='text-gray-500 text-xs'>❌</span>
                                </div>
                              </div>
                              {!backgroundImages[bg.url] && (
                                <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
                                  <div className='w-2 h-2 border border-white border-t-transparent rounded-full animate-spin'></div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className='w-12 h-9 bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center'>
                              <span className='text-white text-xs'>🚫</span>
                            </div>
                          )}
                          
                          {bg.type === 'api' && (
                            <div className='absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded-full w-4 h-4 flex items-center justify-center'>
                              <span className='text-xs font-bold'>•</span>
                            </div>
                          )}

                          {selectedBackground === bg.url && (
                            <div className='absolute -top-1 -left-1 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center'>
                              <svg className='w-2 h-2' fill='currentColor' viewBox='0 0 20 20'>
                                <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bouton principal de capture - au centre */}
                <div className='flex-shrink-0'>
                  <button
                    onClick={() => capturePhoto(0)}
                    className='bg-blue-600 hover:bg-blue-700 rounded-full p-4 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:scale-95'
                    aria-label="Prendre une photo instantanée"
                    disabled={isCounting}
                  >
                    <Camera className='w-8 h-8 text-white' />
                  </button>
                </div>

                {/* Espace équilibré à droite */}
                <div className='flex-1 max-w-xs flex justify-center'>
                  <div className='text-center'>
                    
                  </div>
                </div>
              </div>

              {/* Boutons de temporisation */}
              <div className='flex justify-center gap-2'>
                {[3, 5, 10].map((seconds) => (
                  <button
                    key={seconds}
                    onClick={() => capturePhoto(seconds)}
                    className='bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm flex-1'
                    disabled={isCounting}
                  >
                    ⏱️ {seconds}s
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de validation */}
      {showValidationModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto'>
            {saveSuccess ? (
              /* État de succès */
              <div className='p-6 text-center'>
                <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <svg className='w-8 h-8 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>✅ Sauvegardé !</h3>
                <p className='text-gray-600 text-sm mb-1'>Votre selfie a été enregistré avec succès.</p>
                {formData.phone && (
                  <p className='text-blue-600 text-sm'>📱 Un SMS avec le lien a été envoyé au {formData.phone}</p>
                )}
                {formData.email && (
                  <p className='text-blue-600 text-sm'>✉️ Un email sera envoyé à {formData.email}</p>
                )}
              </div>
            ) : (
              /* Formulaire de validation */
              <>
                {/* Header */}
                <div className='p-4 border-b border-gray-200'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-lg font-semibold text-gray-900'>📤 Finaliser votre selfie</h3>
                    <button
                      onClick={closeModal}
                      disabled={isSaving}
                      className='text-gray-400 hover:text-gray-600 disabled:opacity-50'
                    >
                      <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z' clipRule='evenodd' />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Contenu */}
                <div className='p-4 space-y-4'>
                  {/* Aperçu de la photo */}
                  <div className='text-center'>
                    <img 
                      src={photo} 
                      alt="Aperçu" 
                      className='w-24 h-24 object-cover rounded-lg mx-auto border-2 border-gray-200'
                    />
                  </div>

                  {/* QR Code */}
                  <div className='text-center bg-gray-50 rounded-lg p-4'>
                    <p className='text-sm text-gray-600 mb-2'>📱 Scannez pour accéder à votre photo</p>
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code" 
                      className='w-32 h-32 mx-auto border border-gray-200 rounded'
                    />
                  </div>

                  {/* Formulaire */}
                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        📞 Numéro de téléphone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Ex: 06 12 34 56 78"
                        disabled={isSaving}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:opacity-50'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        ✉️ Adresse email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Ex: vous@exemple.com"
                        disabled={isSaving}
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:opacity-50'
                      />
                    </div>

                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
                      <p className='text-xs text-blue-800'>
                        ℹ️ Renseignez au moins un moyen de contact pour recevoir votre selfie.
                        {formData.phone && <span className='block mt-1'>📱 Un SMS avec le lien sera envoyé automatiquement</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className='p-4 border-t border-gray-200 flex gap-3'>
                  <button
                    onClick={closeModal}
                    disabled={isSaving}
                    className='flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50'
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || (!formData.phone && !formData.email)}
                    className='flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
                  >
                    {isSaving ? (
                      <>
                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2'></div>
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        💾 Sauvegarder
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Capture;