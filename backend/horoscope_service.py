import httpx
from datetime import datetime
from typing import Optional

ZODIAC_SIGNS = [
    "aries", "taurus", "gemini", "cancer", "leo", "virgo",
    "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"
]

ZODIAC_DATES = [
    (3, 21, 4, 19, "aries"),
    (4, 20, 5, 20, "taurus"),
    (5, 21, 6, 20, "gemini"),
    (6, 21, 7, 22, "cancer"),
    (7, 23, 8, 22, "leo"),
    (8, 23, 9, 22, "virgo"),
    (9, 23, 10, 22, "libra"),
    (10, 23, 11, 21, "scorpio"),
    (11, 22, 12, 21, "sagittarius"),
    (12, 22, 1, 19, "capricorn"),
    (1, 20, 2, 18, "aquarius"),
    (2, 19, 3, 20, "pisces"),
]

DAILY_PREDICTIONS = {
    "aries": {
        "prediction": "Today brings exciting opportunities for leadership. Your natural courage will help you overcome any obstacles. Focus on new beginnings and trust your instincts.",
        "lucky_number": 9,
        "lucky_color": "Red",
        "mood": "Energetic",
        "compatibility": "Leo"
    },
    "taurus": {
        "prediction": "Financial matters look favorable today. Your patience and determination will pay off. Focus on building stability and enjoy life's pleasures.",
        "lucky_number": 6,
        "lucky_color": "Green",
        "mood": "Grounded",
        "compatibility": "Virgo"
    },
    "gemini": {
        "prediction": "Communication is your strength today. Express your ideas clearly and connect with others. New information may lead to exciting opportunities.",
        "lucky_number": 5,
        "lucky_color": "Yellow",
        "mood": "Curious",
        "compatibility": "Libra"
    },
    "cancer": {
        "prediction": "Emotional connections deepen today. Trust your intuition in personal matters. Home and family bring comfort and joy.",
        "lucky_number": 2,
        "lucky_color": "Silver",
        "mood": "Nurturing",
        "compatibility": "Scorpio"
    },
    "leo": {
        "prediction": "Your creative energy is at its peak. Express yourself boldly and let your light shine. Recognition for your efforts is coming.",
        "lucky_number": 1,
        "lucky_color": "Gold",
        "mood": "Confident",
        "compatibility": "Sagittarius"
    },
    "virgo": {
        "prediction": "Attention to detail serves you well today. Focus on health and organization. Your analytical mind solves complex problems.",
        "lucky_number": 7,
        "lucky_color": "Navy Blue",
        "mood": "Analytical",
        "compatibility": "Capricorn"
    },
    "libra": {
        "prediction": "Harmony and balance guide your day. Relationships flourish under your diplomatic touch. Artistic pursuits bring satisfaction.",
        "lucky_number": 6,
        "lucky_color": "Pink",
        "mood": "Harmonious",
        "compatibility": "Aquarius"
    },
    "scorpio": {
        "prediction": "Transformation is possible today. Trust your deep insights and embrace change. Your intensity leads to breakthrough moments.",
        "lucky_number": 8,
        "lucky_color": "Maroon",
        "mood": "Intense",
        "compatibility": "Pisces"
    },
    "sagittarius": {
        "prediction": "Adventure calls you forward. Expand your horizons through learning or travel. Optimism attracts positive experiences.",
        "lucky_number": 3,
        "lucky_color": "Purple",
        "mood": "Adventurous",
        "compatibility": "Aries"
    },
    "capricorn": {
        "prediction": "Professional goals come within reach. Your discipline and ambition pay dividends. Build for the long term.",
        "lucky_number": 4,
        "lucky_color": "Brown",
        "mood": "Determined",
        "compatibility": "Taurus"
    },
    "aquarius": {
        "prediction": "Innovation flows freely today. Your unique perspective solves old problems. Connect with like-minded souls.",
        "lucky_number": 11,
        "lucky_color": "Electric Blue",
        "mood": "Innovative",
        "compatibility": "Gemini"
    },
    "pisces": {
        "prediction": "Spiritual insights illuminate your path. Trust your dreams and creative visions. Compassion opens doors to connection.",
        "lucky_number": 12,
        "lucky_color": "Sea Green",
        "mood": "Dreamy",
        "compatibility": "Cancer"
    }
}

NAKSHATRA_DATA = [
    {"name": "Ashwini", "deity": "Ashwini Kumaras", "symbol": "Horse Head", "element": "Fire"},
    {"name": "Bharani", "deity": "Yama", "symbol": "Yoni", "element": "Earth"},
    {"name": "Krittika", "deity": "Agni", "symbol": "Razor", "element": "Fire"},
    {"name": "Rohini", "deity": "Brahma", "symbol": "Chariot", "element": "Earth"},
    {"name": "Mrigashira", "deity": "Soma", "symbol": "Deer Head", "element": "Air"},
    {"name": "Ardra", "deity": "Rudra", "symbol": "Teardrop", "element": "Water"},
    {"name": "Punarvasu", "deity": "Aditi", "symbol": "Bow", "element": "Air"},
    {"name": "Pushya", "deity": "Brihaspati", "symbol": "Lotus", "element": "Water"},
    {"name": "Ashlesha", "deity": "Serpent", "symbol": "Serpent", "element": "Water"},
    {"name": "Magha", "deity": "Pitris", "symbol": "Throne", "element": "Fire"},
    {"name": "Purva Phalguni", "deity": "Bhaga", "symbol": "Hammock", "element": "Fire"},
    {"name": "Uttara Phalguni", "deity": "Aryaman", "symbol": "Bed", "element": "Fire"},
    {"name": "Hasta", "deity": "Savitar", "symbol": "Hand", "element": "Air"},
    {"name": "Chitra", "deity": "Vishwakarma", "symbol": "Pearl", "element": "Fire"},
    {"name": "Swati", "deity": "Vayu", "symbol": "Coral", "element": "Air"},
    {"name": "Vishakha", "deity": "Indra-Agni", "symbol": "Archway", "element": "Fire"},
    {"name": "Anuradha", "deity": "Mitra", "symbol": "Lotus", "element": "Water"},
    {"name": "Jyeshtha", "deity": "Indra", "symbol": "Umbrella", "element": "Air"},
    {"name": "Mula", "deity": "Nirriti", "symbol": "Roots", "element": "Air"},
    {"name": "Purva Ashadha", "deity": "Apas", "symbol": "Fan", "element": "Water"},
    {"name": "Uttara Ashadha", "deity": "Vishvedevas", "symbol": "Tusk", "element": "Air"},
    {"name": "Shravana", "deity": "Vishnu", "symbol": "Ear", "element": "Air"},
    {"name": "Dhanishta", "deity": "Vasus", "symbol": "Drum", "element": "Air"},
    {"name": "Shatabhisha", "deity": "Varuna", "symbol": "Circle", "element": "Air"},
    {"name": "Purva Bhadrapada", "deity": "Aja Ekapada", "symbol": "Sword", "element": "Air"},
    {"name": "Uttara Bhadrapada", "deity": "Ahir Budhnya", "symbol": "Twins", "element": "Water"},
    {"name": "Revati", "deity": "Pushan", "symbol": "Fish", "element": "Water"},
]

def get_zodiac_sign(month: int, day: int) -> str:
    """Get zodiac sign from birth date"""
    for start_month, start_day, end_month, end_day, sign in ZODIAC_DATES:
        if start_month == end_month:
            if month == start_month and start_day <= day <= end_day:
                return sign
        else:
            if (month == start_month and day >= start_day) or (month == end_month and day <= end_day):
                return sign
    return "capricorn"  # Default fallback

def get_daily_horoscope(zodiac_sign: str) -> dict:
    """Get daily horoscope for a zodiac sign"""
    sign = zodiac_sign.lower()
    if sign not in DAILY_PREDICTIONS:
        sign = "aries"
    
    data = DAILY_PREDICTIONS[sign]
    return {
        "zodiac_sign": sign.capitalize(),
        "daily_prediction": data["prediction"],
        "lucky_number": data["lucky_number"],
        "lucky_color": data["lucky_color"],
        "mood": data["mood"],
        "compatibility": data["compatibility"]
    }

def calculate_nakshatra(day: int) -> dict:
    """Simple nakshatra calculation based on day of month"""
    index = day % 27
    return NAKSHATRA_DATA[index]

def generate_birth_chart(date_of_birth: str, time_of_birth: str, place: str) -> dict:
    """Generate basic birth chart data"""
    try:
        dob = datetime.strptime(date_of_birth, "%Y-%m-%d")
    except ValueError:
        dob = datetime.now()
    
    zodiac = get_zodiac_sign(dob.month, dob.day)
    nakshatra = calculate_nakshatra(dob.day)
    
    # Calculate moon sign (simplified)
    moon_signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
                  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
    moon_index = (dob.day + dob.month) % 12
    
    return {
        "sun_sign": zodiac.capitalize(),
        "moon_sign": moon_signs[moon_index],
        "ascendant": moon_signs[(moon_index + 3) % 12],
        "nakshatra": nakshatra,
        "birth_details": {
            "date": date_of_birth,
            "time": time_of_birth,
            "place": place
        },
        "planetary_positions": {
            "Sun": zodiac.capitalize(),
            "Moon": moon_signs[moon_index],
            "Mars": moon_signs[(moon_index + 2) % 12],
            "Mercury": moon_signs[(moon_index + 1) % 12],
            "Jupiter": moon_signs[(moon_index + 4) % 12],
            "Venus": moon_signs[(moon_index + 5) % 12],
            "Saturn": moon_signs[(moon_index + 6) % 12],
            "Rahu": moon_signs[(moon_index + 7) % 12],
            "Ketu": moon_signs[(moon_index + 8) % 12]
        },
        "dasha": {
            "current": nakshatra["deity"],
            "period": "7 years remaining"
        }
    }
