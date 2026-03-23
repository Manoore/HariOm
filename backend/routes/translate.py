"""
Translation API Routes
Handles text translation using free translation services
"""
from fastapi import APIRouter, Request
import httpx
import urllib.parse

router = APIRouter(prefix="/api", tags=["Translation"])


@router.post("/translate")
async def translate_text(request: Request):
    """Translate text using FREE translation APIs"""
    try:
        body = await request.json()
        text = body.get("text", "")
        target_lang = body.get("target_lang") or body.get("target_language", "en")
        
        if not text:
            return {"status": "error", "message": "No text provided"}
        
        # Try Google Translate free endpoint (no API key needed)
        try:
            async with httpx.AsyncClient() as client:
                encoded_text = urllib.parse.quote(text[:1500])
                url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl={target_lang}&dt=t&q={encoded_text}"
                
                response = await client.get(url, timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    # Google returns nested arrays: [[["translated text","original text",...]]]
                    if data and isinstance(data, list) and data[0]:
                        translated_parts = []
                        for part in data[0]:
                            if part and part[0]:
                                translated_parts.append(part[0])
                        translated = "".join(translated_parts)
                        if translated:
                            return {
                                "status": "ok",
                                "original": text,
                                "translated": translated,
                                "target_lang": target_lang,
                                "provider": "google-free"
                            }
        except Exception as e:
            print(f"Google free translate failed: {e}")
        
        # Fallback: MyMemory API (FREE - 5000 words/day)
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.mymemory.translated.net/get",
                    params={
                        "q": text[:500],
                        "langpair": f"hi|{target_lang}"
                    },
                    timeout=10.0
                )
                data = response.json()
                
                if data.get("responseStatus") == 200:
                    translated = data.get("responseData", {}).get("translatedText", "")
                    if translated:
                        return {
                            "status": "ok",
                            "original": text,
                            "translated": translated,
                            "target_lang": target_lang,
                            "provider": "mymemory"
                        }
        except Exception as e:
            print(f"MyMemory translate failed: {e}")
        
        return {"status": "error", "message": "Translation services unavailable. Please try again."}
    except Exception as e:
        print(f"Translation error: {e}")
        return {"status": "error", "message": "Translation failed"}
