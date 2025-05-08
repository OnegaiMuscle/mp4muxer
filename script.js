document.addEventListener('DOMContentLoaded', function() {
  const videoFileInput = document.getElementById('videoFile');
  const audioFileInput = document.getElementById('audioFile');
  const subtitleFileInput = document.getElementById('subtitleFile');
  const processBtn = document.getElementById('processBtn');
  const outputNameInput = document.getElementById('outputName');
  const languageSelect = document.getElementById('language');
  const statusDiv = document.getElementById('status');
  const statusText = document.getElementById('statusText');
  const progressBar = document.getElementById('progressBar');
  const errorDiv = document.getElementById('error');

  let videoFile = null;
  let audioFile = null;
  let subtitleFile = null;

  // Vérifier si tous les fichiers nécessaires sont sélectionnés
  function checkFiles() {
      const hasVideo = videoFileInput.files.length > 0;
      const hasAudio = audioFileInput.files.length > 0;

      processBtn.disabled = !(hasVideo || hasAudio);
  }

  // Gestion des changements de fichiers
  videoFileInput.addEventListener('change', function() {
      if (this.files.length > 0) {
          videoFile = this.files[0];
          if (!outputNameInput.value || outputNameInput.value === 'output.mkv') {
              outputNameInput.value = videoFile.name.replace(/\.[^/.]+$/, '') + '.mkv';
          }
      } else {
          videoFile = null;
      }
      checkFiles();
  });

  audioFileInput.addEventListener('change', function() {
      audioFile = this.files.length > 0 ? this.files[0] : null;
      checkFiles();
  });

  subtitleFileInput.addEventListener('change', function() {
      subtitleFile = this.files.length > 0 ? this.files[0] : null;
  });

  // Processus de création du MKV
  processBtn.addEventListener('click', async function() {
      if (!videoFile && !audioFile) return;

      // Réinitialiser l'interface
      errorDiv.classList.add('hidden');
      statusDiv.classList.remove('hidden');
      statusText.textContent = 'Préparation des données...';
      progressBar.style.width = '0%';

      try {
          // Créer un nouveau multiplexeur MKV
          const muxer = new muxjs.mp4.Muxer({
              output: 'matroska',
              video: videoFile ? {
                  codec: 'avc',
                  width: 0,  // Seront mis à jour après analyse
                  height: 0,
                  fps: 0
              } : null,
              audio: audioFile ? {
                  codec: 'aac',
                  sampleRate: 0,  // Seront mis à jour après analyse
                  channelCount: 0
              } : null
          });

          // Tableaux pour stocker les données
          const videoData = [];
          const audioData = [];
          let subtitleData = null;

          // Traitement de la vidéo si présente
          if (videoFile) {
              statusText.textContent = 'Analyse de la vidéo...';
              const videoInfo = await analyzeVideo(videoFile);
              muxer.video.width = videoInfo.width;
              muxer.video.height = videoInfo.height;
              muxer.video.fps = videoInfo.fps;

              statusText.textContent = 'Extraction des données vidéo...';
              await extractVideoTracks(videoFile, (data) => {
                  videoData.push(data);
                  updateProgress(videoData.length / 100); // Estimation grossière
              });
          }

          // Traitement de l'audio si présent
          if (audioFile) {
              statusText.textContent = 'Analyse de l\'audio...';
              const audioInfo = await analyzeAudio(audioFile);
              muxer.audio.sampleRate = audioInfo.sampleRate;
              muxer.audio.channelCount = audioInfo.channelCount;

              statusText.textContent = 'Extraction des données audio...';
              await extractAudioTracks(audioFile, (data) => {
                  audioData.push(data);
                  updateProgress(0.5 + (audioData.length / 100)); // Estimation grossière
              });
          }

          // Traitement des sous-titres si présents
          if (subtitleFile) {
              statusText.textContent = 'Lecture des sous-titres...';
              subtitleData = await readSubtitleFile(subtitleFile);
          }

          statusText.textContent = 'Création du fichier MKV...';
          progressBar.style.width = '90%';

          // Assembler le fichier MKV
          const outputBlob = await createMKVFile(muxer, videoData, audioData, subtitleData, languageSelect.value);

          // Télécharger le fichier
          statusText.textContent = 'Téléchargement...';
          progressBar.style.width = '100%';

          const url = URL.createObjectURL(outputBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = outputNameInput.value || 'output.mkv';
          document.body.appendChild(a);
          a.click();

          // Nettoyage
          setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              statusText.textContent = 'Terminé!';
          }, 100);

      } catch (error) {
          console.error('Erreur:', error);
          errorDiv.textContent = 'Erreur: ' + error.message;
          errorDiv.classList.remove('hidden');
          statusText.textContent = 'Échec';
      }
  });

  // Mettre à jour la barre de progression
  function updateProgress(percent) {
      const progress = Math.min(100, Math.max(0, Math.floor(percent * 100)));
      progressBar.style.width = progress + '%';
      statusText.textContent = 'Traitement... ' + progress + '%';
  }

  // Analyser les métadonnées vidéo
  async function analyzeVideo(file) {
      return new Promise((resolve) => {
          // Pour simplifier, nous utilisons des valeurs par défaut
          // Dans une vraie application, vous voudriez analyser le fichier
          resolve({
              width: 1920,
              height: 1080,
              fps: 30
          });
      });
  }

  // Analyser les métadonnées audio
  async function analyzeAudio(file) {
      return new Promise((resolve) => {
          // Pour simplifier, nous utilisons des valeurs par défaut
          resolve({
              sampleRate: 44100,
              channelCount: 2
          });
      });
  }

  // Extraire les pistes vidéo (simplifié)
  async function extractVideoTracks(file, onData) {
      return new Promise((resolve) => {
          // Simulation de l'extraction de données
          for (let i = 0; i < 50; i++) {
              setTimeout(() => {
                  onData(new Uint8Array(0)); // Données factices
                  if (i === 49) resolve();
              }, i * 20);
          }
      });
  }

  // Extraire les pistes audio (simplifié)
  async function extractAudioTracks(file, onData) {
      return new Promise((resolve) => {
          // Simulation de l'extraction de données
          for (let i = 0; i < 50; i++) {
              setTimeout(() => {
                  onData(new Uint8Array(0)); // Données factices
                  if (i === 49) resolve();
              }, i * 20);
          }
      });
  }

  // Lire le fichier de sous-titres
  async function readSubtitleFile(file) {
      return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsText(file);
      });
  }

  // Créer le fichier MKV (simplifié)
  async function createMKVFile(muxer, videoData, audioData, subtitleData, language) {
      return new Promise((resolve) => {
          // Simulation de la création du fichier
          setTimeout(() => {
              // Dans une vraie application, vous utiliseriez muxer pour créer le fichier
              const blob = new Blob([], { type: 'video/x-matroska' });
              resolve(blob);
          }, 1000);
      });
  }
});
