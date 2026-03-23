"""
Google Places API Routes
Handles location autocomplete and place details
"""
from fastapi import APIRouter, HTTPException, Query
import httpx
import os

router = APIRouter(prefix="/api", tags=["Places"])

GOOGLE_PLACES_API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY")


@router.get("/places/autocomplete")
async def places_autocomplete(query: str = Query(..., min_length=2)):
    """Search for places using Google Places Autocomplete API"""
    if not GOOGLE_PLACES_API_KEY:
        raise HTTPException(status_code=500, detail="Google Places API key not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://maps.googleapis.com/maps/api/place/autocomplete/json",
                params={
                    "input": query,
                    "types": "(cities)",
                    "key": GOOGLE_PLACES_API_KEY
                },
                timeout=10.0
            )
            data = response.json()
            
            if data.get("status") == "OK":
                results = []
                for prediction in data.get("predictions", [])[:5]:
                    results.append({
                        "place_id": prediction.get("place_id"),
                        "description": prediction.get("description"),
                        "main_text": prediction.get("structured_formatting", {}).get("main_text"),
                        "secondary_text": prediction.get("structured_formatting", {}).get("secondary_text")
                    })
                return {"status": "ok", "results": results}
            elif data.get("status") == "ZERO_RESULTS":
                return {"status": "ok", "results": []}
            else:
                return {"status": "error", "message": data.get("status"), "results": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Places API error: {str(e)}")


@router.get("/places/details/{place_id}")
async def place_details(place_id: str):
    """Get place details including coordinates using Google Places API"""
    if not GOOGLE_PLACES_API_KEY:
        raise HTTPException(status_code=500, detail="Google Places API key not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://maps.googleapis.com/maps/api/place/details/json",
                params={
                    "place_id": place_id,
                    "fields": "name,formatted_address,geometry,address_components",
                    "key": GOOGLE_PLACES_API_KEY
                },
                timeout=10.0
            )
            data = response.json()
            
            if data.get("status") == "OK":
                result = data.get("result", {})
                geometry = result.get("geometry", {}).get("location", {})
                
                # Extract city, state, country from address components
                address_components = result.get("address_components", [])
                city = state = country = ""
                for component in address_components:
                    types = component.get("types", [])
                    if "locality" in types:
                        city = component.get("long_name")
                    elif "administrative_area_level_1" in types:
                        state = component.get("long_name")
                    elif "country" in types:
                        country = component.get("long_name")
                
                return {
                    "status": "ok",
                    "data": {
                        "name": result.get("name"),
                        "formatted_address": result.get("formatted_address"),
                        "latitude": geometry.get("lat"),
                        "longitude": geometry.get("lng"),
                        "city": city,
                        "state": state,
                        "country": country
                    }
                }
            else:
                return {"status": "error", "message": data.get("status")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Places API error: {str(e)}")
