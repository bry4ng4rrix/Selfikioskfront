import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RotateCcw, Check, X, Smartphone, Mail, QrCode, Sparkles } from "lucide-react";

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
  const [showBackgrounds, setShowBackgrounds] = useState(false);

  // Dimensions standards pour le canvas
  const CANVAS_WIDTH = 1920;
  const CANVAS_HEIGHT = 1080;

  // Fonds prédéfinis par défaut
  const defaultBackgrounds = [
    { id: 'none', name: 'Original', url: null, type: 'default' }
  ];

  // Charger les fonds d'écran depuis l'API
  useEffect(() => {
    const fetchBackgrounds = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/backgrounds');
        if (response.ok) {
          const data = await response.json();
          console.log('Fonds d\'écran récupérés:', data);
          
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

    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;

      if (isBackgroundEnabled && selectedBackground && backgroundImages[selectedBackground]) {
        const backgroundImg = backgroundImages[selectedBackground];
        
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        
        const videoRatio = video.videoWidth / video.videoHeight;
        const canvasRatio = canvas.width / canvas.height;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (videoRatio > canvasRatio) {
          drawHeight = canvas.height;
          drawWidth = drawHeight * videoRatio;
          offsetX = (canvas.width - drawWidth) / 2;
          offsetY = 0;
        } else {
          drawWidth = canvas.width;
          drawHeight = drawWidth / videoRatio;
          offsetX = 0;
          offsetY = (canvas.height - drawHeight) / 2;
        }
        
        tempCtx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
        
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          const pixelIndex = Math.floor(i / 4);
          const x = pixelIndex % canvas.width;
          const y = Math.floor(pixelIndex / canvas.width);
          
          const isEdgeZone = (
            x < canvas.width * 0.1 ||
            x > canvas.width * 0.9 ||
            y < canvas.height * 0.1 ||
            y > canvas.height * 0.9
          );
          
          let isBackground = false;
          
          if (isEdgeZone) {
            isBackground = (
              (r > 180 && g > 180 && b > 180) ||
              (r < 60 && g < 60 && b < 60) ||
              (Math.abs(r - g) < 40 && Math.abs(g - b) < 40 && Math.abs(r - b) < 40)
            );
          } else {
            isBackground = (
              (r > 200 && g > 200 && b > 200) ||
              (r < 40 && g < 40 && b < 40) ||
              (Math.abs(r - g) < 25 && Math.abs(g - b) < 25 && Math.abs(r - b) < 25 && r > 160) ||
              (g > r + 50 && g > b + 50 && g > 100) ||
              (b > r + 50 && b > g + 50 && b > 100)
            );
          }

          if (isBackground) {
            data[i + 3] = 0;
          }
        }

        tempCtx.putImageData(imageData, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0);
      } else {
        const videoRatio = video.videoWidth / video.videoHeight;
        const canvasRatio = canvas.width / canvas.height;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (videoRatio > canvasRatio) {
          drawHeight = canvas.height;
          drawWidth = drawHeight * videoRatio;
          offsetX = (canvas.width - drawWidth) / 2;
          offsetY = 0;
        } else {
          drawWidth = canvas.width;
          drawHeight = drawWidth / videoRatio;
          offsetX = 0;
          offsetY = (canvas.height - drawHeight) / 2;
        }
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
      }
      
      if (showGuides) {
        drawGuides(ctx, canvas.width, canvas.height);
      }
    }

    animationRef.current = requestAnimationFrame(processFrame);
  }, [isBackgroundEnabled, selectedBackground, backgroundImages, showGuides]);

  const drawGuides = (ctx, width, height) => {
    ctx.save();
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = width * 0.12;
    const radiusY = height * 0.18;
    
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.setLineDash([15, 10]);
    ctx.stroke();
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 12]);
    
    ctx.beginPath();
    ctx.moveTo(width / 3, 0);
    ctx.lineTo(width / 3, height);
    ctx.moveTo(2 * width / 3, 0);
    ctx.lineTo(2 * width / 3, height);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, height / 3);
    ctx.lineTo(width, height / 3);
    ctx.moveTo(0, 2 * height / 3);
    ctx.lineTo(width, 2 * height / 3);
    ctx.stroke();
    
    if (!isCounting) {
      ctx.font = `${Math.max(16, width * 0.025)}px Arial, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Positionnez votre visage dans l\'ovale', centerX, centerY + radiusY + 40);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    ctx.restore();
  };

  useEffect(() => {
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

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      const startProcessing = () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        animationRef.current = requestAnimationFrame(processFrame);
      };

      videoRef.current.addEventListener('playing', startProcessing);
      
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
      let backgroundId = null;
      if (selectedBackground) {
        const selectedBg = allBackgrounds.find(bg => bg.url === selectedBackground);
        backgroundId = selectedBg ? selectedBg.id : null;
      }

      const captureData = {
        photo_base64: photo.split(',')[1],
        phone: formData.phone || '',
        email: formData.email || '',
        background_id: backgroundId || ''
      };

      console.log('Envoi des données:', { ...captureData, photo_base64: 'base64_truncated...' });

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
            }
          } catch (smsError) {
            console.error('Erreur de connexion SMS:', smsError);
          }
        }
        
        setSaveSuccess(true);
        
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
    <div className='min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col'>
      {/* Header Modern */}
      <div className='bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20 p-4 flex-shrink-0'>
        <div className='flex justify-between items-center max-w-7xl mx-auto'>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Camera className='w-6 h-6 text-white' />
            </div>
            <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
              SelfieKiosk
            </h1>
          </div>
          <a href="/" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg">
            ← Retour
          </a>
        </div>
      </div>

      {/* Contenu principal */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        
        {error ? (
          <div className='flex-1 flex items-center justify-center p-6'>
            <div className='text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-red-200 shadow-xl w-full max-w-md'>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur d'accès caméra</h3>
              <p className='text-red-800 font-medium text-sm'>{error}</p>
            </div>
          </div>
        ) : photo ? (
          <div className='flex-1 flex flex-col items-center justify-center p-6'>
            <div className='bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-2xl w-full max-w-lg border border-white/20'>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Votre selfie est prêt ! ✨</h2>
              </div>
              <img 
                src={photo} 
                alt="Captured" 
                className='w-full h-auto rounded-2xl shadow-lg border-2 border-white/50'
              />
              <div className='mt-6 flex gap-4'>
                <button
                  onClick={retakePhoto}
                  className='bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2 flex-1'
                >
                  <RotateCcw className="w-5 h-5" />
                  Reprendre
                </button>
                <button
                  onClick={valider}
                  className='bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2 flex-1'
                >
                  <Check className="w-5 h-5" />
                  Valider
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Zone caméra */}
            <div className='flex-1 relative m-6 flex items-center justify-center overflow-hidden min-h-[40vh]'>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className='hidden'
              />
              
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className='max-h-full max-w-full object-contain rounded-2xl shadow-2xl border-4 border-white/20'
                style={{
                  aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`
                }}
              />

              {isCounting && (
                <div className='absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-20 rounded-2xl'>
                  <div className='text-white text-8xl font-black animate-pulse drop-shadow-2xl'>
                    {countdown}
                  </div>
                </div>
              )}
            </div>

            {/* Contrôles modernes */}
            <div className='bg-white/80 backdrop-blur-sm border-t border-white/20 p-6 flex-shrink-0 shadow-lg'>
              <div className='max-w-7xl mx-auto'>
                {/* Fonds d'écran */}
                <div className='mb-6'>
                  <button
                    onClick={() => setShowBackgrounds(!showBackgrounds)}
                    className='flex items-center gap-2 text-gray-700 font-semibold mb-4 hover:text-blue-600 transition-colors'
                  >
                    <Sparkles className="w-5 h-5" />
                    Fonds personnalisés ({allBackgrounds.length})
                    <span className={`transform transition-transform ${showBackgrounds ? 'rotate-180' : ''}`}>⌄</span>
                  </button>
                  
                  {showBackgrounds && (
                    <div className='bg-white/50 rounded-2xl p-4 border border-white/30'>
                      <div className='grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3'>
                        {allBackgrounds.map((bg) => (
                          <button
                            key={bg.id}
                            onClick={() => selectBackground(bg.url)}
                            className={`relative overflow-hidden rounded-xl border-3 transition-all duration-300 hover:scale-105 ${
                              selectedBackground === bg.url 
                                ? 'border-blue-500 shadow-lg ring-4 ring-blue-200' 
                                : 'border-gray-300 hover:border-blue-300 hover:shadow-md'
                            }`}
                          >
                            {bg.url ? (
                              <div className='aspect-square'>
                                <img 
                                  src={bg.url} 
                                  alt={bg.name}
                                  className='w-full h-full object-cover'
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className='w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 hidden items-center justify-center'>
                                  <X className="w-6 h-6 text-gray-600" />
                                </div>
                              </div>
                            ) : (
                              <div className='aspect-square bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center'>
                                <span className='text-white text-sm font-semibold'>Original</span>
                              </div>
                            )}
                            
                            {selectedBackground === bg.url && (
                              <div className='absolute top-1 right-1 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg'>
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                            
                            <div className='absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center truncate'>
                              {bg.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Boutons de capture */}
                <div className='flex items-center justify-center gap-4'>
                  {/* Boutons temporisation */}
                  <div className='flex gap-2'>
                    {[3, 5, 10].map((seconds) => (
                      <button
                        key={seconds}
                        onClick={() => capturePhoto(seconds)}
                        className='bg-white/70 hover:bg-white/90 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 border border-white/30'
                        disabled={isCounting}
                      >
                        {seconds}s
                      </button>
                    ))}
                  </div>

                  {/* Bouton principal */}
                  <button
                    onClick={() => capturePhoto(0)}
                    className='bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-full p-6 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:scale-95 border-4 border-white/30'
                    aria-label="Prendre une photo instantanée"
                    disabled={isCounting}
                  >
                    <Camera className='w-10 h-10 text-white' />
                  </button>
                  
                  {/* Espace équilibré */}
                  <div className='w-[152px]'></div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de validation modernisé */}
      {showValidationModal && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <div className='bg-white/95 backdrop-blur-sm rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20'>
            {saveSuccess ? (
              <div className='p-8 text-center'>
                <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                  <Check className='w-10 h-10 text-green-600' />
                </div>
                <h3 className='text-2xl font-bold text-gray-900 mb-4'>Sauvegardé ! ✨</h3>
                <p className='text-gray-600 mb-2'>Votre selfie a été enregistré avec succès.</p>
                {formData.phone && (
                  <p className='text-blue-600 font-medium'>📱 SMS envoyé au {formData.phone}</p>
                )}
                {formData.email && (
                  <p className='text-blue-600 font-medium'>✉️ Email envoyé à {formData.email}</p>
                )}
              </div>
            ) : (
              <>
                <div className='p-6 border-b border-gray-200/50'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-xl font-bold text-gray-900'>Finaliser votre selfie</h3>
                    <button
                      onClick={closeModal}
                      disabled={isSaving}
                      className='text-gray-400 hover:text-gray-600 disabled:opacity-50 p-2 hover:bg-gray-100 rounded-full transition-colors'
                    >
                      <X className='w-5 h-5' />
                    </button>
                  </div>
                </div>

                <div className='p-6 space-y-6'>
                  <div className='text-center'>
                    <img 
                      src={photo} 
                      alt="Aperçu" 
                      className='w-32 h-32 object-cover rounded-2xl mx-auto border-4 border-white/50 shadow-lg'
                    />
                  </div>

                  <div className='text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50'>
                    <QrCode className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <p className='text-sm text-blue-800 font-medium mb-4'>Scannez pour accéder à votre photo</p>
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code" 
                      className='w-32 h-32 mx-auto border-2 border-white rounded-xl shadow-lg'
                    />
                  </div>

                  <div className='space-y-4'>
                    <div>
                      <label className='flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2'>
                        <Smartphone className="w-4 h-4" />
                        Numéro de téléphone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Ex: 06 12 34 56 78"
                        disabled={isSaving}
                        className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:opacity-50 transition-all'
                      />
                    </div>

                    <div>
                      <label className='flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2'>
                        <Mail className="w-4 h-4" />
                        Adresse email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Ex: vous@exemple.com"
                        disabled={isSaving}
                        className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:opacity-50 transition-all'
                      />
                    </div>

                    <div className='bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200/50 rounded-xl p-4'>
                      <p className='text-xs text-blue-800'>
                        ℹ️ Renseignez au moins un moyen de contact pour recevoir votre selfie.
                        {formData.phone && <span className='block mt-1'>📱 Un SMS avec le lien sera envoyé automatiquement</span>}
                      </p>
                    </div>
                  </div>
                </div>

                <div className='p-6 border-t border-gray-200/50 flex gap-4'>
                  <button
                    onClick={closeModal}
                    disabled={isSaving}
                    className='flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors disabled:opacity-50'
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || (!formData.phone && !formData.email)}
                    className='flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg'
                  >
                    {isSaving ? (
                      <>
                        <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2'></div>
                        Sauvegarde...
                      </>
                    ) : (
                      'Sauvegarder'
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