import groq
from dotenv import load_dotenv
import os
import time

# --- 1. Load Environment & Configure API ---
load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("❌ GROQ_API_KEY not found in .env file.")

client = groq.Groq(api_key=api_key)

# We use Llama 3 - it's fast and smart.
MODEL_NAME = "llama-3.1-8b-instant"
# --- 2. DEFINE YOUR "GOLDEN PROMPT" (System Instruction) ---
# THIS IS YOUR MOST IMPORTANT "MATERIAL".
# Your job is to test and edit this prompt until the output is perfect.
THE_GOLDEN_PROMPT = """
You are an AI assistant for Deaf and Hard-of-Hearing (DHH) users.
Your single job is to translate and simplify a raw speech transcription into a "Deaf-Friendly" caption.

RULES:
1.  **Task:** First, translate the [Raw Text] into the [Target Language].
2.  **Simplify:** After translating, simplify the text.
3.  **Simplicity Style:** Use short, simple sentences. Use 5th-grade level vocabulary.
4.  **Remove Fillers:** Delete all filler words (like "um", "ah", "uh", "you know") and stutters.
5.  **Be Direct:** Use Subject-Verb-Object sentence structure.
6.  **No New Info:** Do NOT add any information that wasn't in the original text.
7.  **CRITICAL:** Respond ONLY with the final, simplified caption. Do NOT add any extra phrases like "Here is the simplified text:" or "Here is your caption:". Just return the caption.
"""

# --- 3. CREATE YOUR "GOLDEN FUNCTION" ---
# This is the function your Backend teammate will call.
def get_friendly_caption(raw_text: str, target_language: str) -> str:
    """
    Takes raw transcribed text, translates and simplifies it
    using the Groq API (Llama 3).
    """
    
    # We create the final prompt for the user
    prompt = f"[Raw Text]: \"{raw_text}\"\n[Target Language]: \"{target_language}\""
    
    try:
        start_time = time.time()
        
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": THE_GOLDEN_PROMPT,
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model=MODEL_NAME,
            temperature=0.2, # Low temp = more factual, less creative
            max_tokens=1024,
        )
        
        end_time = time.time()
        
        response_text = chat_completion.choices[0].message.content.strip()
        
        print(f"\n--- AI Task (GROQ) ---")
        print(f"Raw: {raw_text}")
        print(f"Target: {target_language}")
        print(f"Simple: {response_text}")
        print(f"Time: {end_time - start_time:.2f}s")
        print("------------------------")
        
        return response_text
    
    except Exception as e:
        print(f"Error during Groq API call: {e}")
        return raw_text # Return original text on failure

# --- 4. YOUR TEST BENCH ---
# Run this file directly to test your changes to the Golden Prompt.
if __name__ == "__main__":
    print(f"\n--- Running Local Test (Groq / {MODEL_NAME}) ---")
    
    # Test 1: Complex English -> Simple English
    test_1 = "Uh, notwithstanding the, you know, the significant meteorological challenges, the team endeavored to persevere."
    get_friendly_caption(test_1, "English")

    # Test 2: English -> Simple Hindi
    test_2 = "I would like to inform you that the meeting has been postponed until 3 PM tomorrow."
    get_friendly_caption(test_2, "Hindi")
    
    # Test 3: Hinglish -> Simple Hindi
    test_3 = "Toh, matlab, hum log kal jaa rahe hain, you know, market mein shopping karne."
    get_friendly_caption(test_3, "Hindi")
    
    # Test 4: More complex Hinglish
    test_4 = "Actually, I was thinking, agar time hai, we should probably, like, submit the report."
    get_friendly_caption(test_4, "Hindi")
    
    # Test 5: English -> Simple Marathi
    test_5 = "The government has implemented a new policy regarding educational reforms."
    get_friendly_caption(test_5, "Marathi")

    print("\n--- Local Test Complete ---")