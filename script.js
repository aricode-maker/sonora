// Definir mensajes en diferentes idiomas
const messages = {
    pt: "TU és parte dum mundo sonoro, e a identidade dum lugar. Bem-vindo a viver a ÉVORA neste ano que se abre ao mundo. Deixa a tua mensagem e fala conosco.",
    es: "Tú eres parte de un mundo sonoro y de la identidad de un lugar. Bienvenido a vivir ÉVORA en este año que abre sus puertas al mundo. Deja tu mensaje y habla con nosotros.",
    en: "You are part of a sonic world and the identity of a place. Welcome to experience ÉVORA in this year that opens its doors to the world. Leave your message and speak with us.",
    fr: "Tu fais partie d'un monde sonore et de l'identité d'un lieu. Bienvenue pour vivre ÉVORA en cette année qui s'ouvre au monde. Laisse ton message et parle avec nous."
};

// Elementos del DOM
const select = document.getElementById("lang");
const messageDiv = document.getElementById("message");
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
const micInstructions = document.getElementById('mic-instructions');

// Variables para audio
let audioContext;
let analyser;
let dataArray;
let isListening = false;

// Configurar canvas
function setupCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Opciones de gradientes horizontales según la referencia
const gradientOptions = [
    'linear-gradient(to right, #c116d3, #f5f5f5)',
    'linear-gradient(to right, #007db6, #f5f5f5)',
    'linear-gradient(to right, #f9661c, #f5f5f5)',
    'linear-gradient(to right, #22f2bb, #f5f5f5)'
];

let currentColorIndex = 0;

// Función para cambiar el fondo gradualmente
function changeBackground() {
    document.body.style.background = gradientOptions[currentColorIndex];
    currentColorIndex = (currentColorIndex + 1) % gradientOptions.length;
    setTimeout(changeBackground, 15000); // Cambiar cada 15 segundos
}

// Iniciar audio
async function initAudio() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        isListening = true;
        micInstructions.style.display = 'none'; // Ocultar el mensaje una vez activado
        
        visualize();
    } catch (error) {
        console.error("Error al acceder al micrófono:", error);
        micInstructions.textContent = "Error al acceder al micrófono";
        micInstructions.style.color = "#ff0000";
    }
}

// Función para visualizar el audio con líneas que se dividen
function visualize() {
    if (!isListening) return;
    
    requestAnimationFrame(visualize);
    
    analyser.getByteTimeDomainData(dataArray);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Línea principal (central)
    const centerY = canvas.height / 2;
    
    // Dibujar línea principal negra
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000'; // Mantenemos la línea negra como se solicitó
    
    const sliceWidth = canvas.width / dataArray.length;
    for (let i = 0; i < dataArray.length; i++) {
        const x = i * sliceWidth;
        const v = dataArray[i] / 128.0 - 1.0;
        const y = centerY + v * 70;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    
    // Número de líneas derivadas
    const lineCount = 8;
    
    // Dibujar líneas derivadas (divisiones)
    for (let i = 1; i <= lineCount; i++) {
        ctx.beginPath();
        ctx.lineWidth = 2 - (i * 0.2); // Líneas más finas conforme se alejan
        ctx.strokeStyle = `rgba(0, 0, 0, ${1 - (i * 0.12)})`; // Más transparentes al alejarse
        
        for (let j = 0; j < dataArray.length; j++) {
            const x = j * sliceWidth;
            const v = dataArray[j] / 128.0 - 1.0;
            const offset = i * 7; // Distancia entre líneas
            const y = centerY + v * 70 + offset; // Líneas hacia abajo
            
            if (j === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        // Líneas hacia arriba (espejo)
        ctx.beginPath();
        ctx.lineWidth = 2 - (i * 0.2);
        ctx.strokeStyle = `rgba(0, 0, 0, ${1 - (i * 0.12)})`;
        
        for (let j = 0; j < dataArray.length; j++) {
            const x = j * sliceWidth;
            const v = dataArray[j] / 128.0 - 1.0;
            const offset = i * 7;
            const y = centerY + v * 70 - offset; // Líneas hacia arriba
            
            if (j === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }
}

// Inicializar cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
    setupCanvas();
    
    // Actualizar mensaje según idioma inicial
    if (select) {
        updateMessage(select.value);
        select.addEventListener('change', () => {
            updateMessage(select.value);
        });
    }
    
    // Iniciar cambio de fondos
    changeBackground();
    
    // Ajustar canvas cuando cambia el tamaño de la ventana
    window.addEventListener('resize', setupCanvas);
    
    // Iniciar visualización al hacer clic
    document.addEventListener('click', () => {
        if (!isListening) {
            initAudio();
        }
    });
});

// Función para actualizar el mensaje según el idioma
function updateMessage(lang) {
    if (messageDiv && messages[lang]) {
        messageDiv.textContent = messages[lang];
    }
}
