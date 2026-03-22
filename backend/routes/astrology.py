"""
Astrology and Horoscope Routes
Handles horoscope, panchang, kundali, and other Vedic astrology services
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
from bson import ObjectId
import math

from database import users_collection
from auth import get_current_user, get_optional_user

router = APIRouter(prefix="/api", tags=["Astrology"])

# Try to import prokerala module
try:
    import prokerala
    PROKERALA_AVAILABLE = True
except ImportError:
    PROKERALA_AVAILABLE = False
    print("Warning: prokerala module not available")

# Pydantic models
class KundaliRequest(BaseModel):
    datetime: str  # ISO format: 2004-02-12T15:19:21+05:30
    latitude: float
    longitude: float
    ayanamsa: int = 1

class KundaliMatchingRequest(BaseModel):
    bride_datetime: str
    bride_latitude: float
    bride_longitude: float
    groom_datetime: str
    groom_latitude: float
    groom_longitude: float
    ayanamsa: int = 1

class BirthDetails(BaseModel):
    date_of_birth: str
    time_of_birth: str
    place_of_birth: str

# Constants for Panchang calculations
TITHI_NAMES = [
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
    "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
    "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima/Amavasya"
]

NAKSHATRA_NAMES = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
    "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha",
    "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha",
    "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada",
    "Uttara Bhadrapada", "Revati"
]

YOGA_NAMES = [
    "Vishkumbha", "Preeti", "Ayushman", "Saubhagya", "Shobhana",
    "Atiganda", "Sukarman", "Dhriti", "Shula", "Ganda",
    "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra",
    "Siddhi", "Vyatipata", "Variyan", "Parigha", "Shiva",
    "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma",
    "Indra", "Vaidhriti"
]

KARANA_NAMES = [
    "Bava", "Balava", "Kaulava", "Taitila", "Garija",
    "Vanija", "Vishti", "Shakuni", "Chatushpada", "Nagava", "Kimstughna"
]

VARAS = ["Ravivara", "Somavara", "Mangalavara", "Budhavara", "Guruvara", "Shukravara", "Shanivara"]
VARA_DEITIES = ["Surya", "Chandra", "Mangala", "Budha", "Guru", "Shukra", "Shani"]

HINDU_MONTHS = [
    "Chaitra", "Vaishakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada",
    "Ashwina", "Kartika", "Margashirsha", "Pausha", "Magha", "Phalguna"
]


# Helper functions for astronomical calculations
def get_julian_day(year, month, day, hour=12):
    """Calculate Julian Day Number"""
    if month <= 2:
        year -= 1
        month += 12
    
    A = int(year / 100)
    B = 2 - A + int(A / 4)
    
    jd = int(365.25 * (year + 4716)) + int(30.6001 * (month + 1)) + day + B - 1524.5
    jd += hour / 24.0
    return jd

def get_sun_longitude(jd):
    """Calculate Sun's longitude (simplified)"""
    T = (jd - 2451545.0) / 36525
    L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T
    M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T
    e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T
    
    M_rad = math.radians(M)
    C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * math.sin(M_rad)
    C += (0.019993 - 0.000101 * T) * math.sin(2 * M_rad)
    C += 0.000289 * math.sin(3 * M_rad)
    
    sun_long = (L0 + C) % 360
    return sun_long

def get_moon_longitude(jd):
    """Calculate Moon's longitude (simplified)"""
    T = (jd - 2451545.0) / 36525
    L0 = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T
    L0 = L0 % 360
    if L0 < 0:
        L0 += 360
    return L0

def calculate_tithi(jd):
    """Calculate Tithi (lunar day)"""
    sun_long = get_sun_longitude(jd)
    moon_long = get_moon_longitude(jd)
    diff = (moon_long - sun_long) % 360
    tithi_index = int(diff / 12)
    paksha = "Shukla" if tithi_index < 15 else "Krishna"
    tithi_num = (tithi_index % 15) + 1
    tithi_name = TITHI_NAMES[tithi_num - 1]
    return {"number": tithi_num, "name": tithi_name, "paksha": paksha}

def calculate_nakshatra(jd):
    """Calculate Nakshatra (lunar mansion)"""
    moon_long = get_moon_longitude(jd)
    nakshatra_index = int(moon_long / (360 / 27))
    nakshatra_name = NAKSHATRA_NAMES[nakshatra_index]
    pada = int((moon_long % (360 / 27)) / (360 / 108)) + 1
    return {"number": nakshatra_index + 1, "name": nakshatra_name, "pada": pada}

def calculate_yoga(jd):
    """Calculate Yoga"""
    sun_long = get_sun_longitude(jd)
    moon_long = get_moon_longitude(jd)
    yoga_long = (sun_long + moon_long) % 360
    yoga_index = int(yoga_long / (360 / 27))
    yoga_name = YOGA_NAMES[yoga_index]
    return {"number": yoga_index + 1, "name": yoga_name}

def calculate_karana(jd):
    """Calculate Karana (half of Tithi)"""
    sun_long = get_sun_longitude(jd)
    moon_long = get_moon_longitude(jd)
    diff = (moon_long - sun_long) % 360
    karana_index = int(diff / 6) % 11
    karana_name = KARANA_NAMES[karana_index]
    return {"number": karana_index + 1, "name": karana_name}

def get_hindu_month(jd):
    """Get Hindu month based on Sun's position"""
    sun_long = get_sun_longitude(jd)
    month_index = int((sun_long + 360 - 23) / 30) % 12
    return HINDU_MONTHS[month_index]

def generate_birth_chart(date_of_birth: str, time_of_birth: str, place_of_birth: str):
    """Generate a basic birth chart"""
    return {
        "date_of_birth": date_of_birth,
        "time_of_birth": time_of_birth,
        "place_of_birth": place_of_birth,
        "chart_type": "North Indian",
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


# ===================== PANCHANG ROUTES =====================

@router.get("/panchang/today")
async def get_today_panchang(lat: float = 28.6139, lon: float = 77.2090):
    """Get today's Panchang (Hindu calendar details)"""
    try:
        now = datetime.now()
        jd = get_julian_day(now.year, now.month, now.day)
        
        tithi = calculate_tithi(jd)
        nakshatra = calculate_nakshatra(jd)
        yoga = calculate_yoga(jd)
        karana = calculate_karana(jd)
        hindu_month = get_hindu_month(jd)
        weekday = now.weekday()
        vara_index = (weekday + 1) % 7
        
        sunrise = "06:15"
        sunset = "18:30"
        
        return {
            "status": "ok",
            "date": now.strftime("%Y-%m-%d"),
            "day_name": now.strftime("%A"),
            "hindu_month": hindu_month,
            "vara": {
                "name": VARAS[vara_index],
                "deity": VARA_DEITIES[vara_index]
            },
            "tithi": tithi,
            "nakshatra": nakshatra,
            "yoga": yoga,
            "karana": karana,
            "sunrise": sunrise,
            "sunset": sunset,
            "location": {"lat": lat, "lon": lon}
        }
    except Exception as e:
        print(f"Panchang error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate Panchang: {str(e)}")


@router.get("/panchang/month")
async def get_month_panchang(year: int = None, month: int = None):
    """Get Panchang for entire month"""
    try:
        now = datetime.now()
        year = year or now.year
        month = month or now.month
        
        if month == 12:
            next_month = datetime(year + 1, 1, 1)
        else:
            next_month = datetime(year, month + 1, 1)
        
        days_in_month = (next_month - datetime(year, month, 1)).days
        
        month_data = []
        for day in range(1, days_in_month + 1):
            jd = get_julian_day(year, month, day)
            day_date = datetime(year, month, day)
            weekday = day_date.weekday()
            vara_index = (weekday + 1) % 7
            
            month_data.append({
                "date": f"{year}-{month:02d}-{day:02d}",
                "day_name": day_date.strftime("%A"),
                "vara": VARAS[vara_index],
                "tithi": calculate_tithi(jd),
                "nakshatra": calculate_nakshatra(jd),
                "yoga": calculate_yoga(jd),
                "karana": calculate_karana(jd)
            })
        
        return {
            "year": year,
            "month": month,
            "hindu_month": get_hindu_month(get_julian_day(year, month, 15)),
            "days": month_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===================== HOROSCOPE ROUTES =====================

@router.get("/horoscope/daily/{zodiac_sign}")
async def get_daily_horoscope_api(zodiac_sign: str, lang: str = "en"):
    """Get daily horoscope for a zodiac sign"""
    if PROKERALA_AVAILABLE:
        try:
            horoscope = await prokerala.get_daily_horoscope(zodiac_sign.lower(), lang)
            rashi_info = prokerala.RASHI_NAMES.get(zodiac_sign.lower(), {})
            horoscope["sign_name_localized"] = rashi_info.get(lang, rashi_info.get("en", zodiac_sign.title()))
            return horoscope
        except Exception as e:
            print(f"Prokerala API error, using fallback: {e}")
            fallback = prokerala.get_fallback_horoscope(zodiac_sign.lower(), lang)
            return fallback
    else:
        # Return basic fallback without prokerala
        return {
            "sign": zodiac_sign.title(),
            "date": datetime.now().strftime("%Y-%m-%d"),
            "prediction": f"Today is a day of new opportunities for {zodiac_sign.title()}. Stay positive and embrace changes.",
            "lucky_number": 7,
            "lucky_color": "Blue"
        }


@router.get("/horoscope/personalized")
async def get_personalized_horoscope(user: dict = Depends(get_current_user)):
    """Get personalized daily horoscope based on user's nakshatra or DOB"""
    sign = None
    
    if PROKERALA_AVAILABLE:
        if user.get("nakshatra"):
            sign = prokerala.get_rashi_from_nakshatra(user["nakshatra"])
        
        if not sign and user.get("date_of_birth"):
            sign = prokerala.get_rashi_from_date(user["date_of_birth"])
    
    if not sign:
        sign = "aries"
    
    if PROKERALA_AVAILABLE:
        try:
            horoscope = await prokerala.get_daily_horoscope(sign)
            rashi_info = prokerala.RASHI_NAMES.get(sign, {"en": sign.title(), "hi": sign.title()})
            horoscope["user_sign"] = sign
            horoscope["user_sign_name"] = rashi_info["en"]
            horoscope["user_sign_hindi"] = rashi_info["hi"]
            horoscope["user_nakshatra"] = user.get("nakshatra")
            return horoscope
        except Exception as e:
            print(f"Error getting personalized horoscope: {e}")
            fallback = prokerala.get_fallback_horoscope(sign)
            fallback["user_sign"] = sign
            fallback["user_nakshatra"] = user.get("nakshatra")
            return fallback
    else:
        return {
            "sign": sign.title(),
            "user_sign": sign,
            "user_nakshatra": user.get("nakshatra"),
            "date": datetime.now().strftime("%Y-%m-%d"),
            "prediction": f"A positive day awaits you. Trust your instincts."
        }


@router.get("/horoscope/nakshatras")
async def get_nakshatras():
    """Get list of all 27 Nakshatras with their details"""
    nakshatras = [
        {"name": "Ashwini", "rashi": "Aries", "lord": "Ketu", "symbol": "Horse head"},
        {"name": "Bharani", "rashi": "Aries", "lord": "Venus", "symbol": "Yoni"},
        {"name": "Krittika", "rashi": "Aries/Taurus", "lord": "Sun", "symbol": "Razor"},
        {"name": "Rohini", "rashi": "Taurus", "lord": "Moon", "symbol": "Cart"},
        {"name": "Mrigashira", "rashi": "Taurus/Gemini", "lord": "Mars", "symbol": "Deer head"},
        {"name": "Ardra", "rashi": "Gemini", "lord": "Rahu", "symbol": "Teardrop"},
        {"name": "Punarvasu", "rashi": "Gemini/Cancer", "lord": "Jupiter", "symbol": "Bow"},
        {"name": "Pushya", "rashi": "Cancer", "lord": "Saturn", "symbol": "Flower"},
        {"name": "Ashlesha", "rashi": "Cancer", "lord": "Mercury", "symbol": "Serpent"},
        {"name": "Magha", "rashi": "Leo", "lord": "Ketu", "symbol": "Throne"},
        {"name": "Purva Phalguni", "rashi": "Leo", "lord": "Venus", "symbol": "Hammock"},
        {"name": "Uttara Phalguni", "rashi": "Leo/Virgo", "lord": "Sun", "symbol": "Bed"},
        {"name": "Hasta", "rashi": "Virgo", "lord": "Moon", "symbol": "Hand"},
        {"name": "Chitra", "rashi": "Virgo/Libra", "lord": "Mars", "symbol": "Pearl"},
        {"name": "Swati", "rashi": "Libra", "lord": "Rahu", "symbol": "Coral"},
        {"name": "Vishakha", "rashi": "Libra/Scorpio", "lord": "Jupiter", "symbol": "Archway"},
        {"name": "Anuradha", "rashi": "Scorpio", "lord": "Saturn", "symbol": "Lotus"},
        {"name": "Jyeshtha", "rashi": "Scorpio", "lord": "Mercury", "symbol": "Earring"},
        {"name": "Mula", "rashi": "Sagittarius", "lord": "Ketu", "symbol": "Root"},
        {"name": "Purva Ashadha", "rashi": "Sagittarius", "lord": "Venus", "symbol": "Fan"},
        {"name": "Uttara Ashadha", "rashi": "Sagittarius/Capricorn", "lord": "Sun", "symbol": "Tusk"},
        {"name": "Shravana", "rashi": "Capricorn", "lord": "Moon", "symbol": "Ear"},
        {"name": "Dhanishta", "rashi": "Capricorn/Aquarius", "lord": "Mars", "symbol": "Drum"},
        {"name": "Shatabhisha", "rashi": "Aquarius", "lord": "Rahu", "symbol": "Circle"},
        {"name": "Purva Bhadrapada", "rashi": "Aquarius/Pisces", "lord": "Jupiter", "symbol": "Sword"},
        {"name": "Uttara Bhadrapada", "rashi": "Pisces", "lord": "Saturn", "symbol": "Twins"},
        {"name": "Revati", "rashi": "Pisces", "lord": "Mercury", "symbol": "Fish"}
    ]
    return {"nakshatras": nakshatras}


@router.get("/horoscope/zodiac-signs")
async def get_zodiac_signs():
    """Get all zodiac signs with their details"""
    signs = [
        {"name": "Aries", "symbol": "Ram", "element": "Fire", "dates": "Mar 21 - Apr 19"},
        {"name": "Taurus", "symbol": "Bull", "element": "Earth", "dates": "Apr 20 - May 20"},
        {"name": "Gemini", "symbol": "Twins", "element": "Air", "dates": "May 21 - Jun 20"},
        {"name": "Cancer", "symbol": "Crab", "element": "Water", "dates": "Jun 21 - Jul 22"},
        {"name": "Leo", "symbol": "Lion", "element": "Fire", "dates": "Jul 23 - Aug 22"},
        {"name": "Virgo", "symbol": "Virgin", "element": "Earth", "dates": "Aug 23 - Sep 22"},
        {"name": "Libra", "symbol": "Scales", "element": "Air", "dates": "Sep 23 - Oct 22"},
        {"name": "Scorpio", "symbol": "Scorpion", "element": "Water", "dates": "Oct 23 - Nov 21"},
        {"name": "Sagittarius", "symbol": "Archer", "element": "Fire", "dates": "Nov 22 - Dec 21"},
        {"name": "Capricorn", "symbol": "Goat", "element": "Earth", "dates": "Dec 22 - Jan 19"},
        {"name": "Aquarius", "symbol": "Water Bearer", "element": "Air", "dates": "Jan 20 - Feb 18"},
        {"name": "Pisces", "symbol": "Fish", "element": "Water", "dates": "Feb 19 - Mar 20"},
    ]
    return {"signs": signs}


@router.post("/horoscope/birth-chart")
async def generate_birth_chart_api(data: BirthDetails, user: dict = Depends(get_optional_user)):
    """Generate birth chart based on birth details"""
    chart = generate_birth_chart(data.date_of_birth, data.time_of_birth, data.place_of_birth)
    
    if user:
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"birth_chart": chart, "birth_details": data.dict()}}
        )
    
    return chart


# ===================== ASTROLOGY ROUTES =====================

@router.post("/astrology/birth-kundali")
async def get_birth_kundali(data: KundaliRequest, user: dict = Depends(get_optional_user)):
    """Get birth kundali (birth chart) using Prokerala API"""
    if not PROKERALA_AVAILABLE:
        raise HTTPException(status_code=503, detail="Astrology service temporarily unavailable")
    
    try:
        result = await prokerala.get_birth_kundali(
            data.datetime,
            data.latitude,
            data.longitude,
            data.ayanamsa
        )
        
        if user:
            await users_collection.update_one(
                {"_id": user["_id"]},
                {"$set": {
                    "birth_kundali": result,
                    "birth_coordinates": {"lat": data.latitude, "lon": data.longitude}
                }}
            )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/astrology/kundali-matching")
async def get_kundali_matching(data: KundaliMatchingRequest, user: dict = Depends(get_optional_user)):
    """Get kundali matching for marriage compatibility"""
    if not PROKERALA_AVAILABLE:
        raise HTTPException(status_code=503, detail="Astrology service temporarily unavailable")
    
    try:
        result = await prokerala.get_kundali_matching(
            data.bride_datetime,
            data.bride_latitude,
            data.bride_longitude,
            data.groom_datetime,
            data.groom_latitude,
            data.groom_longitude,
            data.ayanamsa
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/astrology/panchang")
async def get_panchang(
    latitude: float = Query(default=28.6139),
    longitude: float = Query(default=77.2090)
):
    """Get today's Panchang (Hindu calendar)"""
    if not PROKERALA_AVAILABLE:
        # Fallback to local calculation
        return await get_today_panchang(latitude, longitude)
    
    try:
        today = datetime.now(timezone.utc)
        datetime_str = today.strftime("%Y-%m-%dT%H:%M:%S+00:00")
        
        result = await prokerala.get_panchang(datetime_str, latitude, longitude)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/astrology/mangal-dosha")
async def check_mangal_dosha(data: KundaliRequest, user: dict = Depends(get_optional_user)):
    """Check for Mangal Dosha (Mars affliction)"""
    if not PROKERALA_AVAILABLE:
        raise HTTPException(status_code=503, detail="Astrology service temporarily unavailable")
    
    try:
        result = await prokerala.get_mangal_dosha(
            data.datetime,
            data.latitude,
            data.longitude
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
