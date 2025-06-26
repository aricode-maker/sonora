const gradients = [
  "linear-gradient(to top, #c116d3 0%, #f1f1f1 100%)",
  "linear-gradient(to top, #f9661c 0%, #f1f1f1 100%)",
  "linear-gradient(to top, #22f2bb 0%, #f1f1f1 100%)",
  "linear-gradient(to top, #007db6 0%, #f1f1f1 100%)"
];

let currentGradient = 0;

function changeGradient() {
  document.body.style.background = gradients[currentGradient];
  currentGradient = (currentGradient + 1) % gradients.length;
}
setInterval(changeGradient, 9000);
changeGradient();

const messages = {
  pt: {
    welcome: "Tu és parte de um mundo sonoro e da identidade de um lugar. Bem-vindo a viver Évora neste ano que se abre ao mundo. Deixa a tua mensagem e fala connosco.",
    start: "Iniciar gravação",
    stop: "Pausar",
    restart: "Reiniciar",
    play: "Reproduzir",
    send: "Enviar",
    recorded: "Mensagem gravada!",
    recordedText: "A tua voz faz parte do registo coletivo de Évora, junto à Fundação Eugénio de Almeida. Visita a instalação na Fundação Eugénio de Almeida para ouvir a sonoplastia criada com as vozes de todos os participantes."
  },
  es: {
    welcome: "Eres parte de un mundo sonoro y de la identidad de un lugar. Bienvenido a vivir Évora en este año que se abre al mundo. Deja tu mensaje y habla con nosotros.",
    start: "Iniciar grabación",
    stop: "Pausar",
    restart: "Reiniciar",
    play: "Reproducir",
    send: "Enviar",
    recorded: "¡Mensaje grabado!",
    recordedText: "Tu voz forma parte del registro colectivo de Évora, junto a la Fundación Eugénio de Almeida. Te invitamos a visitar la instalación en la Fundación Eugénio de Almeida para escuchar la sonoplastia creada con las voces de todos los participantes."
  },
  en: {
    welcome: "You are part of a sonic world and the identity of a place. Welcome to experience Évora in this year that opens itself to the world. Leave your message and speak with us.",
    start: "Start recording",
    stop: "Pause",
    restart: "Restart",
    play: "Play",
    send: "Send",
    recorded: "Message recorded!",
    recordedText: "Your voice is part of Évora's collective record, next to Fundação Eugénio de Almeida. Visit the installation at Fundação Eugénio de Almeida to listen to the soundscape created with all participants' voices."
  },
  fr: {
    welcome: "Tu fais partie d’un monde sonore et de l’identité d’un lieu. Bienvenue à vivre Évora en cette année qui s’ouvre au monde. Laisse ton message et parle avec nous.",
    start: "Commencer l’enregistrement",
    stop: "Pause",
    restart: "Recommencer",
    play: "Écouter",
    send: "Envoyer",
    recorded: "Message enregistré !",
    recordedText: "Ta voix fait partie du registre collectif d’Évora, à côté de la Fundação Eugénio de Almeida. Nous t’invitons à visiter l’installation à la Fundação Eugénio de Almeida pour écouter la création sonore réalisée avec les voix de tous les participants."
  }
};

const select = document.getElementById("lang");
const welcomeMessage = document.getElementById("welcome-message");
const visualizer = document.getElementById('visualizer');
const ctx = visualizer.getContext('2d');
const timerDisplay = document.getElementById('timer');
const recordingToggle = document.getElementById('recording-toggle');
const restartBtn = document.getElementById('restart-recording');
const pauseBtn = document.getElementById('pause-recording');
const playBtn = document.getElementById('play-recording');
const sendBtn = document.getElementById('send-recording');
const finalMessage = document.getElementById('final-message');
const logoDiv = document.querySelector('.marca-site');

let audioContext, analyser, dataArray, mediaRecorder, audioStream;
let isRecording = false, isPaused = false, isFinished = false;
let recordedChunks = [];
let startTime, timerInterval, audioPlayer;
let showVisualizer = true;

function updateUILanguage() {
  const lang = select.value;
  welcomeMessage.innerHTML = messages[lang].welcome;
  recordingToggle.textContent = messages[lang].start;
  pauseBtn.textContent = messages[lang].stop;
  restartBtn.textContent = messages[lang].restart;
  playBtn.textContent = messages[lang].play;
  sendBtn.textContent = messages[lang].send;
  finalMessage.querySelector('h2').textContent = messages[lang].recorded;
  finalMessage.querySelector('p').textContent = messages[lang].recordedText;
}
select.addEventListener('change', updateUILanguage);

function setupCanvas() {
  visualizer.width = window.innerWidth;
  visualizer.height = Math.max(window.innerHeight * 0.32, 120);
}
window.addEventListener('resize', setupCanvas);

function drawLines() {
  if (!analyser || !showVisualizer) return;
  requestAnimationFrame(drawLines);
  analyser.getByteTimeDomainData(dataArray);
  ctx.clearRect(0, 0, visualizer.width, visualizer.height);
  const centerY = visualizer.height / 2;
  const sliceWidth = visualizer.width / dataArray.length;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.2)";
  ctx.shadowBlur = 30;
  ctx.globalAlpha = 0.85;
  // Visualizador clásico
  const numLines = 32;
  const lineWidth = 3;
  const baseAmplitude = 80;
  const reactivity = 2.5;
  for (let l = 0; l < numLines; l++) {
    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
    for (let i = 0; i < dataArray.length; i++) {
      const x = i * sliceWidth;
      const waveData = (dataArray[i] / 128.0 - 1.0);
      const v = waveData * baseAmplitude * reactivity;
      const offsetY = (l - numLines/2) * 6;
      const y = centerY + v + offsetY;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

async function initAudio() {
  audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaStreamSource(audioStream);
  source.connect(analyser);
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.7;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  mediaRecorder = new MediaRecorder(audioStream);
  mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);
  showVisualizer = true;
  visualizer.classList.remove('hidden');
  drawLines();
}

function startTimer() {
  startTime = Date.now();
  timerDisplay.textContent = "00:00";
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const min = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const sec = String(elapsed % 60).padStart(2, '0');
    timerDisplay.textContent = `${min}:${sec}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function resetUI() {
  isRecording = false;
  isPaused = false;
  isFinished = false;
  showVisualizer = true;
  visualizer.classList.remove('hidden');
  recordingToggle.classList.remove('hidden');
  pauseBtn.classList.add('hidden');
  restartBtn.classList.add('hidden');
  playBtn.classList.add('hidden');
  sendBtn.classList.add('hidden');
  finalMessage.classList.add('hidden');
  timerDisplay.textContent = "00:00";
  updateUILanguage();
  // MOSTRAR LOGOTIPO
  logoDiv.classList.remove('hidden');
}

recordingToggle.addEventListener('click', async () => {
  if (!audioContext) await initAudio();
  isRecording = true;
  isPaused = false;
  isFinished = false;
  recordingToggle.classList.add('hidden');
  pauseBtn.classList.remove('hidden');
  restartBtn.classList.remove('hidden');
  playBtn.classList.add('hidden');
  sendBtn.classList.add('hidden');
  recordedChunks = [];
  mediaRecorder.start();
  startTimer();
});

pauseBtn.addEventListener('click', () => {
  if (isRecording) {
    isRecording = false;
    isPaused = true;
    pauseBtn.classList.add('hidden');
    playBtn.classList.remove('hidden');
    sendBtn.classList.remove('hidden');
    mediaRecorder.stop();
    stopTimer();
  }
});

restartBtn.addEventListener('click', () => {
  resetUI();
});

playBtn.addEventListener('click', () => {
  if (recordedChunks.length === 0) return;
  const blob = new Blob(recordedChunks, { type: 'audio/webm' });
  const url = URL.createObjectURL(blob);
  audioPlayer = new Audio(url);
  audioPlayer.play();
});

sendBtn.addEventListener('click', () => {
  // Oculta el visualizador y muestra solo el mensaje final
  showVisualizer = false;
  visualizer.classList.add('hidden');
  finalMessage.classList.remove('hidden');
  pauseBtn.classList.add('hidden');
  playBtn.classList.add('hidden');
  sendBtn.classList.add('hidden');
  restartBtn.classList.add('hidden');
  // OCULTAR LOGOTIPO
  logoDiv.classList.add('hidden');
});

window.addEventListener('DOMContentLoaded', () => {
  setupCanvas();
  updateUILanguage();
  resetUI();
});
