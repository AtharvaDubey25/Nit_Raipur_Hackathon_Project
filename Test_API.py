import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load .env file
load_dotenv()

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("❌ GEMINI_API_KEY not found in .env file.")

genai.configure(api_key=api_key)

# Use the latest low-latency model
MODEL_NAME = "models/gemini-2.5-flash"

print(f"🔍 Using model: {MODEL_NAME}")
print("Sending 'Hello' to Gemini...")

model = genai.GenerativeModel(MODEL_NAME)

# Generate a simple response
response = model.generate_content("Hello, world!")

print("\n--- Response ---")
print(response.text)
print("----------------")
print("✅ API Test Successful!")
