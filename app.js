// --- 1. GSAP Page Load Animation ---
// This runs as soon as the page is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create a "timeline" to control the sequence
    const tl = gsap.timeline();
    
    // Animate elements in, one after another (stagger)
    tl.to('h1', { opacity: 1, visibility: 'visible', y: -20, duration: 0.5, delay: 0.2 })
      .to('p', { opacity: 1, visibility: 'visible', y: -10, duration: 0.4 }, "-=0.3")
      .to('.language-selector', { opacity: 1, visibility: 'visible', duration: 0.5 }, "-=0.2")
      .to('.controls', { opacity: 1, visibility: 'visible', duration: 0.5 }, "-=0.3")
      .to('.caption-box', { opacity: 1, visibility: 'visible', stagger: 0.2, duration: 0.5 }, "-=0.3");
});


// --- 2. Setup SpeechRecognition ---
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Check for browser support
if (!window.SpeechRecognition) {
    alert("Sorry, your browser doesn't support live speech recognition. Please use Chrome or Edge.");
} else {
    // --- 3. Get DOM Elements ---
    const recognition = new SpeechRecognition();
    const toggleBtn = document.getElementById('toggle-btn');
    const rawOutput = document.getElementById('raw-text-output');
    const simpleOutput = document.getElementById('simple-text-output');
    const clearBtn = document.getElementById('clear-btn');
    const resimplifyBtn = document.getElementById('resimplify-btn');
    const languageSelector = document.querySelector('.language-selector');
    const langButtons = document.querySelectorAll('.lang-btn');

    // Get the box we want to make glow
    const simpleBox = simpleOutput.closest('.caption-box');

    let isListening = false;
    let rawTextHistory = '';
    let simpleTextHistory = '';
    let targetLanguage = 'English';

    // --- 4. Configure the STT Engine ---
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    // --- 5. Handle Button Clicks ---
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

    clearBtn.addEventListener('click', () => {
        rawTextHistory = '';
        simpleTextHistory = '';
        rawOutput.value = '';
        simpleOutput.textContent = '';
    });

    resimplifyBtn.addEventListener('click', () => {
        const editedText = rawOutput.value;
        if (!editedText.trim()) return;

        console.log("Re-simplifying edited text...");
        simpleOutput.textContent = "Thinking...";
        
        sendToBackend(editedText, true, targetLanguage); 
    });

    languageSelector.addEventListener('click', (e) => {
        if (e.target.classList.contains('lang-btn')) {
            langButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');
            targetLanguage = e.target.dataset.lang;
            console.log("Target language set to:", targetLanguage);
        }
    });

    // --- 6. Process STT Results ---
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let currentFinalTranscript = ''; 

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                currentFinalTranscript = transcript.trim() + ' ';
                rawTextHistory += currentFinalTranscript; 
                
                simpleOutput.textContent = simpleTextHistory + "Thinking...";

                sendToBackend(currentFinalTranscript, false, targetLanguage);

            } else {
                interimTranscript += transcript;
            }
        }

        rawOutput.value = rawTextHistory + interimTranscript;
        
        if (interimTranscript && !currentFinalTranscript) {
            simpleOutput.textContent = simpleTextHistory + "Listening...";
        }
    };

    // --- 7. Handle Backend Communication (with GSAP) ---
    async function sendToBackend(textToSimplify, isFullReplace = false, language) {
        console.log(`Sending to backend (Lang: ${language}):`, textToSimplify);

        try {
            const response = await fetch('http://127.0.0.1:8000/simplify-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: textToSimplify,
                    language: language 
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            console.log("Got from backend:", data.simple_text);

            // --- THIS IS THE GSAP "FLASH" ---
            gsap.to(simpleBox, {
                boxShadow: "0 0 40px 10px rgba(255, 255, 255, 0.15)", // Glow
                duration: 0.3,    // Fast fade in
                yoyo: true,       // Fade back out
                repeat: 1,        // Play in, then out (yoyo)
                ease: "power1.inOut"
            });
            // ------------------------------------

            if (isFullReplace) {
                simpleTextHistory = data.simple_text; 
                simpleOutput.textContent = simpleTextHistory;
            } else {
                simpleTextHistory += data.simple_text + ' '; 
                simpleOutput.textContent = simpleTextHistory; 
            }

        } catch (error) {
            console.error("Error sending to backend:", error);
            if (isFullReplace) {
                simpleOutput.textContent = "[Error simplifying text]";
            } else {
                simpleOutput.textContent = simpleTextHistory + "[Error] ";
            }
        }
    }

    // --- 8. Handle End of Listening ---
    recognition.onend = () => {
        if (isListening) {
            recognition.start();
        } else {
            toggleBtn.textContent = 'Start Listening';
            toggleBtn.classList.remove('listening');
        }
    };

    // --- 9. Handle Errors (UPDATED) ---
    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);

        // --- THIS IS THE FIX ---
        // Check for the "permission denied" error
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            // 1. Set isListening to false to stop the 'onend' loop
            isListening = false;
            
            // 2. Visually reset the button
            toggleBtn.textContent = 'Start Listening';
            toggleBtn.classList.remove('listening');
            
            // 3. Give a clear, one-time alert
            alert("You must grant microphone permission to use this app.");
        } 
        // --- END FIX ---
        else if (event.error !== 'network') { 
            // Handle other errors, but not the common "network" one
            alert(`Error: ${event.error}`);
        }
    };
}