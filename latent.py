import sounddevice as sd
import numpy as np
from faster_whisper import WhisperModel
import threading
from queue import Queue

class RealtimeSpeakerTranscriber:
    def __init__(self, model_size="base"):
        self.model = WhisperModel(
            model_size,
            device="cpu",
            compute_type="float32"
        )
        self.sample_rate = 16000
        self.audio_queue = Queue()
        self.is_running = False
        
    def audio_callback(self, indata, frames, time, status):
        """Callback function for audio stream"""
        if status:
            print(f"Audio status: {status}")
        
        # Convert audio to numpy array and queue it
        audio_data = indata[:, 0].copy()
        self.audio_queue.put(audio_data)
    
    def transcription_worker(self):
        """Worker thread for continuous transcription"""
        audio_buffer = np.array([])
        
        while self.is_running:
            try:
                # Get audio from queue
                chunk = self.audio_queue.get(timeout=1)
                audio_buffer = np.concatenate([audio_buffer, chunk])
                
                # Transcribe if buffer has enough data (3 seconds)
                if len(audio_buffer) >= self.sample_rate * 3:
                    segments, _ = self.model.transcribe(
                        audio_buffer,
                        beam_size=3,
                        language="en"
                    )
                    
                    if segments:
                        text = " ".join([s.text for s in segments])
                        print(f">> {text}")
                    
                    # Keep last 1 second for overlap
                    audio_buffer = audio_buffer[-self.sample_rate:]
            
            except:
                continue
    
    def start_listening(self, device_index=None):
        """Start real-time speaker transcription"""
        self.is_running = True
        
        # Start transcription worker in background thread
        worker_thread = threading.Thread(target=self.transcription_worker, daemon=True)
        worker_thread.start()
        
        print("Listening to speaker in real-time...")
        print("Press Ctrl+C to stop\n")
        
        try:
            with sd.InputStream(
                device=device_index,
                channels=1,
                samplerate=self.sample_rate,
                callback=self.audio_callback,
                blocksize=int(self.sample_rate * 0.5)  # 500ms blocks
            ):
                while self.is_running:
                    sd.sleep(100)
        
        except KeyboardInterrupt:
            self.is_running = False
            print("\nStopped listening")

# Usage
if __name__ == "__main__":
    transcriber = RealtimeSpeakerTranscriber(model_size="base")
    transcriber.start_listening()
