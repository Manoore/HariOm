"""
One-time migration script to fix approval_status for verified priests.

Run this on your production database to fix the data inconsistency:
  python scripts/fix_approval_status.py

This will:
1. Find all priests with is_verified=true but approval_status != 'approved'
2. Update them to have approval_status='approved'
3. Do the same for astrologers and shops
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Get MongoDB connection from environment
MONGO_URL = os.environ.get('MONGO_URL', '')
DB_NAME = os.environ.get('DB_NAME', 'divine_app')

async def fix_approval_status():
    if not MONGO_URL:
        print("ERROR: MONGO_URL not set")
        return
    
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Fix priests
    priests_result = await db.priests.update_many(
        {
            "is_verified": True,
            "$or": [
                {"approval_status": {"$ne": "approved"}},
                {"approval_status": {"$exists": False}}
            ]
        },
        {"$set": {"approval_status": "approved"}}
    )
    print(f"Fixed {priests_result.modified_count} priests")
    
    # Fix astrologers
    astrologers_result = await db.astrologers.update_many(
        {
            "is_verified": True,
            "$or": [
                {"approval_status": {"$ne": "approved"}},
                {"approval_status": {"$exists": False}}
            ]
        },
        {"$set": {"approval_status": "approved"}}
    )
    print(f"Fixed {astrologers_result.modified_count} astrologers")
    
    # Fix shops
    shops_result = await db.shops.update_many(
        {
            "is_verified": True,
            "$or": [
                {"approval_status": {"$ne": "approved"}},
                {"approval_status": {"$exists": False}}
            ]
        },
        {"$set": {"approval_status": "approved"}}
    )
    print(f"Fixed {shops_result.modified_count} shops")
    
    print("Done!")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_approval_status())
