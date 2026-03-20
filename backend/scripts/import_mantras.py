"""
Script to import mantras from stotra-sangrahah repository into MongoDB
"""
import os
import re
import sys
from datetime import datetime, timezone

# Import settings to use correct MongoDB connection
sys.path.insert(0, '/app/backend')
from config import settings
from pymongo import MongoClient

# MongoDB connection using settings
MONGO_URL = settings.MONGO_URL

# Deity name mappings
DEITY_MAPPINGS = {
    'ganesha': {'name': 'Ganesha', 'name_hindi': 'गणेश', 'category': 'Ganesha'},
    'shiva': {'name': 'Shiva', 'name_hindi': 'शिव', 'category': 'Shiva'},
    'vishnu': {'name': 'Vishnu', 'name_hindi': 'विष्णु', 'category': 'Vishnu'},
    'krishna': {'name': 'Krishna', 'name_hindi': 'कृष्ण', 'category': 'Krishna'},
    'rama': {'name': 'Rama', 'name_hindi': 'राम', 'category': 'Rama'},
    'hanuman': {'name': 'Hanuman', 'name_hindi': 'हनुमान', 'category': 'Hanuman'},
    'lakshmi': {'name': 'Lakshmi', 'name_hindi': 'लक्ष्मी', 'category': 'Lakshmi'},
    'saraswati': {'name': 'Saraswati', 'name_hindi': 'सरस्वती', 'category': 'Saraswati'},
    'shakti': {'name': 'Shakti/Durga', 'name_hindi': 'शक्ति/दुर्गा', 'category': 'Shakti'},
    'subrahmanya': {'name': 'Subrahmanya/Kartikeya', 'name_hindi': 'सुब्रह्मण्य/कार्तिकेय', 'category': 'Subrahmanya'},
    'venkatesha': {'name': 'Venkatesha/Balaji', 'name_hindi': 'वेंकटेश/बालाजी', 'category': 'Venkatesha'},
    'navagraha': {'name': 'Navagraha', 'name_hindi': 'नवग्रह', 'category': 'Navagraha'},
    'guru': {'name': 'Guru', 'name_hindi': 'गुरु', 'category': 'Guru'},
    'dhyanam': {'name': 'Dhyana/Meditation', 'name_hindi': 'ध्यान', 'category': 'Dhyana'},
    'other': {'name': 'Other', 'name_hindi': 'अन्य', 'category': 'Other'},
    'shatanama': {'name': 'Shatanama (108 Names)', 'name_hindi': 'शतनाम', 'category': 'Shatanama'},
    'big': {'name': 'Long Stotras', 'name_hindi': 'बड़े स्तोत्र', 'category': 'Long'},
    'adhyatma-ramayana-stotras': {'name': 'Adhyatma Ramayana', 'name_hindi': 'अध्यात्म रामायण', 'category': 'Ramayana'},
    'shasta': {'name': 'Shasta/Ayyappa', 'name_hindi': 'शास्ता/अय्यप्पा', 'category': 'Shasta'},
    'nadi': {'name': 'Nadi/Rivers', 'name_hindi': 'नदी', 'category': 'Nadi'},
    'purti': {'name': 'Purti', 'name_hindi': 'पूर्ति', 'category': 'Purti'},
}

def clean_latex(text):
    """Remove LaTeX commands and clean the text"""
    # Remove comments
    text = re.sub(r'%.*$', '', text, flags=re.MULTILINE)
    
    # Remove common LaTeX commands
    text = re.sub(r'\\sect\{([^}]*)\}', r'\1', text)
    text = re.sub(r'\\uvacha\{([^}]*)\}', r'॥ \1 ॥\n', text)
    text = re.sub(r'\\fourlineindentedshloka', '', text)
    text = re.sub(r'\\twolineindentedshloka', '', text)
    text = re.sub(r'\\shloka', '', text)
    text = re.sub(r'\\begin\{[^}]*\}', '', text)
    text = re.sub(r'\\end\{[^}]*\}', '', text)
    text = re.sub(r'\\[a-zA-Z]+\*?\{([^}]*)\}', r'\1', text)
    text = re.sub(r'\\[a-zA-Z]+', '', text)
    
    # Clean up braces and formatting
    text = re.sub(r'\{([^}]*)\}', r'\1', text)
    text = re.sub(r'[{}]', '', text)
    
    # Clean up whitespace
    text = re.sub(r'\n\s*\n', '\n\n', text)
    text = text.strip()
    
    return text

def extract_title(content, filename):
    """Extract title from LaTeX content"""
    # Try to find \sect{...} pattern
    match = re.search(r'\\sect\{([^}]+)\}', content)
    if match:
        return match.group(1)
    
    # Fallback to filename
    name = os.path.splitext(filename)[0]
    # Convert CamelCase to spaces
    name = re.sub(r'([a-z])([A-Z])', r'\1 \2', name)
    return name

def parse_stotra_file(filepath, deity_folder):
    """Parse a single stotra file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        filename = os.path.basename(filepath)
        title = extract_title(content, filename)
        
        # Clean the content
        verses = clean_latex(content)
        
        # Get deity info
        deity_info = DEITY_MAPPINGS.get(deity_folder, {'name': deity_folder.title(), 'name_hindi': '', 'category': 'Other'})
        
        return {
            'title': title,
            'title_english': re.sub(r'([a-z])([A-Z])', r'\1 \2', os.path.splitext(filename)[0]),
            'deity': deity_info['name'],
            'deity_hindi': deity_info['name_hindi'],
            'category': deity_info['category'],
            'verses': verses,
            'script_language': 'Sanskrit',  # Changed from 'language' to avoid MongoDB text index issue
            'source': 'stotra-sangrahah',
            'source_url': f'https://github.com/stotrasamhita/stotra-sangrahah/blob/master/stotras/{deity_folder}/{filename}',
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc),
            'is_active': True
        }
    except Exception as e:
        print(f"Error parsing {filepath}: {e}")
        return None

def import_mantras(stotras_path):
    """Import all mantras from the stotras folder"""
    client = MongoClient(MONGO_URL)
    # Use devotional_content database like database.py
    db = client['devotional_content']
    mantras_collection = db['mantras']
    
    # Clear existing mantras from this source
    result = mantras_collection.delete_many({'source': 'stotra-sangrahah'})
    print(f"Cleared {result.deleted_count} existing mantras from stotra-sangrahah")
    
    mantras = []
    
    # Walk through all deity folders
    for deity_folder in os.listdir(stotras_path):
        deity_path = os.path.join(stotras_path, deity_folder)
        
        if not os.path.isdir(deity_path):
            continue
        
        print(f"Processing: {deity_folder}")
        
        # Process all .tex files
        for filename in os.listdir(deity_path):
            if not filename.endswith('.tex'):
                continue
            
            filepath = os.path.join(deity_path, filename)
            mantra = parse_stotra_file(filepath, deity_folder)
            
            if mantra and mantra['verses']:
                mantras.append(mantra)
                print(f"  - {mantra['title']}")
    
    # Insert all mantras
    if mantras:
        result = mantras_collection.insert_many(mantras)
        print(f"\nSuccessfully imported {len(result.inserted_ids)} mantras!")
    else:
        print("No mantras found to import")
    
    # Print summary by category
    print("\n=== Summary by Category ===")
    pipeline = [
        {'$match': {'source': 'stotra-sangrahah'}},
        {'$group': {'_id': '$category', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}}
    ]
    for item in mantras_collection.aggregate(pipeline):
        print(f"  {item['_id']}: {item['count']} mantras")
    
    client.close()
    return len(mantras)

if __name__ == '__main__':
    stotras_path = '/tmp/stotra-sangrahah/stotras'
    
    if not os.path.exists(stotras_path):
        print(f"Error: Stotras path not found: {stotras_path}")
        print("Please clone the repo first: git clone https://github.com/stotrasamhita/stotra-sangrahah.git /tmp/stotra-sangrahah")
        sys.exit(1)
    
    count = import_mantras(stotras_path)
    print(f"\nTotal mantras imported: {count}")
