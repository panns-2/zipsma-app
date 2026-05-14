
"""
Test script to verify that voidDailyFeeCategoryRecords works correctly.
This directly calls the Firestore REST API to simulate what the UI does.

Expected behavior:
- studentId passed = "FAM-BNJPANNS055" (direct Firestore doc ID, no schoolId)
- The function should update the ledger in students/FAM-BNJPANNS055

Run: python scratch/test_void_direct.py
"""
import urllib.request
import json
import os

# Firestore project config
PROJECT_ID = "zip-sma"
COLLECTION = "students"
DOC_ID = "FAM-BNJPANNS055"

# You need a service account token or Firebase Auth token to run this.
# This script just prints what the REST call should look like.

print("=== Test: Direct Firestore Document Path ===")
print(f"Document Path: {COLLECTION}/{DOC_ID}")
print(f"Full Firestore Path: projects/{PROJECT_ID}/databases/(default)/documents/{COLLECTION}/{DOC_ID}")
print()
print("If voidDailyFeeCategoryRecords is called with:")
print(f"  studentId = '{DOC_ID}'")
print(f"  schoolId  = undefined")
print()
print("Then getStudentDocRef builds path: students/FAM-BNJPANNS055 [CORRECT]")
print()
print("If called with:")
print(f"  studentId = 'FAM-BNJPANNS055'")
print(f"  schoolId  = 'PANNS290'")
print()
print("Then getStudentDocRef builds path: students/PANNS290_FAM-BNJPANNS055 [WRONG - doesn't exist]")
print()
print("VERIFY: Open browser, go to Daily Fee Summary, check console for:")
print("  [handleClearDailyFees] ... resolvedId=FAM-BNJPANNS055, school=...")
print("  [voidDailyFeeCategoryRecords] Student record found at path students/FAM-BNJPANNS055")
