import google.generativeai as genai
from dotenv import load_dotenv
import os
import time
from google.generativeai.types import HarmCategory, HarmBlockThreshold
# --- 1. Load Environment & Configure API ---
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("❌ GEMINI_API_KEY not found in .env file.")

genai.configure(api_key=api_key)

# --- 2. DEFINE YOUR "GOLDEN PROMPT" (System Instruction) ---
# This is the most important part of your job.
# It tells the AI its role and all the rules.
THE_GOLDEN_PROMPT = """
You are an AI assistant for Deaf and Hard-of-Hearing (DHH) users.
Your single job is to translate and simplify a raw speech transcription into a "Deaf-Friendly" caption.

RULES:
1.  **Task:** First, translate the [Raw Text] into the [Target Language].
2.  **Simplify:** After translating, simplify the text.
3.  **Simplicity Style:** Use short, simple sentences. Use 5th-grade level vocabulary.
4.  **Remove Fillers:** Delete all filler words (like "um", "ah", "uh", "you know") and stutters.
5.  **Be Direct:** Use Subject-Verb-Object sentence structure (e.g., "The man pets the dog.").
6.  **No New Info:** Do NOT add any information that wasn't in the original text.
7.  **CRITICAL:** Respond ONLY with the final, simplified caption. Do NOT add any extra phrases like "Here is the simplified text:" or "Here is your caption:". Just return the caption.
"""

# --- 3. INITIALIZE THE MODEL ---
# We use the exact model name that worked in your test.
# We also set the system_instruction, so the AI always follows our rules.
try:
    model = genai.GenerativeModel(
        model_name="models/gemini-2.5-flash",  # Using the model you confirmed
        system_instruction=THE_GOLDEN_PROMPT
    )
    print("✅ Model 'models/gemini-2.5-flash' loaded successfully.")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    print("Trying fallback 'gemini-1.5-flash-latest'...")
    try:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash-latest",
            system_instruction=THE_GOLDEN_PROMPT
        )
        print("✅ Fallback model 'gemini-1.5-flash-latest' loaded.")
    except Exception as e2:
        print(f"❌ Fallback also failed: {e2}")
        exit()


# --- 4. CREATE YOUR "GOLDEN FUNCTION" ---
# This is the function your Backend teammate will call.
def get_friendly_caption(raw_text: str, target_language: str) -> str:
    """
    Takes raw transcribed text, translates and simplifies it
    using the Gemini API.
    """
    
    # We create the final prompt for the user
    prompt = f"[Raw Text]: \"{raw_text}\"\n[Target Language]: \"{target_language}\""
    
    # --- UPDATED: Use Enums for Safety Settings ---
    # This is the robust way to turn filters off.
    safety_settings = {
        HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
    }

    try:
        # Start a timer (good for testing latency)
        start_time = time.time()
        
        response = model.generate_content(
            prompt, 
            safety_settings=safety_settings
        )
        
        end_time = time.time()
        
        # --- UPDATED: Better Error Checking ---
        # Instead of a simple try/except, we check the response object.
        
        # Check if the response was blocked *before* trying to access .text
        if not response.candidates:
            if response.prompt_feedback.block_reason:
                print(f"--- ‼️ AI Task FAILED (Prompt Blocked) ---")
                print(f"Reason: {response.prompt_feedback.block_reason}")
            else:
                print(f"--- ‼️ AI Task FAILED (Unknown Reason) ---")
            return raw_text # Return original on failure

        # Check if the *generated response* was blocked
        if response.candidates[0].finish_reason == 'SAFETY':
            print(f"--- ‼️ AI Task FAILED (Response Blocked) ---")
            print(f"Safety Ratings: {response.candidates[0].safety_ratings}")
            return raw_text

        # --- If everything is OK, print and return ---
        print(f"\n--- AI Task ---")
        print(f"Raw: {raw_text}")
        print(f"Target: {target_language}")
        print(f"Simple: {response.text.strip()}")
        print(f"Time: {end_time - start_time:.2f}s")
        print("---------------")
        
        return response.text.strip()
    
    except Exception as e:
        # This is a fallback for other unexpected errors
        print(f"--- ‼️ AI Task CRASHED ---")
        print(f"Error: {e}")
        return raw_text
# --- 5. TEST YOUR FUNCTION ---
# This `if __name__ == "__main__":` block only runs
# when you execute this file directly (e.g., `python simplifier.py`)
if __name__ == "__main__":
    print("\n--- Running Local Test ---")
    
    # Test 1: Complex English -> Simple English
    test_1_raw = "Uh, notwithstanding the, you know, the significant meteorological challenges, the team endeavored to persevere."
    get_friendly_caption(test_1_raw, "English")

    # Test 2: English -> Simple Hindi
    test_2_raw = "I would like to inform you that the meeting has been postponed until 3 PM tomorrow."
    get_friendly_caption(test_2_raw, "Hindi")
    
    # Test 3: Hinglish -> Simple Hindi
    test_3_raw = "Toh, matlab, hum log kal jaa rahe hain, you know, market mein shopping karne."
    get_friendly_caption(test_3_raw, "Hindi")

    print("\n--- Local Test Complete ---")