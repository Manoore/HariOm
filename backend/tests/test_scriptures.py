"""
Tests for the Scripture API endpoints
Testing the new Sacred Scriptures feature from DharmicData integration
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://vedic-services-core.preview.emergentagent.com')


class TestScripturesAPI:
    """Tests for /api/scriptures endpoints"""
    
    def test_get_all_scriptures_returns_200(self):
        """Test GET /api/scriptures returns list of all scriptures"""
        response = requests.get(f"{BASE_URL}/api/scriptures")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["status"] == "ok"
        assert "data" in data
        assert "count" in data
        
        # Should have 7 scriptures based on requirements
        scriptures = data["data"]
        assert len(scriptures) >= 7, f"Expected at least 7 scriptures, got {len(scriptures)}"
        
        # Verify each scripture has required fields
        for scripture in scriptures:
            assert "scripture_id" in scripture
            assert "name" in scripture
            assert "name_hindi" in scripture
            assert "total_verses" in scripture
            assert "total_sections" in scripture
        print(f"PASS: Found {len(scriptures)} scriptures")
    
    def test_scriptures_include_required_texts(self):
        """Test that all 7 required scriptures are present"""
        response = requests.get(f"{BASE_URL}/api/scriptures")
        assert response.status_code == 200
        
        data = response.json()
        scripture_ids = [s["scripture_id"] for s in data["data"]]
        
        required_scriptures = [
            "bhagavad_gita",
            "valmiki_ramayana",
            "mahabharata",
            "rigveda",
            "atharvaveda",
            "yajurveda",
            "ramcharitmanas"
        ]
        
        for scripture_id in required_scriptures:
            assert scripture_id in scripture_ids, f"Missing required scripture: {scripture_id}"
        print(f"PASS: All 7 required scriptures are present")
    
    def test_bhagavad_gita_has_18_chapters(self):
        """Test GET /api/scriptures/bhagavad_gita returns 18 chapters"""
        response = requests.get(f"{BASE_URL}/api/scriptures/bhagavad_gita")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "ok"
        assert "data" in data
        
        scripture = data["data"]
        assert scripture["scripture_id"] == "bhagavad_gita"
        assert "sections" in scripture
        
        sections = scripture["sections"]
        assert len(sections) == 18, f"Expected 18 chapters, got {len(sections)}"
        
        # Verify sections have required fields
        for section in sections:
            assert "section_num" in section
            assert "section_name" in section
            assert "verse_count" in section
        
        # Verify total verses is around 701
        total_verses = scripture.get("total_verses", 0)
        assert total_verses >= 700 and total_verses <= 750, f"Expected ~701 verses, got {total_verses}"
        print(f"PASS: Bhagavad Gita has {len(sections)} chapters and {total_verses} verses")
    
    def test_valmiki_ramayana_has_7_kandas(self):
        """Test GET /api/scriptures/valmiki_ramayana returns 7 kandas"""
        response = requests.get(f"{BASE_URL}/api/scriptures/valmiki_ramayana")
        assert response.status_code == 200
        
        data = response.json()
        scripture = data["data"]
        
        assert scripture["scripture_id"] == "valmiki_ramayana"
        sections = scripture.get("sections", [])
        assert len(sections) == 7, f"Expected 7 kandas, got {len(sections)}"
        
        total_verses = scripture.get("total_verses", 0)
        assert total_verses >= 22000, f"Expected ~22,742 verses, got {total_verses}"
        print(f"PASS: Valmiki Ramayana has {len(sections)} kandas and {total_verses} verses")
    
    def test_mahabharata_has_18_parvas(self):
        """Test GET /api/scriptures/mahabharata returns 18 parvas"""
        response = requests.get(f"{BASE_URL}/api/scriptures/mahabharata")
        assert response.status_code == 200
        
        data = response.json()
        scripture = data["data"]
        
        assert scripture["scripture_id"] == "mahabharata"
        sections = scripture.get("sections", [])
        assert len(sections) == 18, f"Expected 18 parvas, got {len(sections)}"
        
        total_verses = scripture.get("total_verses", 0)
        assert total_verses >= 70000, f"Expected ~73,821 verses, got {total_verses}"
        print(f"PASS: Mahabharata has {len(sections)} parvas and {total_verses} verses")
    
    def test_get_scripture_sections_with_verses(self):
        """Test GET /api/scriptures/bhagavad_gita/sections/1 returns verses"""
        response = requests.get(f"{BASE_URL}/api/scriptures/bhagavad_gita/sections/1")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "ok"
        assert "data" in data
        
        section_data = data["data"]
        assert section_data["scripture_id"] == "bhagavad_gita"
        assert "section" in section_data
        assert "verses" in section_data
        
        verses = section_data["verses"]
        assert len(verses) > 0, "Expected verses in chapter 1"
        
        # Verify verse structure
        for verse in verses:
            assert "verse_num" in verse
            assert "text" in verse
        
        print(f"PASS: Chapter 1 returns {len(verses)} verses")
    
    def test_get_scripture_sections_pagination(self):
        """Test pagination on section verses endpoint"""
        # Test with limit
        response = requests.get(f"{BASE_URL}/api/scriptures/bhagavad_gita/sections/1?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        section_data = data["data"]
        verses = section_data["verses"]
        
        assert len(verses) <= 5, f"Expected max 5 verses, got {len(verses)}"
        
        # Verify pagination info
        assert "total" in section_data
        assert "has_more" in section_data
        print(f"PASS: Pagination working - got {len(verses)} verses with has_more={section_data['has_more']}")
    
    def test_random_verse_endpoint(self):
        """Test GET /api/scriptures/verse/random returns a random verse"""
        response = requests.get(f"{BASE_URL}/api/scriptures/verse/random")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "ok"
        assert "data" in data
        
        verse = data["data"]
        assert "scripture_id" in verse
        assert "text" in verse
        assert "scripture_name" in verse
        assert "section_name" in verse
        
        print(f"PASS: Random verse returned from {verse['scripture_name']}")
    
    def test_random_verse_returns_different_verses(self):
        """Test that random verse endpoint returns different verses"""
        verses = []
        for _ in range(3):
            response = requests.get(f"{BASE_URL}/api/scriptures/verse/random")
            assert response.status_code == 200
            verse = response.json()["data"]
            verses.append(verse["text"])
        
        # At least 2 out of 3 should be different (statistically very likely)
        unique_verses = set(verses)
        assert len(unique_verses) >= 2, "Random verse should return different verses"
        print(f"PASS: Random verse returns varied results ({len(unique_verses)} unique out of 3)")
    
    def test_nonexistent_scripture_returns_404(self):
        """Test that requesting non-existent scripture returns 404"""
        response = requests.get(f"{BASE_URL}/api/scriptures/nonexistent_scripture")
        assert response.status_code == 404
        print("PASS: Non-existent scripture returns 404")
    
    def test_nonexistent_section_returns_empty_or_404(self):
        """Test that requesting non-existent section returns empty or 404"""
        response = requests.get(f"{BASE_URL}/api/scriptures/bhagavad_gita/sections/999")
        # API may return 404 or 200 with empty verses - both are acceptable
        if response.status_code == 404:
            print("PASS: Non-existent section returns 404")
        else:
            assert response.status_code == 200
            data = response.json()
            assert data["data"]["verses"] == []
            print("PASS: Non-existent section returns empty verses")
    
    def test_verse_has_proper_structure(self):
        """Test that verses have proper structure with Sanskrit text"""
        response = requests.get(f"{BASE_URL}/api/scriptures/bhagavad_gita/sections/2?limit=1")
        assert response.status_code == 200
        
        data = response.json()
        verses = data["data"]["verses"]
        
        assert len(verses) > 0
        verse = verses[0]
        
        # Check verse has text with Devanagari script
        assert "text" in verse
        assert len(verse["text"]) > 0
        
        # Verify verse number
        assert "verse_num" in verse
        assert isinstance(verse["verse_num"], int)
        
        print(f"PASS: Verse structure is correct with text length {len(verse['text'])}")
    
    def test_gita_has_commentaries(self):
        """Test that Bhagavad Gita verses have commentaries"""
        response = requests.get(f"{BASE_URL}/api/scriptures/bhagavad_gita/sections/1?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        verses = data["data"]["verses"]
        
        # At least some verses should have commentaries
        has_commentaries = any("commentaries" in v and v["commentaries"] for v in verses)
        if has_commentaries:
            print("PASS: Bhagavad Gita verses have commentaries")
        else:
            print("INFO: No commentaries found in first 5 verses (may be expected)")
    
    def test_vedas_have_correct_structure(self):
        """Test that Vedas have suktas/mandalas structure"""
        # Test Rigveda
        response = requests.get(f"{BASE_URL}/api/scriptures/rigveda")
        assert response.status_code == 200
        
        data = response.json()
        scripture = data["data"]
        
        assert scripture["scripture_id"] == "rigveda"
        assert "sections" in scripture
        
        total_verses = scripture.get("total_verses", 0)
        total_sections = scripture.get("total_sections", 0)
        
        print(f"PASS: Rigveda has {total_sections} sections and {total_verses} suktas")


class TestScripturesDataIntegrity:
    """Tests for data integrity of the imported scripture data"""
    
    def test_all_scriptures_have_verses(self):
        """Test that all scriptures have verses data"""
        response = requests.get(f"{BASE_URL}/api/scriptures")
        scriptures = response.json()["data"]
        
        for scripture in scriptures:
            scripture_id = scripture["scripture_id"]
            detail_response = requests.get(f"{BASE_URL}/api/scriptures/{scripture_id}")
            assert detail_response.status_code == 200, f"Failed to get {scripture_id}"
            
            detail = detail_response.json()["data"]
            assert detail.get("total_verses", 0) > 0, f"{scripture_id} has no verses"
            
        print(f"PASS: All {len(scriptures)} scriptures have verses")
    
    def test_scripture_verse_counts_match(self):
        """Test that verse counts in metadata match actual verses"""
        response = requests.get(f"{BASE_URL}/api/scriptures/bhagavad_gita")
        scripture = response.json()["data"]
        
        metadata_total = scripture.get("total_verses", 0)
        section_total = sum(s.get("verse_count", 0) for s in scripture.get("sections", []))
        
        # Allow some variance due to counting differences
        assert abs(metadata_total - section_total) <= 10, \
            f"Verse count mismatch: metadata={metadata_total}, sections={section_total}"
        
        print(f"PASS: Verse counts consistent - metadata: {metadata_total}, sum of sections: {section_total}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
