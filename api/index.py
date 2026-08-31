"""
Vercel Serverless Function entry point for MessMate.
Handles all /api/* requests on Vercel's Python runtime.
"""
import sys
import os
from http.server import BaseHTTPRequestHandler

# Add root project folder to sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.server import MessMateRequestHandler
from backend.db import get_db_connection

# Ensure database is auto-initialized on serverless cold starts
try:
    conn = get_db_connection()
    conn.close()
except Exception as e:
    print("Database init warning on Vercel cold-start:", e)

class handler(MessMateRequestHandler):
    """Vercel Python serverless function handler."""
    pass
