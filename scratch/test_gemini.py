import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv('backend/.env')

def test_gemini():
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("No API key found")
        return

    client = genai.Client(api_key=api_key)
    
    prompt = """Extract or generate accurate book metadata for: https://www.goodreads.com/book/show/61065355-the-boys-from-biloxi
    
    Return a JSON object with:
    {
        "title": "Book Title",
        "author": "Author Name",
        "description": "Full description",
        "genre": "one of: fiction, non-fiction, science, history, biography, fantasy, mystery, romance, sci-fi, thriller, self-help, philosophy, classics, other",
        "rating": 4.5,
        "reviews_count": 1000
    }"""

    try:
        print("Calling Gemini...")
        response = client.models.generate_content(
            model='models/gemini-2.5-flash-lite',
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=1500,
                temperature=0.2,
                response_mime_type='application/json',
            ),
        )
        print("Response received!")
        raw_text = response.text
        print(f"Raw text start: {raw_text[:100]}...")
        print(f"Full text: {raw_text}")
        
        try:
            data = json.loads(raw_text)
            print("Successfully parsed JSON:")
            print(json.dumps(data, indent=2))
        except Exception as je:
            print(f"JSON Parse Error: {je}")
            
    except Exception as e:
        print(f"API Error: {e}")

if __name__ == "__main__":
    test_gemini()
