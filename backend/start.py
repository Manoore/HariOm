#!/usr/bin/env python3
"""
Startup script for Divine App Backend
This script provides detailed logging during import phase to debug deployment issues
"""
import sys
import traceback

print("=" * 60, flush=True)
print("DIVINE APP BACKEND - STARTUP DIAGNOSTICS", flush=True)
print("=" * 60, flush=True)
print(f"Python version: {sys.version}", flush=True)
print(f"Python path: {sys.executable}", flush=True)
print("", flush=True)

# Test critical imports one by one
imports_to_test = [
    ("fastapi", "from fastapi import FastAPI"),
    ("uvicorn", "import uvicorn"),
    ("motor", "import motor.motor_asyncio"),
    ("pymongo", "from pymongo import MongoClient"),
    ("stripe", "import stripe"),
    ("pydantic", "from pydantic import BaseModel"),
    ("httpx", "import httpx"),
    ("dotenv", "from dotenv import load_dotenv"),
    ("swisseph", "import swisseph as swe"),
    ("emergentintegrations", "from emergentintegrations.payments.stripe.checkout import StripeCheckout"),
    ("firebase_admin", "import firebase_admin"),
]

failed_imports = []

for name, import_statement in imports_to_test:
    try:
        print(f"Testing import: {name}...", end=" ", flush=True)
        exec(import_statement)
        print("OK", flush=True)
    except Exception as e:
        print(f"FAILED: {e}", flush=True)
        failed_imports.append((name, str(e)))

print("", flush=True)

if failed_imports:
    print("=" * 60, flush=True)
    print("FAILED IMPORTS:", flush=True)
    for name, error in failed_imports:
        print(f"  - {name}: {error}", flush=True)
    print("=" * 60, flush=True)
    # Continue anyway to see if server can still start
    print("Attempting to start server despite failed imports...", flush=True)

# Now try to import the actual server module
print("", flush=True)
print("Importing server module...", flush=True)
try:
    from server import app
    print("Server module imported successfully!", flush=True)
except Exception as e:
    print(f"FAILED to import server module: {e}", flush=True)
    print("", flush=True)
    print("Full traceback:", flush=True)
    traceback.print_exc()
    print("", flush=True)
    sys.exit(1)

# Start the server
print("", flush=True)
print("=" * 60, flush=True)
print("Starting uvicorn server on 0.0.0.0:8080...", flush=True)
print("=" * 60, flush=True)

import uvicorn
uvicorn.run(app, host="0.0.0.0", port=8080)
