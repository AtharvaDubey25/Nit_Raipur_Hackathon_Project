🌐 Clario — Real-Time Speech & Online Audio Simplifier

🏆 Built for NIT Raipur Hackathon 2025
Empowering Deaf and Hard-of-Hearing users through AI-powered transcription, simplification, and translation — from live speech and online audio platforms like YouTube.

🚀 Overview

Clario is an AI-powered accessibility project designed to make spoken content understandable to everyone — including DHH (Deaf and Hard-of-Hearing) individuals.
It captures speech or online audio (e.g., YouTube, podcasts), converts it into text using Whisper, simplifies it using Groq’s LLM, and translates it into multiple Indian languages.

💬 In short:

“We simplify the world’s audio — from real-time conversations to YouTube videos — into easy, readable, and translated text.”

🌟 Key Features

✅ 🎙 Real-Time Speech Transcription
→ Converts live microphone input to text using Faster-Whisper, a lightweight and fast Whisper variant.

✅ 📺 YouTube & Platform Audio Translation
→ Supports transcription and simplification of YouTube videos, podcasts, and uploaded audio files using URL-based extraction.

✅ 🧠 AI Simplification
→ Uses Groq API to rephrase complex sentences into simple, clear language.

✅ 🌐 Translation Support
→ Integrates Google Translate API to output text in Indian languages like Hindi, Marathi, Tamil, Bengali, and more.

✅ 🖥️ Simple Web Interface
→ Users can upload or paste a link, and see simplified captions instantly in their chosen language.

✅ 🧩 Backend + Frontend Integration
→ Fully connected web stack: Flask backend hosted on Railway, frontend deployed on Netlify.

🧠 Tech Stack
Layer	Technology	Purpose
🎧 Audio Processing	sounddevice, yt-dlp, moviepy, faster-whisper	Capture + extract + transcribe
🧩 NLP Simplification	Groq API	Sentence simplification
🌍 Translation	Google Translate API	Multilingual text output
⚙️ Backend	Flask, Flask-CORS, Gunicorn	RESTful API
💻 Frontend	HTML, CSS, JavaScript	User interface
☁️ Deployment	Railway, Netlify	Scalable cloud hosting
🔧 Architecture Flow
          🎙 Live Speech / 🎥 YouTube URL
                         ↓
          🎧 Audio Extraction (yt-dlp / sounddevice)
                         ↓
              🧠 Transcription (Faster-Whisper)
                         ↓
            ✨ Simplification (Groq LLM API)
                         ↓
          🌍 Translation (Google Translate API)
                         ↓
               💬 Display on Frontend UI

🏗️ System Components
🖥️ Frontend (Netlify)

Upload or paste YouTube links

Choose target language

View simplified + translated captions in real time

⚙️ Backend (Railway)

Flask REST API

Endpoints:

/transcribe → handles live or uploaded audio

/simplify → simplifies sentences via Groq API

/translate → uses Google Translate API

Lightweight & scalable with gunicorn

🧩 Example Use-Cases
Scenario	Input	Output
Classroom	Teacher explaining complex topic	Simplified version in student’s native language
YouTube Lecture	YouTube link	Simplified + translated transcript
Podcast	Audio file	Easy-to-read text summary
Meeting	Microphone input	Real-time captioning and simplification
💡 Why Clario Stands Out

🔹 Multi-Source Support: Works with live mic input and online platforms like YouTube or podcasts.
🔹 Real-Time Performance: Thanks to Groq API and Faster-Whisper, response times are under a second.
🔹 Accessibility-First: Designed for Deaf and Hard-of-Hearing users, but useful for anyone wanting clarity.
🔹 Indian Language Focus: Localization for users across linguistic regions.
🔹 Hackathon-Ready Architecture: Simple deployment using open tools and cloud services.

🧰 Installation & Setup
Clone the Repo
git clone https://github.com/AtharvaDubey25/Nit_Raipur_Hackathon_Project.git
cd Nit_Raipur_Hackathon_Project

Create Virtual Environment
python -m venv venv
venv\Scripts\activate

Install Dependencies
pip install -r requirements.txt

Run Flask Backend
python main.py

Launch Frontend

Open index.html directly in your browser 
