#!/usr/bin/env python3
"""
MessMate Launcher
Simple Food & Mess Management System
"""
import sys
import os

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.server import run_server

if __name__ == '__main__':
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    print("=" * 60)
    print("  MessMate — Simple Food & Mess Management")
    print(f"  Starting local server on http://localhost:{port}")
    print("=" * 60)
    run_server(port)
