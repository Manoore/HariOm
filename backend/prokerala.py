"""
Prokerala API Integration for Astrology Services
- Birth Kundali (Birth Chart)
- Daily Horoscope
- Kundali Matching
"""
import os
import httpx
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import asyncio

PROKERALA_TOKEN_URL = "https://api.prokerala.com/token"
PROKERALA_API_BASE = "https://api.prokerala.com/v2/astrology"

# Cache for access token
_token_cache = {
    "access_token": None,
    "expires_at": None
}

async def get_access_token() -> str:
    """Get OAuth2 access token from Prokerala"""
    global _token_cache
    
    # Return cached token if still valid
    if _token_cache["access_token"] and _token_cache["expires_at"]:
        if datetime.now(timezone.utc).timestamp() < _token_cache["expires_at"] - 60:
            return _token_cache["access_token"]
    
    client_id = os.environ.get("PROKERALA_CLIENT_ID")
    client_secret = os.environ.get("PROKERALA_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        raise Exception("Prokerala API credentials not configured")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            PROKERALA_TOKEN_URL,
            data={
                "grant_type": "client_credentials",
                "client_id": client_id,
                "client_secret": client_secret
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"Failed to get Prokerala token: {response.text}")
        
        data = response.json()
        _token_cache["access_token"] = data["access_token"]
        _token_cache["expires_at"] = datetime.now(timezone.utc).timestamp() + data.get("expires_in", 3600)
        
        return data["access_token"]

async def make_prokerala_request(endpoint: str, params: Dict[str, Any]) -> Dict:
    """Make authenticated request to Prokerala API"""
    token = await get_access_token()
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{PROKERALA_API_BASE}/{endpoint}",
            params=params,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code != 200:
            print(f"Prokerala API error: {response.status_code} - {response.text}")
            raise Exception(f"Prokerala API error: {response.text}")
        
        return response.json()

# Nakshatra to Rashi (Moon Sign) mapping
NAKSHATRA_TO_RASHI = {
    "Ashwini": "aries", "Bharani": "aries", "Krittika": "aries",
    "Rohini": "taurus", "Mrigashira": "taurus",
    "Ardra": "gemini", "Punarvasu": "gemini",
    "Pushya": "cancer", "Ashlesha": "cancer",
    "Magha": "leo", "Purva Phalguni": "leo",
    "Uttara Phalguni": "virgo", "Hasta": "virgo", "Chitra": "virgo",
    "Swati": "libra", "Vishakha": "libra",
    "Anuradha": "scorpio", "Jyeshtha": "scorpio",
    "Mula": "sagittarius", "Purva Ashadha": "sagittarius",
    "Uttara Ashadha": "capricorn", "Shravana": "capricorn",
    "Dhanishta": "aquarius", "Shatabhisha": "aquarius",
    "Purva Bhadrapada": "pisces", "Uttara Bhadrapada": "pisces", "Revati": "pisces"
}

# Rashi names in different languages
RASHI_NAMES = {
    "aries": {"en": "Aries", "hi": "Mesh"},
    "taurus": {"en": "Taurus", "hi": "Vrishabh"},
    "gemini": {"en": "Gemini", "hi": "Mithun"},
    "cancer": {"en": "Cancer", "hi": "Karka"},
    "leo": {"en": "Leo", "hi": "Simha"},
    "virgo": {"en": "Virgo", "hi": "Kanya"},
    "libra": {"en": "Libra", "hi": "Tula"},
    "scorpio": {"en": "Scorpio", "hi": "Vrishchik"},
    "sagittarius": {"en": "Sagittarius", "hi": "Dhanu"},
    "capricorn": {"en": "Capricorn", "hi": "Makar"},
    "aquarius": {"en": "Aquarius", "hi": "Kumbh"},
    "pisces": {"en": "Pisces", "hi": "Meen"}
}

def get_rashi_from_nakshatra(nakshatra: str) -> Optional[str]:
    """Get rashi (zodiac sign) from nakshatra"""
    return NAKSHATRA_TO_RASHI.get(nakshatra)

def get_rashi_from_date(date_str: str) -> str:
    """Get western zodiac sign from date of birth"""
    try:
        date = datetime.strptime(date_str, "%Y-%m-%d")
        month = date.month
        day = date.day
        
        if (month == 3 and day >= 21) or (month == 4 and day <= 19):
            return "aries"
        elif (month == 4 and day >= 20) or (month == 5 and day <= 20):
            return "taurus"
        elif (month == 5 and day >= 21) or (month == 6 and day <= 20):
            return "gemini"
        elif (month == 6 and day >= 21) or (month == 7 and day <= 22):
            return "cancer"
        elif (month == 7 and day >= 23) or (month == 8 and day <= 22):
            return "leo"
        elif (month == 8 and day >= 23) or (month == 9 and day <= 22):
            return "virgo"
        elif (month == 9 and day >= 23) or (month == 10 and day <= 22):
            return "libra"
        elif (month == 10 and day >= 23) or (month == 11 and day <= 21):
            return "scorpio"
        elif (month == 11 and day >= 22) or (month == 12 and day <= 21):
            return "sagittarius"
        elif (month == 12 and day >= 22) or (month == 1 and day <= 19):
            return "capricorn"
        elif (month == 1 and day >= 20) or (month == 2 and day <= 18):
            return "aquarius"
        else:
            return "pisces"
    except:
        return "aries"

async def get_daily_horoscope(sign: str) -> Dict:
    """Get daily horoscope for a zodiac sign"""
    try:
        # Get today's date in ISO format
        today = datetime.now(timezone.utc)
        datetime_str = today.strftime("%Y-%m-%dT%H:%M:%S+00:00")
        
        params = {
            "datetime": datetime_str,
            "sign": sign.lower()
        }
        
        result = await make_prokerala_request("horoscope/daily", params)
        return result
    except Exception as e:
        print(f"Error getting daily horoscope: {e}")
        # Return fallback horoscope
        return get_fallback_horoscope(sign)

def get_fallback_horoscope(sign: str) -> Dict:
    """Return fallback horoscope data when API fails"""
    horoscopes = {
        "aries": {
            "prediction": "Today brings opportunities for new beginnings. Your natural leadership qualities will shine. Focus on personal goals and take initiative in your projects.",
            "lucky_number": 9,
            "lucky_color": "Red"
        },
        "taurus": {
            "prediction": "Financial matters look favorable today. Your patience and determination will be rewarded. Focus on stability and enjoy life's simple pleasures.",
            "lucky_number": 6,
            "lucky_color": "Green"
        },
        "gemini": {
            "prediction": "Communication is key today. Express your ideas clearly and connect with others. Your curiosity will lead to interesting discoveries.",
            "lucky_number": 5,
            "lucky_color": "Yellow"
        },
        "cancer": {
            "prediction": "Home and family matters take priority. Your intuition is strong - trust your instincts. Nurture your relationships and create comfort.",
            "lucky_number": 2,
            "lucky_color": "Silver"
        },
        "leo": {
            "prediction": "Your creativity and confidence are at their peak. Take center stage and share your talents. Romance and self-expression are highlighted.",
            "lucky_number": 1,
            "lucky_color": "Gold"
        },
        "virgo": {
            "prediction": "Focus on health and daily routines. Your analytical skills help solve problems. Pay attention to details and serve others with care.",
            "lucky_number": 5,
            "lucky_color": "Navy Blue"
        },
        "libra": {
            "prediction": "Relationships and partnerships are emphasized. Seek balance and harmony in all dealings. Your diplomatic skills are valuable today.",
            "lucky_number": 6,
            "lucky_color": "Pink"
        },
        "scorpio": {
            "prediction": "Transformation and deep insights await. Your determination helps overcome obstacles. Embrace change and trust the process.",
            "lucky_number": 8,
            "lucky_color": "Maroon"
        },
        "sagittarius": {
            "prediction": "Adventure and learning call to you. Expand your horizons through travel or study. Your optimism inspires others.",
            "lucky_number": 3,
            "lucky_color": "Purple"
        },
        "capricorn": {
            "prediction": "Career and ambitions are highlighted. Your hard work brings recognition. Focus on long-term goals and maintain discipline.",
            "lucky_number": 8,
            "lucky_color": "Brown"
        },
        "aquarius": {
            "prediction": "Innovation and friendships are favored. Your unique ideas gain acceptance. Connect with like-minded people and embrace change.",
            "lucky_number": 4,
            "lucky_color": "Electric Blue"
        },
        "pisces": {
            "prediction": "Spirituality and creativity flow freely. Trust your dreams and intuition. Compassion and imagination guide your path.",
            "lucky_number": 7,
            "lucky_color": "Sea Green"
        }
    }
    
    sign_data = horoscopes.get(sign.lower(), horoscopes["aries"])
    rashi_info = RASHI_NAMES.get(sign.lower(), {"en": sign.title(), "hi": sign.title()})
    
    return {
        "data": {
            "daily_prediction": {
                "prediction": sign_data["prediction"],
                "lucky_number": sign_data["lucky_number"],
                "lucky_color": sign_data["lucky_color"]
            }
        },
        "sign": sign.lower(),
        "sign_name": rashi_info["en"],
        "sign_name_hindi": rashi_info["hi"]
    }

async def get_birth_kundali(
    datetime_str: str,
    latitude: float,
    longitude: float,
    ayanamsa: int = 1
) -> Dict:
    """Get birth kundali/chart"""
    try:
        params = {
            "datetime": datetime_str,
            "coordinates": f"{latitude},{longitude}",
            "ayanamsa": ayanamsa
        }
        
        result = await make_prokerala_request("kundli/advanced", params)
        return result
    except Exception as e:
        print(f"Error getting birth kundali: {e}")
        return {"error": str(e)}

async def get_kundali_matching(
    bride_datetime: str,
    bride_lat: float,
    bride_lon: float,
    groom_datetime: str,
    groom_lat: float,
    groom_lon: float,
    ayanamsa: int = 1
) -> Dict:
    """Get kundali matching (horoscope matching) for marriage"""
    try:
        params = {
            "girl_dob": bride_datetime,
            "girl_coordinates": f"{bride_lat},{bride_lon}",
            "boy_dob": groom_datetime,
            "boy_coordinates": f"{groom_lat},{groom_lon}",
            "ayanamsa": ayanamsa
        }
        
        result = await make_prokerala_request("kundli-matching/advanced", params)
        return result
    except Exception as e:
        print(f"Error getting kundali matching: {e}")
        return {"error": str(e)}

async def get_panchang(datetime_str: str, latitude: float, longitude: float) -> Dict:
    """Get Panchang (Hindu calendar) for a date and location"""
    try:
        params = {
            "datetime": datetime_str,
            "coordinates": f"{latitude},{longitude}",
            "ayanamsa": 1
        }
        
        result = await make_prokerala_request("panchang/advanced", params)
        return result
    except Exception as e:
        print(f"Error getting panchang: {e}")
        return {"error": str(e)}

async def get_mangal_dosha(datetime_str: str, latitude: float, longitude: float) -> Dict:
    """Check for Mangal Dosha (Mars affliction)"""
    try:
        params = {
            "datetime": datetime_str,
            "coordinates": f"{latitude},{longitude}",
            "ayanamsa": 1
        }
        
        result = await make_prokerala_request("mangal-dosha", params)
        return result
    except Exception as e:
        print(f"Error checking mangal dosha: {e}")
        return {"error": str(e)}
