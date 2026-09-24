#!/usr/bin/env python3
"""
MediScribe AI - Database Seeding Script
Executes the seed_database function to initialize synthetic patients,
demo doctor/admin accounts, and clinical reference baseline data.
"""
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.db.seed import seed_database

if __name__ == "__main__":
    print("Executing MediScribe AI database seeding...")
    seed_database()
    print("Database seeding completed successfully.")
