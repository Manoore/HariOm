#!/usr/bin/env python3
"""
Import script for bhavykhatri/DharmicData repository
Imports scriptures: Bhagavad Gita, Valmiki Ramayana, Mahabharata, Rigveda, 
Atharvaveda, Yajurveda, and Ramcharitmanas into MongoDB
"""

import json
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = "devotional_content"
DATA_DIR = "/app/DharmicData"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
scriptures_collection = db["scriptures"]
scripture_verses_collection = db["scripture_verses"]

# Scripture metadata
SCRIPTURES = {
    "bhagavad_gita": {
        "name": "Bhagavad Gita",
        "name_hindi": "श्रीमद्भगवद्गीता",
        "description": "The Song of God - Lord Krishna's teachings to Arjuna on the battlefield of Kurukshetra",
        "description_hindi": "भगवान श्री कृष्ण द्वारा कुरुक्षेत्र के युद्ध में अर्जुन को दिया गया दिव्य उपदेश",
        "category": "itihasa",
        "chapters": 18,
        "total_verses": 700,
        "icon": "book-open"
    },
    "valmiki_ramayana": {
        "name": "Valmiki Ramayana",
        "name_hindi": "वाल्मीकि रामायण",
        "description": "The epic story of Lord Rama by Sage Valmiki",
        "description_hindi": "महर्षि वाल्मीकि द्वारा रचित भगवान राम की महाकाव्य गाथा",
        "category": "itihasa",
        "kandas": ["Bala Kanda", "Ayodhya Kanda", "Aranya Kanda", "Kishkindha Kanda", "Sundara Kanda", "Yuddha Kanda", "Uttara Kanda"],
        "icon": "crown"
    },
    "mahabharata": {
        "name": "Mahabharata",
        "name_hindi": "महाभारत",
        "description": "The Great Epic of India - The story of the Bharata dynasty and the Kurukshetra War",
        "description_hindi": "भारत का महान महाकाव्य - भरत वंश और कुरुक्षेत्र युद्ध की गाथा",
        "category": "itihasa",
        "books": 18,
        "icon": "swords"
    },
    "rigveda": {
        "name": "Rigveda",
        "name_hindi": "ऋग्वेद",
        "description": "The oldest of the four Vedas - Collection of hymns dedicated to the deities",
        "description_hindi": "चारों वेदों में सबसे प्राचीन - देवताओं को समर्पित ऋचाओं का संग्रह",
        "category": "veda",
        "mandalas": 10,
        "icon": "flame"
    },
    "atharvaveda": {
        "name": "Atharvaveda",
        "name_hindi": "अथर्ववेद",
        "description": "The Veda of knowledge and procedures - Contains hymns and spells",
        "description_hindi": "ज्ञान और विधियों का वेद - मंत्र और औषधि विज्ञान का संग्रह",
        "category": "veda",
        "kandas": 20,
        "icon": "sparkles"
    },
    "yajurveda": {
        "name": "Yajurveda",
        "name_hindi": "यजुर्वेद",
        "description": "The Veda of rituals - Contains mantras for yajnas (sacrifices)",
        "description_hindi": "यज्ञ का वेद - यज्ञ के मंत्रों का संग्रह",
        "category": "veda",
        "icon": "flame-kindling"
    },
    "ramcharitmanas": {
        "name": "Ramcharitmanas",
        "name_hindi": "रामचरितमानस",
        "description": "The divine lake of Rama's deeds by Goswami Tulsidas - Retelling of the Ramayana in Awadhi",
        "description_hindi": "गोस्वामी तुलसीदास कृत राम कथा - अवधी भाषा में रामायण का पुनर्कथन",
        "category": "itihasa",
        "kandas": ["Bala Kanda", "Ayodhya Kanda", "Aranya Kanda", "Kishkindha Kanda", "Sundara Kanda", "Lanka Kanda", "Uttara Kanda"],
        "icon": "scroll"
    }
}

async def clear_existing_data():
    """Clear existing scripture data"""
    print("Clearing existing scripture data...")
    await scriptures_collection.delete_many({})
    await scripture_verses_collection.delete_many({})
    print("Cleared!")

async def import_bhagavad_gita():
    """Import Bhagavad Gita chapters and verses"""
    print("\n📖 Importing Bhagavad Gita...")
    scripture_id = "bhagavad_gita"
    gita_dir = os.path.join(DATA_DIR, "SrimadBhagvadGita")
    
    verses = []
    for i in range(1, 19):
        filepath = os.path.join(gita_dir, f"bhagavad_gita_chapter_{i}.json")
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                chapter_verses = data.get('BhagavadGitaChapter', [])
                
                for verse in chapter_verses:
                    verses.append({
                        "scripture_id": scripture_id,
                        "section_type": "chapter",
                        "section_num": verse.get("chapter", i),
                        "section_name": f"Chapter {verse.get('chapter', i)}",
                        "verse_num": verse.get("verse", 0),
                        "text": verse.get("text", ""),
                        "commentaries": verse.get("commentaries", {}),
                        "translations": verse.get("translations", {}),
                        "created_at": datetime.now(timezone.utc)
                    })
    
    if verses:
        await scripture_verses_collection.insert_many(verses)
    
    print(f"   ✓ Imported {len(verses)} verses")
    return len(verses)

async def import_valmiki_ramayana():
    """Import Valmiki Ramayana kandas and shlokas"""
    print("\n📖 Importing Valmiki Ramayana...")
    scripture_id = "valmiki_ramayana"
    ram_dir = os.path.join(DATA_DIR, "ValmikiRamayana")
    
    kanda_files = [
        ("1_balakanda.json", "Bala Kanda", "बालकाण्ड"),
        ("2_ayodhyakanda.json", "Ayodhya Kanda", "अयोध्याकाण्ड"),
        ("3_aranyakanda.json", "Aranya Kanda", "अरण्यकाण्ड"),
        ("4_kishkindhakanda.json", "Kishkindha Kanda", "किष्किन्धाकाण्ड"),
        ("5_sundarakanda.json", "Sundara Kanda", "सुन्दरकाण्ड"),
        ("6_yudhhakanda.json", "Yuddha Kanda", "युद्धकाण्ड"),
        ("7_uttarakanda.json", "Uttara Kanda", "उत्तरकाण्ड")
    ]
    
    total_verses = 0
    for idx, (filename, kanda_name, kanda_hindi) in enumerate(kanda_files, 1):
        filepath = os.path.join(ram_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                verses = []
                for item in data:
                    verses.append({
                        "scripture_id": scripture_id,
                        "section_type": "kanda",
                        "section_num": idx,
                        "section_name": kanda_name,
                        "section_name_hindi": kanda_hindi,
                        "sarga_num": item.get("sarg", 0),
                        "verse_num": item.get("shloka", 0),
                        "text": item.get("text", ""),
                        "created_at": datetime.now(timezone.utc)
                    })
                
                if verses:
                    await scripture_verses_collection.insert_many(verses)
                    total_verses += len(verses)
                    print(f"   ✓ {kanda_name}: {len(verses)} shlokas")
    
    return total_verses

async def import_mahabharata():
    """Import Mahabharata books and shlokas"""
    print("\n📖 Importing Mahabharata...")
    scripture_id = "mahabharata"
    maha_dir = os.path.join(DATA_DIR, "Mahabharata")
    
    book_names = {
        1: ("Adi Parva", "आदि पर्व"),
        2: ("Sabha Parva", "सभा पर्व"),
        3: ("Vana Parva", "वन पर्व"),
        4: ("Virata Parva", "विराट पर्व"),
        5: ("Udyoga Parva", "उद्योग पर्व"),
        6: ("Bhishma Parva", "भीष्म पर्व"),
        7: ("Drona Parva", "द्रोण पर्व"),
        8: ("Karna Parva", "कर्ण पर्व"),
        9: ("Shalya Parva", "शल्य पर्व"),
        10: ("Sauptika Parva", "सौप्तिक पर्व"),
        11: ("Stri Parva", "स्त्री पर्व"),
        12: ("Shanti Parva", "शान्ति पर्व"),
        13: ("Anushasana Parva", "अनुशासन पर्व"),
        14: ("Ashvamedhika Parva", "अश्वमेधिक पर्व"),
        15: ("Ashramavasika Parva", "आश्रमवासिक पर्व"),
        16: ("Mausala Parva", "मौसल पर्व"),
        17: ("Mahaprasthanika Parva", "महाप्रस्थानिक पर्व"),
        18: ("Svargarohana Parva", "स्वर्गारोहण पर्व")
    }
    
    total_verses = 0
    for book_num in range(1, 19):
        filepath = os.path.join(maha_dir, f"mahabharata_book_{book_num}.json")
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                book_name, book_hindi = book_names.get(book_num, (f"Book {book_num}", f"पर्व {book_num}"))
                
                verses = []
                for item in data:
                    verses.append({
                        "scripture_id": scripture_id,
                        "section_type": "parva",
                        "section_num": item.get("book", book_num),
                        "section_name": book_name,
                        "section_name_hindi": book_hindi,
                        "chapter_num": item.get("chapter", 0),
                        "verse_num": item.get("shloka", 0),
                        "text": item.get("text", ""),
                        "created_at": datetime.now(timezone.utc)
                    })
                
                if verses:
                    await scripture_verses_collection.insert_many(verses)
                    total_verses += len(verses)
                    print(f"   ✓ {book_name}: {len(verses)} shlokas")
    
    return total_verses

async def import_rigveda():
    """Import Rigveda mandalas and suktas"""
    print("\n📖 Importing Rigveda...")
    scripture_id = "rigveda"
    rig_dir = os.path.join(DATA_DIR, "Rigveda")
    
    total_verses = 0
    for mandala in range(1, 11):
        filepath = os.path.join(rig_dir, f"rigveda_mandala_{mandala}.json")
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                verses = []
                for item in data:
                    verses.append({
                        "scripture_id": scripture_id,
                        "section_type": "mandala",
                        "section_num": item.get("mandala", mandala),
                        "section_name": f"Mandala {item.get('mandala', mandala)}",
                        "sukta_num": item.get("sukta", 0),
                        "text": item.get("text", ""),
                        "created_at": datetime.now(timezone.utc)
                    })
                
                if verses:
                    await scripture_verses_collection.insert_many(verses)
                    total_verses += len(verses)
                    print(f"   ✓ Mandala {mandala}: {len(verses)} suktas")
    
    return total_verses

async def import_atharvaveda():
    """Import Atharvaveda kandas and suktas"""
    print("\n📖 Importing Atharvaveda...")
    scripture_id = "atharvaveda"
    atharva_dir = os.path.join(DATA_DIR, "AtharvaVeda")
    
    total_verses = 0
    for kanda in range(1, 21):
        filepath = os.path.join(atharva_dir, f"atharvaveda_kaanda_{kanda}.json")
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                verses = []
                for item in data:
                    verses.append({
                        "scripture_id": scripture_id,
                        "section_type": "kanda",
                        "section_num": item.get("kaanda", kanda),
                        "section_name": f"Kanda {item.get('kaanda', kanda)}",
                        "sukta_num": item.get("sukta", 0),
                        "text": item.get("text", ""),
                        "samhita": item.get("samhita", "shaunak"),
                        "created_at": datetime.now(timezone.utc)
                    })
                
                if verses:
                    await scripture_verses_collection.insert_many(verses)
                    total_verses += len(verses)
                    print(f"   ✓ Kanda {kanda}: {len(verses)} suktas")
    
    return total_verses

async def import_yajurveda():
    """Import Yajurveda samhitas"""
    print("\n📖 Importing Yajurveda...")
    scripture_id = "yajurveda"
    yajur_dir = os.path.join(DATA_DIR, "Yajurveda")
    
    samhita_files = [
        ("vajasneyi_madhyadina_samhita.json", "Vajasneyi Madhyandina Samhita", "वाजसनेयि माध्यन्दिन संहिता"),
        ("vajasneyi_kanva_samhita_chapters.json", "Vajasneyi Kanva Samhita", "वाजसनेयि काण्व संहिता")
    ]
    
    total_verses = 0
    for idx, (filename, samhita_name, samhita_hindi) in enumerate(samhita_files, 1):
        filepath = os.path.join(yajur_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                verses = []
                for item in data:
                    verses.append({
                        "scripture_id": scripture_id,
                        "section_type": "adhyaya",
                        "section_num": item.get("adhyaya", idx),
                        "section_name": f"Adhyaya {item.get('adhyaya', idx)}",
                        "samhita": samhita_name,
                        "samhita_hindi": samhita_hindi,
                        "text": item.get("text", ""),
                        "created_at": datetime.now(timezone.utc)
                    })
                
                if verses:
                    await scripture_verses_collection.insert_many(verses)
                    total_verses += len(verses)
                    print(f"   ✓ {samhita_name}: {len(verses)} mantras")
    
    return total_verses

async def import_ramcharitmanas():
    """Import Ramcharitmanas kandas"""
    print("\n📖 Importing Ramcharitmanas...")
    scripture_id = "ramcharitmanas"
    ram_dir = os.path.join(DATA_DIR, "Ramcharitmanas")
    
    kanda_files = [
        ("1_बाल_काण्ड_data.json", "Bala Kanda", "बाल काण्ड"),
        ("2_अयोध्या_काण्ड_data.json", "Ayodhya Kanda", "अयोध्या काण्ड"),
        ("3_अरण्य_काण्ड_data.json", "Aranya Kanda", "अरण्य काण्ड"),
        ("4_किष्किन्धा_काण्ड_data.json", "Kishkindha Kanda", "किष्किन्धा काण्ड"),
        ("5_सुंदर_काण्ड_data.json", "Sundara Kanda", "सुंदर काण्ड"),
        ("6_लंका_काण्ड_data.json", "Lanka Kanda", "लंका काण्ड"),
        ("7_उत्तर_काण्ड_data.json", "Uttara Kanda", "उत्तर काण्ड")
    ]
    
    total_verses = 0
    verse_counter = {}
    
    for idx, (filename, kanda_name, kanda_hindi) in enumerate(kanda_files, 1):
        filepath = os.path.join(ram_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                verses = []
                verse_num = 0
                for item in data:
                    verse_num += 1
                    verses.append({
                        "scripture_id": scripture_id,
                        "section_type": "kanda",
                        "section_num": idx,
                        "section_name": kanda_name,
                        "section_name_hindi": kanda_hindi,
                        "verse_num": verse_num,
                        "verse_type": item.get("type", ""),
                        "text": item.get("content", ""),
                        "created_at": datetime.now(timezone.utc)
                    })
                
                if verses:
                    await scripture_verses_collection.insert_many(verses)
                    total_verses += len(verses)
                    print(f"   ✓ {kanda_name}: {len(verses)} verses")
    
    return total_verses

async def create_scripture_metadata():
    """Create metadata documents for all scriptures"""
    print("\n📚 Creating scripture metadata...")
    
    for scripture_id, metadata in SCRIPTURES.items():
        # Count actual verses imported
        verse_count = await scripture_verses_collection.count_documents({"scripture_id": scripture_id})
        
        # Get unique sections
        sections = await scripture_verses_collection.distinct("section_num", {"scripture_id": scripture_id})
        
        doc = {
            "scripture_id": scripture_id,
            "name": metadata["name"],
            "name_hindi": metadata["name_hindi"],
            "description": metadata["description"],
            "description_hindi": metadata["description_hindi"],
            "category": metadata["category"],
            "icon": metadata["icon"],
            "total_verses": verse_count,
            "total_sections": len(sections),
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        await scriptures_collection.insert_one(doc)
        print(f"   ✓ {metadata['name']}: {verse_count} verses, {len(sections)} sections")

async def main():
    """Main import function"""
    print("=" * 60)
    print("🙏 DHARMIC DATA IMPORT - bhavykhatri/DharmicData")
    print("=" * 60)
    
    # Clear existing data
    await clear_existing_data()
    
    # Import all scriptures
    totals = {}
    
    totals["Bhagavad Gita"] = await import_bhagavad_gita()
    totals["Valmiki Ramayana"] = await import_valmiki_ramayana()
    totals["Mahabharata"] = await import_mahabharata()
    totals["Rigveda"] = await import_rigveda()
    totals["Atharvaveda"] = await import_atharvaveda()
    totals["Yajurveda"] = await import_yajurveda()
    totals["Ramcharitmanas"] = await import_ramcharitmanas()
    
    # Create metadata
    await create_scripture_metadata()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 IMPORT SUMMARY")
    print("=" * 60)
    for name, count in totals.items():
        print(f"   {name}: {count:,} verses")
    print(f"\n   TOTAL: {sum(totals.values()):,} verses imported")
    print("=" * 60)
    print("✅ Import complete!")

if __name__ == "__main__":
    asyncio.run(main())
