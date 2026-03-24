#!/usr/bin/env python3
"""Seed MongoDB with Hindu temple data from rishabhmodi03/hindu-temples repo"""
import asyncio
import json
import os
import httpx
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "divine_app")

STATES_URL = "https://raw.githubusercontent.com/rishabhmodi03/hindu-temples/master/data/hindu_temples.json"
DEITIES_URL = "https://raw.githubusercontent.com/rishabhmodi03/hindu-temples/master/data/dieties.json"


async def seed_temples():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    temples_col = db["temples"]
    deities_col = db["temple_deities"]

    # Check if already seeded
    existing = await temples_col.count_documents({})
    if existing > 0:
        print(f"Temples collection already has {existing} documents. Dropping and re-seeding...")
        await temples_col.drop()
        await deities_col.drop()

    async with httpx.AsyncClient(timeout=60) as http:
        # Fetch states/temples data
        print("Fetching temple data by states...")
        resp = await http.get(STATES_URL)
        states_data = resp.json()

        # Fetch deities data
        print("Fetching temple data by deities...")
        resp2 = await http.get(DEITIES_URL)
        deities_data = resp2.json()

    # Build deity lookup: temple_name -> deity
    deity_lookup = {}
    for deity_name, deity_temples in deities_data.items():
        for t in deity_temples:
            deity_lookup[t["name"]] = deity_name

    # Insert temples
    temples = []
    for state, state_temples in states_data.items():
        for t in state_temples:
            temple_doc = {
                "name": t["name"],
                "state": state,
                "deity": deity_lookup.get(t["name"], ""),
                "info": t.get("info", ""),
                "story": t.get("story", ""),
                "visiting_guide": t.get("visiting_guide", ""),
                "architecture": t.get("architecture", ""),
                "mention_in_scripture": t.get("mention_in_scripture", ""),
                "created_at": datetime.now(timezone.utc),
            }
            temples.append(temple_doc)

    if temples:
        result = await temples_col.insert_many(temples)
        print(f"Inserted {len(result.inserted_ids)} temples")

    # Create indexes
    await temples_col.create_index("state")
    await temples_col.create_index("deity")
    await temples_col.create_index("name")
    await temples_col.create_index([("name", "text"), ("state", "text"), ("deity", "text"), ("info", "text")])

    # Insert deities summary
    deity_docs = []
    for deity_name, deity_temples in deities_data.items():
        deity_docs.append({
            "name": deity_name,
            "temple_count": len(deity_temples),
            "temple_names": [t["name"] for t in deity_temples],
            "created_at": datetime.now(timezone.utc),
        })

    if deity_docs:
        await deities_col.insert_many(deity_docs)
        print(f"Inserted {len(deity_docs)} deity records")

    # Print summary
    states_list = list(states_data.keys())
    print(f"\nSummary:")
    print(f"  Total temples: {len(temples)}")
    print(f"  States covered: {len(states_list)}")
    print(f"  Deities: {list(deities_data.keys())}")

    client.close()
    print("\nDone!")


if __name__ == "__main__":
    asyncio.run(seed_temples())
