// --- 1. Setup SpeechRecognition ---
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Check for browser support
if (!window.SpeechRecognition) {
    alert("Sorry, your browser doesn't support live speech recognition. Please use Chrome or Edge.");
} else {
    // --- 2. Get DOM Elements ---
    const recognition = new SpeechRecognition();
    const toggleBtn = document.getElementById('toggle-btn');
    const rawOutput = document.getElementById('raw-text-output'); // This is a <textarea>
    const simpleOutput = document.getElementById('simple-text-output');
    const clearBtn = document.getElementById('clear-btn');
    const resimplifyBtn = document.getElementById('resimplify-btn');

    let isListening = false;
    let rawTextHistory = ''; // Stores the full transcript for the raw box
    let simpleTextHistory = ''; // Stores the full history of simplified text

    // --- 3. Configure the STT Engine ---
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    // --- 4. Handle Button Clicks ---
    toggleBtn.addEventListener('click', () => {
        isListening = !isListening;
        if (isListening) {
            // Clear all text for a new session
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

    // --- NEW FEATURE 1: Clear Slate ---
    clearBtn.addEventListener('click', () => {
        rawTextHistory = '';
        simpleTextHistory = '';
        rawOutput.value = ''; // Use .value for <textarea>
        simpleOutput.textContent = '';
    });

    // --- NEW FEATURE 2: Re-Simplify (UPDATED) ---
    resimplifyBtn.addEventListener('click', () => {
        const editedText = rawOutput.value; // Get all text from the box
        if (!editedText.trim()) return; // Do nothing if empty

        console.log("Re-simplifying edited text...");
        
        // --- ADDED "THINKING..." ---
        simpleOutput.textContent = "Thinking..."; // Show feedback
        
        // Call backend, pass 'true' to signal a full replacement
        sendToBackend(editedText, true); 
    });


    // --- 5. Process STT Results (UPDATED) ---
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let currentFinalTranscript = ''; // Just the text from this one event

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                // This is the final, confirmed transcript for a sentence.
                currentFinalTranscript = transcript.trim() + ' ';
                rawTextHistory += currentFinalTranscript; // Add to full log
                
                // --- ADDED "THINKING..." ---
                simpleOutput.textContent = simpleTextHistory + "Thinking...";

                // --- THIS IS THE HANDOFF ---
                // Send *only the new* sentence to the backend.
                sendToBackend(currentFinalTranscript, false);

            } else {
                // This is a temporary, "in-progress" transcript.
                interimTranscript += transcript;
            }
        }

        // Update the UI
        rawOutput.value = rawTextHistory + interimTranscript;
        
        // --- ADDED "LISTENING..." ---
        // Show "Listening..." only if we are not "Thinking"
        if (interimTranscript && !currentFinalTranscript) {
            simpleOutput.textContent = simpleTextHistory + "Listening...";
        }
    };

    // --- 6. Handle Backend Communication (UPDATED) ---
    // Now accepts a flag to know if it should append or replace
    async function sendToBackend(textToSimplify, isFullReplace = false) {
        console.log("Sending to backend:", textToSimplify);

        try {
            const response = await fetch('http://127.0.0.1:8000/simplify-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: textToSimplify,
                    language: 'English' // You can change this or add a dropdown
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            console.log("Got from backend:", data.simple_text);

            if (isFullReplace) {
                // Replace the entire simple text box
                simpleTextHistory = data.simple_text; // Reset history
                simpleOutput.textContent = simpleTextHistory;
            } else {
                // Append the new simplified text to the box
                simpleTextHistory += data.simple_text + ' '; // Add new text to history
                simpleOutput.textContent = simpleTextHistory; // Display full history
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

    // --- 7. Handle End of Listening ---
    recognition.onend = () => {
        if (isListening) {
            recognition.start();
        } else {
            toggleBtn.textContent = 'Start Listening';
            toggleBtn.classList.remove('listening');
        }
    };

    // --- 8. Handle Errors ---
    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== 'network') {
            alert(`Error: ${event.error}`);
        }
    };
}