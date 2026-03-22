"""
Panchang and Festival Routes
Handles Hindu calendar (Panchang), festivals, and temples
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from typing import Optional
import math

from database import festivals_collection, temples_collection

router = APIRouter(prefix="/api", tags=["Panchang & Festivals"])

# Hindu calendar constants
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

# Major Hindu festivals
FESTIVALS = [
    {"name": "Makar Sankranti", "type": "solar", "month": 1, "day": 14, "description": "Sun enters Capricorn"},
    {"name": "Vasant Panchami", "type": "lunar", "month": "Magha", "paksha": "Shukla", "tithi": 5, "description": "Saraswati Puja"},
    {"name": "Maha Shivaratri", "type": "lunar", "month": "Phalguna", "paksha": "Krishna", "tithi": 14, "description": "Night of Shiva"},
    {"name": "Holi", "type": "lunar", "month": "Phalguna", "paksha": "Shukla", "tithi": 15, "description": "Festival of Colors"},
    {"name": "Ugadi/Gudi Padwa", "type": "lunar", "month": "Chaitra", "paksha": "Shukla", "tithi": 1, "description": "New Year"},
    {"name": "Ram Navami", "type": "lunar", "month": "Chaitra", "paksha": "Shukla", "tithi": 9, "description": "Lord Rama's birthday"},
    {"name": "Hanuman Jayanti", "type": "lunar", "month": "Chaitra", "paksha": "Shukla", "tithi": 15, "description": "Hanuman's birthday"},
    {"name": "Akshaya Tritiya", "type": "lunar", "month": "Vaishakha", "paksha": "Shukla", "tithi": 3, "description": "Eternal prosperity day"},
    {"name": "Buddha Purnima", "type": "lunar", "month": "Vaishakha", "paksha": "Shukla", "tithi": 15, "description": "Buddha's birthday"},
    {"name": "Guru Purnima", "type": "lunar", "month": "Ashadha", "paksha": "Shukla", "tithi": 15, "description": "Honoring teachers"},
    {"name": "Raksha Bandhan", "type": "lunar", "month": "Shravana", "paksha": "Shukla", "tithi": 15, "description": "Brother-sister bond"},
    {"name": "Krishna Janmashtami", "type": "lunar", "month": "Bhadrapada", "paksha": "Krishna", "tithi": 8, "description": "Lord Krishna's birthday"},
    {"name": "Ganesh Chaturthi", "type": "lunar", "month": "Bhadrapada", "paksha": "Shukla", "tithi": 4, "description": "Ganesha festival"},
    {"name": "Navratri", "type": "lunar", "month": "Ashwin", "paksha": "Shukla", "tithi": 1, "description": "Nine nights of Devi"},
    {"name": "Dussehra", "type": "lunar", "month": "Ashwin", "paksha": "Shukla", "tithi": 10, "description": "Victory of good over evil"},
    {"name": "Karwa Chauth", "type": "lunar", "month": "Kartik", "paksha": "Krishna", "tithi": 4, "description": "Wife's fast for husband"},
    {"name": "Dhanteras", "type": "lunar", "month": "Kartik", "paksha": "Krishna", "tithi": 13, "description": "Diwali begins"},
    {"name": "Diwali", "type": "lunar", "month": "Kartik", "paksha": "Krishna", "tithi": 15, "description": "Festival of Lights"},
    {"name": "Govardhan Puja", "type": "lunar", "month": "Kartik", "paksha": "Shukla", "tithi": 1, "description": "Day after Diwali"},
    {"name": "Bhai Dooj", "type": "lunar", "month": "Kartik", "paksha": "Shukla", "tithi": 2, "description": "Brother's Day"}
]


# Astronomical calculation helpers
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
    """Approximate Hindu month based on Sun's position"""
    sun_long = get_sun_longitude(jd)
    month_index = int((sun_long + 360 - 23) / 30) % 12
    return HINDU_MONTHS[month_index]


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
        first_day = datetime(year, month, 1)
        days_in_month = (next_month - first_day).days
        
        month_data = []
        for day in range(1, days_in_month + 1):
            jd = get_julian_day(year, month, day)
            tithi = calculate_tithi(jd)
            nakshatra = calculate_nakshatra(jd)
            weekday = datetime(year, month, day).weekday()
            vara_index = (weekday + 1) % 7
            
            month_data.append({
                "date": f"{year}-{month:02d}-{day:02d}",
                "day": day,
                "weekday": VARAS[vara_index],
                "tithi": tithi["name"],
                "paksha": tithi["paksha"],
                "nakshatra": nakshatra["name"]
            })
        
        return {
            "status": "ok",
            "year": year,
            "month": month,
            "month_name": datetime(year, month, 1).strftime("%B"),
            "days": month_data
        }
    except Exception as e:
        print(f"Month Panchang error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get month Panchang: {str(e)}")


# ===================== FESTIVAL ROUTES =====================

@router.get("/festivals/upcoming")
async def get_upcoming_festivals(limit: int = 10):
    """Get upcoming Hindu festivals"""
    try:
        now = datetime.now()
        current_year = now.year
        
        upcoming = []
        
        for year in [current_year, current_year + 1]:
            for festival in FESTIVALS:
                try:
                    if festival["type"] == "solar":
                        fest_date = datetime(year, festival["month"], festival["day"])
                    else:
                        lunar_month_map = {
                            "Chaitra": (3, 22), "Vaishakha": (4, 21), "Jyeshtha": (5, 22),
                            "Ashadha": (6, 22), "Shravana": (7, 23), "Bhadrapada": (8, 23),
                            "Ashwin": (9, 23), "Kartik": (10, 23), "Margashirsha": (11, 22),
                            "Pausha": (12, 22), "Magha": (1, 20), "Phalguna": (2, 19)
                        }
                        
                        base_month, base_day = lunar_month_map.get(festival["month"], (1, 1))
                        tithi_offset = festival["tithi"] - 1
                        if festival["paksha"] == "Krishna":
                            tithi_offset += 15
                        
                        adj_year = year if base_month > 2 else year
                        if festival["month"] in ["Magha", "Phalguna"] and base_month <= 2:
                            adj_year = year + 1
                            
                        fest_date = datetime(adj_year, base_month, base_day) + timedelta(days=tithi_offset)
                    
                    if fest_date >= now:
                        days_until = (fest_date - now).days
                        upcoming.append({
                            "name": festival["name"],
                            "date": fest_date.strftime("%Y-%m-%d"),
                            "display_date": fest_date.strftime("%B %d, %Y"),
                            "day_name": fest_date.strftime("%A"),
                            "description": festival["description"],
                            "days_until": days_until,
                            "is_today": days_until == 0,
                            "is_tomorrow": days_until == 1
                        })
                except:
                    continue
        
        upcoming.sort(key=lambda x: x["date"])
        upcoming = upcoming[:limit]
        
        return {
            "status": "ok",
            "count": len(upcoming),
            "festivals": upcoming
        }
    except Exception as e:
        print(f"Festivals error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get festivals: {str(e)}")


@router.get("/festivals/year/{year}")
async def get_year_festivals(year: int):
    """Get all festivals for a specific year"""
    try:
        festivals_list = []
        
        for festival in FESTIVALS:
            try:
                if festival["type"] == "solar":
                    fest_date = datetime(year, festival["month"], festival["day"])
                else:
                    lunar_month_map = {
                        "Chaitra": (3, 22), "Vaishakha": (4, 21), "Jyeshtha": (5, 22),
                        "Ashadha": (6, 22), "Shravana": (7, 23), "Bhadrapada": (8, 23),
                        "Ashwin": (9, 23), "Kartik": (10, 23), "Margashirsha": (11, 22),
                        "Pausha": (12, 22), "Magha": (1, 20), "Phalguna": (2, 19)
                    }
                    
                    base_month, base_day = lunar_month_map.get(festival["month"], (1, 1))
                    tithi_offset = festival["tithi"] - 1
                    if festival["paksha"] == "Krishna":
                        tithi_offset += 15
                    
                    adj_year = year if base_month > 2 else year
                    if festival["month"] in ["Magha", "Phalguna"] and base_month <= 2:
                        adj_year = year + 1
                        
                    fest_date = datetime(adj_year, base_month, base_day) + timedelta(days=tithi_offset)
                
                festivals_list.append({
                    "name": festival["name"],
                    "date": fest_date.strftime("%Y-%m-%d"),
                    "display_date": fest_date.strftime("%B %d, %Y"),
                    "day_name": fest_date.strftime("%A"),
                    "description": festival["description"]
                })
            except:
                continue
        
        festivals_list.sort(key=lambda x: x["date"])
        
        return {
            "status": "ok",
            "year": year,
            "count": len(festivals_list),
            "festivals": festivals_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/festivals")
async def get_all_festivals():
    """Get all festivals from database"""
    cursor = festivals_collection.find({"is_active": {"$ne": False}}, {"_id": 0})
    festivals = await cursor.to_list(length=100)
    return {"status": "ok", "festivals": festivals, "count": len(festivals)}


# ===================== TEMPLE ROUTES =====================

@router.get("/temples")
async def get_all_temples():
    """Get all temples from database"""
    cursor = temples_collection.find({"is_active": {"$ne": False}}, {"_id": 0})
    temples = await cursor.to_list(length=100)
    return {"status": "ok", "temples": temples, "count": len(temples)}
