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
    "aries": {"en": "Aries", "hi": "मेष", "te": "మేషం", "ta": "மேஷம்", "kn": "ಮೇಷ", "ml": "മേടം", "sa": "मेषः"},
    "taurus": {"en": "Taurus", "hi": "वृषभ", "te": "వృషభం", "ta": "ரிஷபம்", "kn": "ವೃಷಭ", "ml": "ഇടവം", "sa": "वृषभः"},
    "gemini": {"en": "Gemini", "hi": "मिथुन", "te": "మిథునం", "ta": "மிதுனம்", "kn": "ಮಿಥುನ", "ml": "മിഥുനം", "sa": "मिथुनम्"},
    "cancer": {"en": "Cancer", "hi": "कर्क", "te": "కర్కాటకం", "ta": "கர்கடகம்", "kn": "ಕರ್ಕಾಟಕ", "ml": "കർക്കിടകം", "sa": "कर्कटः"},
    "leo": {"en": "Leo", "hi": "सिंह", "te": "సింహం", "ta": "சிம்மம்", "kn": "ಸಿಂಹ", "ml": "ചിങ്ങം", "sa": "सिंहः"},
    "virgo": {"en": "Virgo", "hi": "कन्या", "te": "కన్య", "ta": "கன்னி", "kn": "ಕನ್ಯಾ", "ml": "കന്നി", "sa": "कन्या"},
    "libra": {"en": "Libra", "hi": "तुला", "te": "తుల", "ta": "துலாம்", "kn": "ತುಲಾ", "ml": "തുലാം", "sa": "तुला"},
    "scorpio": {"en": "Scorpio", "hi": "वृश्चिक", "te": "వృశ్చికం", "ta": "விருச்சிகம்", "kn": "ವೃಶ್ಚಿಕ", "ml": "വൃശ്ചികം", "sa": "वृश्चिकः"},
    "sagittarius": {"en": "Sagittarius", "hi": "धनु", "te": "ధనస్సు", "ta": "தனுசு", "kn": "ಧನು", "ml": "ധനു", "sa": "धनुः"},
    "capricorn": {"en": "Capricorn", "hi": "मकर", "te": "మకరం", "ta": "மகரம்", "kn": "ಮಕರ", "ml": "മകരം", "sa": "मकरः"},
    "aquarius": {"en": "Aquarius", "hi": "कुंभ", "te": "కుంభం", "ta": "கும்பம்", "kn": "ಕುಂಭ", "ml": "കുംഭം", "sa": "कुम्भः"},
    "pisces": {"en": "Pisces", "hi": "मीन", "te": "మీనం", "ta": "மீனம்", "kn": "ಮೀನ", "ml": "മീനം", "sa": "मीनम्"}
}

# Horoscope translations for common phrases
HOROSCOPE_PHRASES = {
    "lucky_number": {"en": "Lucky Number", "hi": "भाग्यशाली अंक", "te": "అదృష్ట సంఖ్య", "ta": "அதிர்ஷ்ட எண்", "kn": "ಅದೃಷ್ಟ ಸಂಖ್ಯೆ", "ml": "ഭാഗ്യ നമ്പർ", "sa": "भाग्याङ्कः"},
    "lucky_color": {"en": "Lucky Color", "hi": "भाग्यशाली रंग", "te": "అదృష్ట రంగు", "ta": "அதிர்ஷ்ட நிறம்", "kn": "ಅದೃಷ್ಟ ಬಣ್ಣ", "ml": "ഭാഗ്യ നിറം", "sa": "भाग्यवर्णः"}
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

async def get_daily_horoscope(sign: str, lang: str = "en") -> Dict:
    """Get daily horoscope for a zodiac sign with language support"""
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
        # Return fallback horoscope with language support
        return get_fallback_horoscope(sign, lang)

def get_fallback_horoscope(sign: str, lang: str = "en") -> Dict:
    """Return fallback horoscope data when API fails with multi-language support"""
    # Horoscopes with translations for all supported languages
    horoscopes = {
        "aries": {
            "prediction": {
                "en": "Today brings opportunities for new beginnings. Your natural leadership qualities will shine. Focus on personal goals and take initiative in your projects.",
                "hi": "आज नई शुरुआत के अवसर लाता है। आपके स्वाभाविक नेतृत्व गुण चमकेंगे। व्यक्तिगत लक्ष्यों पर ध्यान दें और अपनी परियोजनाओं में पहल करें।",
                "te": "ఈ రోజు కొత్త ప్రారంభాలకు అవకాశాలు తెస్తుంది. మీ సహజ నాయకత్వ లక్షణాలు ప్రకాశిస్తాయి. వ్యక్తిగత లక్ష్యాలపై దృష్టి పెట్టండి మరియు మీ ప్రాజెక్ట్‌లలో చొరవ తీసుకోండి.",
                "ta": "இன்று புதிய தொடக்கங்களுக்கான வாய்ப்புகளைக் கொண்டுவருகிறது. உங்கள் இயல்பான தலைமைப் பண்புகள் பிரகாசிக்கும். தனிப்பட்ட இலக்குகளில் கவனம் செலுத்துங்கள்.",
                "kn": "ಇಂದು ಹೊಸ ಆರಂಭಗಳಿಗೆ ಅವಕಾಶಗಳನ್ನು ತರುತ್ತದೆ. ನಿಮ್ಮ ಸ್ವಾಭಾವಿಕ ನಾಯಕತ್ವ ಗುಣಗಳು ಹೊಳೆಯುತ್ತವೆ. ವೈಯಕ್ತಿಕ ಗುರಿಗಳ ಮೇಲೆ ಗಮನ ಕೊಡಿ.",
                "ml": "ഇന്ന് പുതിയ തുടക്കങ്ങൾക്ക് അവസരങ്ങൾ കൊണ്ടുവരുന്നു. നിങ്ങളുടെ സ്വാഭാവിക നേതൃത്വ ഗുണങ്ങൾ തിളങ്ങും. വ്യക്തിഗത ലക്ഷ്യങ്ങളിൽ ശ്രദ്ധ കേന്ദ്രീകരിക്കുക.",
                "sa": "अद्य नवारम्भानाम् अवसराः आगच्छन्ति। भवतः नैसर्गिकाः नेतृत्वगुणाः प्रकाशन्ते। व्यक्तिगतलक्ष्येषु ध्यानं दत्त।"
            },
            "lucky_number": 9,
            "lucky_color": {"en": "Red", "hi": "लाल", "te": "ఎరుపు", "ta": "சிவப்பு", "kn": "ಕೆಂಪು", "ml": "ചുവപ്പ്", "sa": "रक्तवर्णः"}
        },
        "taurus": {
            "prediction": {
                "en": "Financial matters look favorable today. Your patience and determination will be rewarded. Focus on stability and enjoy life's simple pleasures.",
                "hi": "आज वित्तीय मामले अनुकूल दिख रहे हैं। आपके धैर्य और दृढ़ संकल्प को पुरस्कृत किया जाएगा। स्थिरता पर ध्यान दें और जीवन के सरल सुखों का आनंद लें।",
                "te": "ఈ రోజు ఆర్థిక విషయాలు అనుకూలంగా కనిపిస్తున్నాయి. మీ ఓర్పు మరియు దృఢ సంకల్పానికి ప్రతిఫలం లభిస్తుంది. స్థిరత్వంపై దృష్టి పెట్టండి.",
                "ta": "இன்று நிதி விஷயங்கள் சாதகமாக இருக்கும். உங்கள் பொறுமை மற்றும் உறுதி வெகுமதி பெறும். நிலைத்தன்மையில் கவனம் செலுத்துங்கள்.",
                "kn": "ಇಂದು ಆರ್ಥಿಕ ವಿಷಯಗಳು ಅನುಕೂಲಕರವಾಗಿ ಕಾಣುತ್ತವೆ. ನಿಮ್ಮ ತಾಳ್ಮೆ ಮತ್ತು ದೃಢ ನಿಶ್ಚಯಕ್ಕೆ ಪ್ರತಿಫಲ ಸಿಗುತ್ತದೆ.",
                "ml": "ഇന്ന് സാമ്പത്തിക കാര്യങ്ങൾ അനുകൂലമായി കാണപ്പെടുന്നു. നിങ്ങളുടെ ക്ഷമയും നിശ്ചയദാർഢ്യവും പ്രതിഫലം നേടും.",
                "sa": "अद्य आर्थिकविषयाः अनुकूलाः दृश्यन्ते। भवतः धैर्यं दृढसंकल्पश्च पुरस्कृतः भविष्यति।"
            },
            "lucky_number": 6,
            "lucky_color": {"en": "Green", "hi": "हरा", "te": "ఆకుపచ్చ", "ta": "பச்சை", "kn": "ಹಸಿರು", "ml": "പച്ച", "sa": "हरितवर्णः"}
        },
        "gemini": {
            "prediction": {
                "en": "Communication is key today. Express your ideas clearly and connect with others. Your curiosity will lead to interesting discoveries.",
                "hi": "आज संवाद महत्वपूर्ण है। अपने विचारों को स्पष्ट रूप से व्यक्त करें और दूसरों से जुड़ें। आपकी जिज्ञासा दिलचस्प खोजों की ओर ले जाएगी।",
                "te": "ఈ రోజు సంభాషణ కీలకం. మీ ఆలోచనలను స్పష్టంగా వ్యక్తం చేయండి మరియు ఇతరులతో కనెక్ట్ అవ్వండి. మీ ఉత్సుకత ఆసక్తికరమైన ఆవిష్కరణలకు దారి తీస్తుంది.",
                "ta": "இன்று தகவல் தொடர்பு முக்கியம். உங்கள் கருத்துக்களை தெளிவாக வெளிப்படுத்துங்கள். உங்கள் ஆர்வம் சுவாரஸ்யமான கண்டுபிடிப்புகளுக்கு வழிவகுக்கும்.",
                "kn": "ಇಂದು ಸಂವಹನ ಪ್ರಮುಖವಾಗಿದೆ. ನಿಮ್ಮ ಆಲೋಚನೆಗಳನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ವ್ಯಕ್ತಪಡಿಸಿ ಮತ್ತು ಇತರರೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಿ.",
                "ml": "ഇന്ന് ആശയവിനിമയം പ്രധാനമാണ്. നിങ്ങളുടെ ആശയങ്ങൾ വ്യക്തമായി പ്രകടിപ്പിക്കുക. നിങ്ങളുടെ ജിജ്ഞാസ രസകരമായ കണ്ടെത്തലുകളിലേക്ക് നയിക്കും.",
                "sa": "अद्य संवादः महत्त्वपूर्णः। स्वविचारान् स्पष्टतया व्यक्तं कुर्वन्तु अन्यैः सह संयुज्यन्ताम्।"
            },
            "lucky_number": 5,
            "lucky_color": {"en": "Yellow", "hi": "पीला", "te": "పసుపు", "ta": "மஞ்சள்", "kn": "ಹಳದಿ", "ml": "മഞ്ഞ", "sa": "पीतवर्णः"}
        },
        "cancer": {
            "prediction": {
                "en": "Home and family matters take priority. Your intuition is strong - trust your instincts. Nurture your relationships and create comfort.",
                "hi": "घर और परिवार के मामले प्राथमिकता लेते हैं। आपका अंतर्ज्ञान मजबूत है - अपनी सहज वृत्ति पर भरोसा करें। अपने रिश्तों का पोषण करें और आराम पैदा करें।",
                "te": "ఇల్లు మరియు కుటుంబ విషయాలు ప్రాధాన్యత పొందుతాయి. మీ అంతర్దృష్టి బలంగా ఉంది - మీ సహజ ప్రవృత్తులను నమ్మండి. మీ సంబంధాలను పోషించండి.",
                "ta": "வீடு மற்றும் குடும்ப விஷயங்கள் முன்னுரிமை பெறுகின்றன. உங்கள் உள்ளுணர்வு வலுவாக உள்ளது - உங்கள் உள்ளுணர்வை நம்புங்கள்.",
                "kn": "ಮನೆ ಮತ್ತು ಕುಟುಂಬದ ವಿಷಯಗಳು ಆದ್ಯತೆ ಪಡೆಯುತ್ತವೆ. ನಿಮ್ಮ ಅಂತಃಪ್ರಜ್ಞೆ ಬಲವಾಗಿದೆ - ನಿಮ್ಮ ಸಹಜ ಪ್ರವೃತ್ತಿಯನ್ನು ನಂಬಿ.",
                "ml": "വീടും കുടുംബ കാര്യങ്ങളും മുൻഗണന നേടുന്നു. നിങ്ങളുടെ അന്തർജ്ഞാനം ശക്തമാണ് - നിങ്ങളുടെ സഹജവാസനകളെ വിശ്വസിക്കുക.",
                "sa": "गृहं कुटुम्बविषयाश्च प्राधान्यं प्राप्नुवन्ति। भवतः अन्तर्दृष्टिः बलवती - स्वसहजवृत्तौ विश्वसतु।"
            },
            "lucky_number": 2,
            "lucky_color": {"en": "Silver", "hi": "चांदी", "te": "వెండి", "ta": "வெள்ளி", "kn": "ಬೆಳ್ಳಿ", "ml": "വെള്ളി", "sa": "रजतवर्णः"}
        },
        "leo": {
            "prediction": {
                "en": "Your creativity and confidence are at their peak. Take center stage and share your talents. Romance and self-expression are highlighted.",
                "hi": "आपकी रचनात्मकता और आत्मविश्वास अपने चरम पर हैं। केंद्र मंच लें और अपनी प्रतिभा साझा करें। रोमांस और आत्म-अभिव्यक्ति पर प्रकाश डाला गया है।",
                "te": "మీ సృజనాత్మకత మరియు ఆత్మవిశ్వాసం శిఖరాగ్రంలో ఉన్నాయి. కేంద్ర వేదికపై నిలబడి మీ ప్రతిభను పంచుకోండి. రొమాన్స్ మరియు స్వీయ వ్యక్తీకరణ హైలైట్ చేయబడ్డాయి.",
                "ta": "உங்கள் படைப்பாற்றலும் நம்பிக்கையும் உச்சத்தில் உள்ளன. மைய மேடையில் நின்று உங்கள் திறமைகளைப் பகிர்ந்து கொள்ளுங்கள்.",
                "kn": "ನಿಮ್ಮ ಸೃಜನಶೀಲತೆ ಮತ್ತು ಆತ್ಮವಿಶ್ವಾಸ ಉತ್ತುಂಗದಲ್ಲಿವೆ. ಕೇಂದ್ರ ವೇದಿಕೆ ತೆಗೆದುಕೊಳ್ಳಿ ಮತ್ತು ನಿಮ್ಮ ಪ್ರತಿಭೆಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ.",
                "ml": "നിങ്ങളുടെ സർഗ്ഗാത്മകതയും ആത്മവിശ്വാസവും ഉച്ചസ്ഥായിയിലാണ്. കേന്ദ്ര വേദി ഏറ്റെടുക്കുക, നിങ്ങളുടെ കഴിവുകൾ പങ്കിടുക.",
                "sa": "भवतः सृजनात्मकता आत्मविश्वासश्च शिखरे स्तः। केन्द्रमञ्चं गृह्णातु स्वप्रतिभां च साझां कुर्वन्तु।"
            },
            "lucky_number": 1,
            "lucky_color": {"en": "Gold", "hi": "सोना", "te": "బంగారు", "ta": "தங்கம்", "kn": "ಚಿನ್ನ", "ml": "സ്വർണ്ണം", "sa": "स्वर्णवर्णः"}
        },
        "virgo": {
            "prediction": {
                "en": "Focus on health and daily routines. Your analytical skills help solve problems. Pay attention to details and serve others with care.",
                "hi": "स्वास्थ्य और दैनिक दिनचर्या पर ध्यान दें। आपके विश्लेषणात्मक कौशल समस्याओं को हल करने में मदद करते हैं। विवरणों पर ध्यान दें और देखभाल के साथ दूसरों की सेवा करें।",
                "te": "ఆరోగ్యం మరియు రోజువారీ దినచర్యలపై దృష్టి పెట్టండి. మీ విశ్లేషణాత్మక నైపుణ్యాలు సమస్యలను పరిష్కరించడంలో సహాయపడతాయి. వివరాలపై శ్రద్ధ వహించండి.",
                "ta": "ஆரோக்கியம் மற்றும் தினசரி நடைமுறைகளில் கவனம் செலுத்துங்கள். உங்கள் பகுப்பாய்வு திறன்கள் பிரச்சனைகளை தீர்க்க உதவும்.",
                "kn": "ಆರೋಗ್ಯ ಮತ್ತು ದೈನಂದಿನ ದಿನಚರಿಗಳ ಮೇಲೆ ಗಮನ ಕೊಡಿ. ನಿಮ್ಮ ವಿಶ್ಲೇಷಣಾತ್ಮಕ ಕೌಶಲ್ಯಗಳು ಸಮಸ್ಯೆಗಳನ್ನು ಪರಿಹರಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತವೆ.",
                "ml": "ആരോഗ്യത്തിലും ദൈനംദിന ദിനചര്യകളിലും ശ്രദ്ധ കേന്ദ്രീകരിക്കുക. നിങ്ങളുടെ വിശകലന കഴിവുകൾ പ്രശ്നങ്ങൾ പരിഹരിക്കാൻ സഹായിക്കും.",
                "sa": "स्वास्थ्ये दैनिकदिनचर्यासु च ध्यानं दत्त। भवतः विश्लेषणात्मककौशलानि समस्याः समाधातुं सहाय्यं कुर्वन्ति।"
            },
            "lucky_number": 5,
            "lucky_color": {"en": "Navy Blue", "hi": "गहरा नीला", "te": "నేవీ నీలం", "ta": "கடற்படை நீலம்", "kn": "ನೌಕಾದಳ ನೀಲಿ", "ml": "നേവി ബ്ലൂ", "sa": "गाढनीलवर्णः"}
        },
        "libra": {
            "prediction": {
                "en": "Relationships and partnerships are emphasized. Seek balance and harmony in all dealings. Your diplomatic skills are valuable today.",
                "hi": "रिश्तों और साझेदारियों पर जोर दिया गया है। सभी व्यवहारों में संतुलन और सामंजस्य की तलाश करें। आज आपके कूटनीतिक कौशल मूल्यवान हैं।",
                "te": "సంబంధాలు మరియు భాగస్వామ్యాలు నొక్కి చెప్పబడ్డాయి. అన్ని వ్యవహారాలలో సమతుల్యత మరియు సామరస్యం కోసం ప్రయత్నించండి. ఈ రోజు మీ దౌత్య నైపుణ్యాలు విలువైనవి.",
                "ta": "உறவுகள் மற்றும் கூட்டாண்மைகள் வலியுறுத்தப்படுகின்றன. அனைத்து விவகாரங்களிலும் சமநிலை மற்றும் இணக்கத்தை நாடுங்கள்.",
                "kn": "ಸಂಬಂಧಗಳು ಮತ್ತು ಸಹಭಾಗಿತ್ವಗಳಿಗೆ ಒತ್ತು ನೀಡಲಾಗಿದೆ. ಎಲ್ಲಾ ವ್ಯವಹಾರಗಳಲ್ಲಿ ಸಮತೋಲನ ಮತ್ತು ಸಾಮರಸ್ಯವನ್ನು ಹುಡುಕಿ.",
                "ml": "ബന്ധങ്ങളും പങ്കാളിത്തങ്ങളും ഊന്നിപ്പറയുന്നു. എല്ലാ ഇടപാടുകളിലും സന്തുലിതാവസ്ഥയും ഐക്യവും തേടുക.",
                "sa": "सम्बन्धाः साझेदार्यश्च प्रमुखाः। सर्वव्यवहारेषु सन्तुलनं सामञ्जस्यं च अन्विष्यतु।"
            },
            "lucky_number": 6,
            "lucky_color": {"en": "Pink", "hi": "गुलाबी", "te": "గులాబీ", "ta": "இளஞ்சிவப்பு", "kn": "ಗುಲಾಬಿ", "ml": "പിങ്ക്", "sa": "पाटलवर्णः"}
        },
        "scorpio": {
            "prediction": {
                "en": "Transformation and deep insights await. Your determination helps overcome obstacles. Embrace change and trust the process.",
                "hi": "परिवर्तन और गहरी अंतर्दृष्टि आपकी प्रतीक्षा कर रही है। आपका दृढ़ संकल्प बाधाओं को दूर करने में मदद करता है। परिवर्तन को अपनाएं और प्रक्रिया पर भरोसा करें।",
                "te": "రూపాంతరం మరియు లోతైన అంతర్దృష్టులు ఎదురుచూస్తున్నాయి. మీ దృఢ సంకల్పం అడ్డంకులను అధిగమించడంలో సహాయపడుతుంది. మార్పును స్వీకరించండి.",
                "ta": "உருமாற்றமும் ஆழமான நுண்ணறிவும் காத்திருக்கின்றன. உங்கள் உறுதி தடைகளை கடக்க உதவுகிறது. மாற்றத்தை ஏற்றுக்கொள்ளுங்கள்.",
                "kn": "ರೂಪಾಂತರ ಮತ್ತು ಆಳವಾದ ಒಳನೋಟಗಳು ಕಾಯುತ್ತಿವೆ. ನಿಮ್ಮ ದೃಢ ನಿಶ್ಚಯ ಅಡೆತಡೆಗಳನ್ನು ಜಯಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
                "ml": "പരിവർത്തനവും ആഴത്തിലുള്ള ഉൾക്കാഴ്ചകളും കാത്തിരിക്കുന്നു. നിങ്ങളുടെ നിശ്ചയദാർഢ്യം തടസ്സങ്ങളെ മറികടക്കാൻ സഹായിക്കുന്നു.",
                "sa": "परिवर्तनं गहनान्तर्दृष्टयश्च प्रतीक्षन्ते। भवतः दृढसंकल्पः विघ्नान् अतिक्रमितुं सहायकः।"
            },
            "lucky_number": 8,
            "lucky_color": {"en": "Maroon", "hi": "मैरून", "te": "మెరూన్", "ta": "மெரூன்", "kn": "ಮೆರೂನ್", "ml": "മറൂൺ", "sa": "कषायवर्णः"}
        },
        "sagittarius": {
            "prediction": {
                "en": "Adventure and learning call to you. Expand your horizons through travel or study. Your optimism inspires others.",
                "hi": "साहसिक कार्य और सीखने की पुकार आपको आ रही है। यात्रा या अध्ययन के माध्यम से अपने क्षितिज का विस्तार करें। आपका आशावाद दूसरों को प्रेरित करता है।",
                "te": "సాహసం మరియు అధ్యయనం మిమ్మల్ని పిలుస్తున్నాయి. ప్రయాణం లేదా అధ్యయనం ద్వారా మీ దృష్టికోణాలను విస్తరించండి. మీ ఆశావాదం ఇతరులను ప్రేరేపిస్తుంది.",
                "ta": "சாகசமும் கற்றலும் உங்களை அழைக்கின்றன. பயணம் அல்லது படிப்பு மூலம் உங்கள் எல்லைகளை விரிவுபடுத்துங்கள்.",
                "kn": "ಸಾಹಸ ಮತ್ತು ಕಲಿಕೆ ನಿಮ್ಮನ್ನು ಕರೆಯುತ್ತಿವೆ. ಪ್ರಯಾಣ ಅಥವಾ ಅಧ್ಯಯನದ ಮೂಲಕ ನಿಮ್ಮ ದಿಗಂತಗಳನ್ನು ವಿಸ್ತರಿಸಿ.",
                "ml": "സാഹസികതയും പഠനവും നിങ്ങളെ വിളിക്കുന്നു. യാത്രയിലൂടെയോ പഠനത്തിലൂടെയോ നിങ്ങളുടെ ചക്രവാളങ്ങൾ വിപുലീകരിക്കുക.",
                "sa": "साहसं अध्ययनं च भवन्तं आह्वयति। यात्रया अध्ययनेन वा स्वक्षितिजं विस्तारयतु।"
            },
            "lucky_number": 3,
            "lucky_color": {"en": "Purple", "hi": "बैंगनी", "te": "ఊదా", "ta": "ஊதா", "kn": "ನೇರಳೆ", "ml": "പർപ്പിൾ", "sa": "जामुनवर्णः"}
        },
        "capricorn": {
            "prediction": {
                "en": "Career and ambitions are highlighted. Your hard work brings recognition. Focus on long-term goals and maintain discipline.",
                "hi": "करियर और महत्वाकांक्षाओं पर प्रकाश डाला गया है। आपकी कड़ी मेहनत मान्यता लाती है। दीर्घकालिक लक्ष्यों पर ध्यान दें और अनुशासन बनाए रखें।",
                "te": "వృత్తి మరియు ఆకాంక్షలు హైలైట్ చేయబడ్డాయి. మీ కఠినమైన పరిశ్రమ గుర్తింపు తెస్తుంది. దీర్ఘకాలిక లక్ష్యాలపై దృష్టి పెట్టండి.",
                "ta": "தொழில் மற்றும் லட்சியங்கள் முன்னிலைப்படுத்தப்படுகின்றன. உங்கள் கடின உழைப்பு அங்கீகாரத்தைக் கொண்டுவருகிறது.",
                "kn": "ವೃತ್ತಿ ಮತ್ತು ಮಹತ್ವಾಕಾಂಕ್ಷೆಗಳನ್ನು ಎತ್ತಿ ತೋರಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಕಠಿಣ ಪರಿಶ್ರಮ ಗುರುತಿಸುವಿಕೆ ತರುತ್ತದೆ.",
                "ml": "കരിയറും അഭിലാഷങ്ങളും എടുത്തുകാണിക്കുന്നു. നിങ്ങളുടെ കഠിനാധ്വാനം അംഗീകാരം നേടുന്നു.",
                "sa": "वृत्तिः महत्त्वाकाङ्क्षाश्च प्रकाशिताः। भवतः परिश्रमः मान्यतां आनयति।"
            },
            "lucky_number": 8,
            "lucky_color": {"en": "Brown", "hi": "भूरा", "te": "గోధుమ", "ta": "பழுப்பு", "kn": "ಕಂದು", "ml": "തവിട്ട്", "sa": "कपिलवर्णः"}
        },
        "aquarius": {
            "prediction": {
                "en": "Innovation and friendships are favored. Your unique ideas gain acceptance. Connect with like-minded people and embrace change.",
                "hi": "नवाचार और मित्रता को प्राथमिकता मिली है। आपके अनूठे विचारों को स्वीकृति मिलती है। समान विचारधारा वाले लोगों से जुड़ें और परिवर्तन को अपनाएं।",
                "te": "ఆవిష్కరణ మరియు స్నేహాలు అనుకూలంగా ఉన్నాయి. మీ ప్రత్యేక ఆలోచనలు ఆమోదం పొందుతాయి. సమాన ఆలోచనలున్న వ్యక్తులతో కనెక్ట్ అవ్వండి.",
                "ta": "புத்தாக்கமும் நட்பும் சாதகமாக உள்ளன. உங்கள் தனித்துவமான யோசனைகள் ஏற்றுக்கொள்ளப்படுகின்றன.",
                "kn": "ನಾವೀನ್ಯತೆ ಮತ್ತು ಸ್ನೇಹಗಳು ಅನುಕೂಲಕರವಾಗಿವೆ. ನಿಮ್ಮ ವಿಶಿಷ್ಟ ಆಲೋಚನೆಗಳು ಸ್ವೀಕಾರವನ್ನು ಪಡೆಯುತ್ತವೆ.",
                "ml": "നവീകരണവും സൗഹൃദങ്ങളും അനുകൂലമാണ്. നിങ്ങളുടെ അതുല്യ ആശയങ്ങൾ സ്വീകാര്യത നേടുന്നു.",
                "sa": "नवाचारः मैत्री च अनुकूलौ। भवतः अनन्यविचाराः स्वीकृतिं प्राप्नुवन्ति।"
            },
            "lucky_number": 4,
            "lucky_color": {"en": "Electric Blue", "hi": "इलेक्ट्रिक नीला", "te": "ఎలక్ట్రిక్ నీలం", "ta": "எலக்ட்ரிக் நீலம்", "kn": "ಎಲೆಕ್ಟ್ರಿಕ್ ನೀಲಿ", "ml": "ഇലക്ട്രിക് ബ്ലൂ", "sa": "विद्युन्नीलवर्णः"}
        },
        "pisces": {
            "prediction": {
                "en": "Spirituality and creativity flow freely. Trust your dreams and intuition. Compassion and imagination guide your path.",
                "hi": "आध्यात्मिकता और रचनात्मकता स्वतंत्र रूप से बहती है। अपने सपनों और अंतर्ज्ञान पर भरोसा करें। करुणा और कल्पना आपके मार्ग का मार्गदर्शन करती है।",
                "te": "ఆధ్యాత్మికత మరియు సృజనాత్మకత స్వేచ్ఛగా ప్రవహిస్తాయి. మీ కలలు మరియు అంతర్దృష్టిని నమ్మండి. కరుణ మరియు ఊహ మీ మార్గానికి మార్గదర్శకత్వం చేస్తాయి.",
                "ta": "ஆன்மீகமும் படைப்பாற்றலும் சுதந்திரமாக பாய்கின்றன. உங்கள் கனவுகளையும் உள்ளுணர்வையும் நம்புங்கள்.",
                "kn": "ಆಧ್ಯಾತ್ಮಿಕತೆ ಮತ್ತು ಸೃಜನಶೀಲತೆ ಮುಕ್ತವಾಗಿ ಹರಿಯುತ್ತವೆ. ನಿಮ್ಮ ಕನಸುಗಳು ಮತ್ತು ಅಂತಃಪ್ರಜ್ಞೆಯನ್ನು ನಂಬಿ.",
                "ml": "ആത്മീയതയും സർഗ്ഗാത്മകതയും സ്വതന്ത്രമായി ഒഴുകുന്നു. നിങ്ങളുടെ സ്വപ്നങ്ങളെയും അന്തർജ്ഞാനത്തെയും വിശ്വസിക്കുക.",
                "sa": "आध्यात्मिकता सृजनात्मकता च स्वतन्त्रतया प्रवहतः। स्वस्वप्नेषु अन्तर्दृष्टौ च विश्वसतु।"
            },
            "lucky_number": 7,
            "lucky_color": {"en": "Sea Green", "hi": "समुद्री हरा", "te": "సముద్ర ఆకుపచ్చ", "ta": "கடல் பச்சை", "kn": "ಸಮುದ್ರ ಹಸಿರು", "ml": "കടൽ പച്ച", "sa": "समुद्रहरितवर्णः"}
        }
    }
    
    sign_data = horoscopes.get(sign.lower(), horoscopes["aries"])
    rashi_info = RASHI_NAMES.get(sign.lower(), {"en": sign.title(), "hi": sign.title()})
    
    # Get prediction in requested language, fallback to English
    prediction_text = sign_data["prediction"].get(lang, sign_data["prediction"]["en"])
    lucky_color = sign_data["lucky_color"].get(lang, sign_data["lucky_color"]["en"]) if isinstance(sign_data["lucky_color"], dict) else sign_data["lucky_color"]
    
    return {
        "data": {
            "daily_prediction": {
                "prediction": prediction_text,
                "lucky_number": sign_data["lucky_number"],
                "lucky_color": lucky_color
            }
        },
        "sign": sign.lower(),
        "sign_name": rashi_info["en"],
        "sign_name_hindi": rashi_info.get("hi", sign.title()),
        "sign_name_localized": rashi_info.get(lang, rashi_info.get("en", sign.title()))
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
        # Return fallback using local calculations
        return get_fallback_kundali(datetime_str, latitude, longitude)

def get_fallback_kundali(datetime_str: str, latitude: float, longitude: float) -> Dict:
    """Generate fallback kundali using Swiss Ephemeris"""
    import swisseph as swe
    from datetime import datetime
    
    try:
        # Parse datetime
        dt = datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
        
        # Calculate Julian day
        jd = swe.julday(dt.year, dt.month, dt.day, dt.hour + dt.minute/60.0)
        
        # Set ayanamsa (Lahiri)
        swe.set_sid_mode(swe.SIDM_LAHIRI)
        ayanamsa_value = swe.get_ayanamsa(jd)
        
        # Calculate planetary positions
        planets = {}
        planet_ids = {
            'Sun': swe.SUN, 'Moon': swe.MOON, 'Mars': swe.MARS,
            'Mercury': swe.MERCURY, 'Jupiter': swe.JUPITER, 'Venus': swe.VENUS,
            'Saturn': swe.SATURN, 'Rahu': swe.MEAN_NODE, 'Ketu': swe.MEAN_NODE
        }
        
        rashis = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
        
        for name, planet_id in planet_ids.items():
            pos, _ = swe.calc_ut(jd, planet_id)
            sidereal_pos = (pos[0] - ayanamsa_value) % 360
            if name == 'Ketu':
                sidereal_pos = (sidereal_pos + 180) % 360
            rashi_idx = int(sidereal_pos / 30)
            degree_in_rashi = sidereal_pos % 30
            planets[name] = {
                'longitude': round(sidereal_pos, 2),
                'rashi': rashis[rashi_idx],
                'degree': round(degree_in_rashi, 2)
            }
        
        # Calculate Lagna (Ascendant)
        houses, ascmc = swe.houses(jd, latitude, longitude, b'P')
        lagna_sidereal = (ascmc[0] - ayanamsa_value) % 360
        lagna_rashi_idx = int(lagna_sidereal / 30)
        
        # Calculate Nakshatra for Moon
        moon_pos = planets['Moon']['longitude']
        nakshatra_idx = int(moon_pos / (360/27))
        nakshatras = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
                      'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
                      'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
                      'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha',
                      'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati']
        
        return {
            "success": True,
            "ascendant": rashis[lagna_rashi_idx],
            "ascendant_degree": round(lagna_sidereal % 30, 2),
            "moon_sign": planets['Moon']['rashi'],
            "nakshatra": nakshatras[nakshatra_idx],
            "planets": planets,
            "ayanamsa": round(ayanamsa_value, 4),
            "generated_locally": True
        }
    except Exception as e:
        print(f"Fallback kundali error: {e}")
        return {
            "error": f"Could not generate kundali: {str(e)}",
            "success": False
        }

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
