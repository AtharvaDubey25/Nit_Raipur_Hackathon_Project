// --- 1. GSAP Page Load Animation ---
document.addEventListener('DOMContentLoaded', () => {
    const tl = gsap.timeline();
    tl.to('h1', { opacity: 1, visibility: 'visible', y: -20, duration: 0.5, delay: 0.2 })
      .to('p', { opacity: 1, visibility: 'visible', y: -10, duration: 0.4 }, "-=0.3")
      .to('.language-selector', { opacity: 1, visibility: 'visible', duration: 0.5 }, "-=0.2")
      .to('.controls', { opacity: 1, visibility: 'visible', duration: 0.5 }, "-=0.3")
      .to('.caption-box', { opacity: 1, visibility: 'visible', stagger: 0.2, duration: 0.5 }, "-=0.3");
});


// --- 2. Setup SpeechRecognition ---
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!window.SpeechRecognition) {
    alert("Sorry, your browser doesn't support live speech recognition. Please use Chrome or Edge.");
} else {
    const recognition = new SpeechRecognition();
    const toggleBtn = document.getElementById('toggle-btn');
    const rawOutput = document.getElementById('raw-text-output');
    const simpleOutput = document.getElementById('simple-text-output');
    const clearBtn = document.getElementById('clear-btn');
    const resimplifyBtn = document.getElementById('resimplify-btn');
    const languageSelector = document.querySelector('.language-selector');
    const langButtons = document.querySelectorAll('.lang-btn');
    const simpleBox = simpleOutput.closest('.caption-box');

    let isListening = false;
    let rawTextHistory = '';
    let simpleTextHistory = '';
    let targetLanguage = 'English';

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    // --- Start/Stop Listening ---
    toggleBtn.addEventListener('click', () => {
        isListening = !isListening;
        if (isListening) {
            rawOutput.value = "";
            simpleOutput.textContent = "";
            rawTextHistory = "";
            simpleTextHistory = "";
            recognition.start();
            toggleBtn.textContent = 'Stop Listening';
            toggleBtn.classList.add('listening');
        } else {
            recognition.stop();
            toggleBtn.textContent = 'Start Listening';
            toggleBtn.classList.remove('listening');
        }
    });

    // --- Clear All ---
    clearBtn.addEventListener('click', () => {
        rawTextHistory = '';
        simpleTextHistory = '';
        rawOutput.value = '';
        simpleOutput.textContent = '';
    });

    // --- Re-simplify edited text ---
    resimplifyBtn.addEventListener('click', () => {
        const editedText = rawOutput.value.trim();
        if (!editedText) return;
        simpleOutput.textContent = "Thinking...";
        sendToBackend(editedText, true, targetLanguage);
    });

    // --- Language Selector ---
    languageSelector.addEventListener('click', (e) => {
        if (e.target.classList.contains('lang-btn')) {
            langButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            targetLanguage = e.target.dataset.lang;
            console.log("Language set to:", targetLanguage);
        }
    });

    // --- Handle STT Results ---
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript.trim() + ' ';
            } else {
                interimTranscript += transcript;
            }
        }

        rawOutput.value = rawTextHistory + interimTranscript;

        if (finalTranscript) {
            rawTextHistory += finalTranscript;
            simpleOutput.textContent = simpleTextHistory + "Thinking...";
            sendToBackend(finalTranscript, false, targetLanguage);
        } else if (interimTranscript) {
            simpleOutput.textContent = simpleTextHistory + "Listening...";
        }
    };

    // --- Backend API call (with GSAP glow effect) ---
    async function sendToBackend(textToSimplify, isFullReplace = false, language) {
        console.log(`Sending to backend (${language}):`, textToSimplify);

        try {
            const response = await fetch('http://127.0.0.1:8000/simplify-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textToSimplify, language })
            });

            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const data = await response.json();

            // Flash animation for the simple box
            gsap.to(simpleBox, {
                boxShadow: "0 0 40px 10px rgba(167, 139, 250, 0.25)",
                duration: 0.3,
                yoyo: true,
                repeat: 1,
                ease: "power1.inOut"
            });

            if (isFullReplace) {
                simpleTextHistory = data.simple_text;
            } else {
                simpleTextHistory += data.simple_text + ' ';
            }
            simpleOutput.textContent = simpleTextHistory;
        } catch (error) {
            console.error("Backend Error:", error);
            simpleOutput.textContent = "[Error simplifying text]";
        }
    }

    // --- Restart after stop (auto-reconnect) ---
    recognition.onend = () => {
        if (isListening) recognition.start();
        else {
            toggleBtn.textContent = 'Start Listening';
            toggleBtn.classList.remove('listening');
        }
    };

    // --- Error Handling ---
    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (['not-allowed', 'permission-denied'].includes(event.error)) {
            isListening = false;
            toggleBtn.textContent = 'Start Listening';
            toggleBtn.classList.remove('listening');
            alert("Please allow microphone access to use this feature.");
        } else if (event.error !== 'network') {
            alert(`Error: ${event.error}`);
        }
    };
}


document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) {
    console.error("Theme toggle button not found!");
    return;
  }

  const root = document.documentElement;

  if (localStorage.getItem('theme') === 'light') enableLightMode();
  else enableDarkMode();

  themeToggle.addEventListener('click', () => {
    if (root.classList.contains('light-mode')) enableDarkMode();
    else enableLightMode();
  });

  function enableLightMode() {
    root.classList.add('light-mode');
    document.body.style.backgroundColor = '#f7f7ff';
    document.body.style.color = '#111';
    themeToggle.textContent = '☀️';
    localStorage.setItem('theme', 'light');
  }

  function enableDarkMode() {
    root.classList.remove('light-mode');
    document.body.style.backgroundColor = '#121212';
    document.body.style.color = '#e0e0e0';
    themeToggle.textContent = '🌙';
    localStorage.setItem('theme', 'dark');
  }
});
