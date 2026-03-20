#!/usr/bin/env python3
"""
Startup script for Divine App Backend
"""
import os
import sys
import traceback

# Get port from environment (Cloud Run sets PORT env var)
PORT = int(os.environ.get("PORT", 8080))

print("=" * 60, flush=True)
print("DIVINE APP BACKEND - STARTING", flush=True)
print(f"PORT: {PORT}", flush=True)
print("=" * 60, flush=True)

try:
    print("Importing server...", flush=True)
    from server import app
    print("Server imported OK", flush=True)
except Exception as e:
    print(f"IMPORT ERROR: {e}", flush=True)
    traceback.print_exc()
    sys.exit(1)

print(f"Starting uvicorn on 0.0.0.0:{PORT}...", flush=True)

import uvicorn
uvicorn.run(app, host="0.0.0.0", port=PORT)
