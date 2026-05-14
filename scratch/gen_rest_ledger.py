
import json

# Original ledger from the file
ledger = [
    {
        "category": "Tuition Fee",
        "credit": 0,
        "date": "2026-04-10",
        "debit": 650,
        "description": "Tuition Fee",
        "id": "1777968701547-0",
        "periodId": "2025-2026-T6679",
        "recordedBy": "7prS8z8iPJOAXWBaUjNWaCSM7d03",
        "type": "fee"
    },
    {
        "category": "Writing & Art Materials",
        "credit": 0,
        "date": "2026-04-10",
        "debit": 80,
        "description": "Writing & Art Materials",
        "id": "1777982008676-0",
        "periodId": "2025-2026-T6679",
        "recordedBy": "7prS8z8iPJOAXWBaUjNWaCSM7d03",
        "type": "fee"
    },
    {
        "category": "Examination Fee",
        "credit": 0,
        "date": "2026-04-10",
        "debit": 40,
        "description": "Examination Fee",
        "id": "1777984336081-0",
        "periodId": "2025-2026-T6679",
        "recordedBy": "7prS8z8iPJOAXWBaUjNWaCSM7d03",
        "type": "fee"
    },
    {
        "category": "UVkoQZLvPc9ry4WMsf0K",
        "credit": 0,
        "date": "2026-04-10",
        "debit": 1105,
        "description": "Feeding Fee",
        "id": "1778013734152",
        "periodId": "2025-2026-T6679",
        "recordedBy": "7prS8z8iPJOAXWBaUjNWaCSM7d03"
    },
    {
        "category": "UVkoQZLvPc9ry4WMsf0K",
        "credit": 0,
        "date": "2026-04-10",
        "debit": 1105,
        "description": "Feeding Fee",
        "id": "1778014649685",
        "periodId": "2025-2026-T6679",
        "recordedBy": "7prS8z8iPJOAXWBaUjNWaCSM7d03"
    },
    {
        "category": "UVkoQZLvPc9ry4WMsf0K",
        "credit": 0,
        "date": "2026-04-10",
        "debit": 1105,
        "description": "Feeding Fee",
        "id": "1778014730382",
        "periodId": "2025-2026-T6679",
        "recordedBy": "7prS8z8iPJOAXWBaUjNWaCSM7d03"
    },
    {
        "category": "UVkoQZLvPc9ry4WMsf0K",
        "credit": 0,
        "date": "2026-04-10",
        "debit": 1105,
        "description": "Feeding Fee",
        "id": "1778015101928",
        "periodId": "2025-2026-T6679",
        "recordedBy": "7prS8z8iPJOAXWBaUjNWaCSM7d03"
    },
    {
        "category": "UVkoQZLvPc9ry4WMsf0K",
        "credit": 0,
        "date": "2026-04-10",
        "debit": 1105,
        "description": "Feeding Fee",
        "id": "1778016554215",
        "periodId": "2025-2026-T6679",
        "recordedBy": "7prS8z8iPJOAXWBaUjNWaCSM7d03"
    },
    {
        "category": "Feeding Fee",
        "credit": 0,
        "date": "2026-04-10",
        "debit": 1105,
        "description": "Feeding Fee",
        "id": "1778039681129-0",
        "periodId": "2025-2026-T6679",
        "recordedBy": "7prS8z8iPJOAXWBaUjNWaCSM7d03",
        "type": "fee"
    },
    {
        "category": "UVkoQZLvPc9ry4WMsf0K",
        "credit": 0,
        "date": "2026-05-05",
        "debit": 17,
        "description": "Daily Fee Deduction",
        "id": "auto-df-UVkoQZLvPc9ry4WMsf0K-2026-05-05-1778040525300",
        "periodId": "2025-2026-T6679",
        "recordedBy": "7prS8z8iPJOAXWBaUjNWaCSM7d03",
        "type": "fee"
    },
    {
        "category": "RG1IMFigQWvgquoqy4vP",
        "credit": 0,
        "date": "2026-05-05",
        "debit": 2,
        "description": "Daily Fee Deduction",
        "id": "auto-df-RG1IMFigQWvgquoqy4vP-2026-05-05-1778040525300",
        "periodId": "2025-2026-T6679",
        "recordedBy": "7prS8z8iPJOAXWBaUjNWaCSM7d03",
        "type": "fee"
    }
]

def to_firestore_value(v):
    if isinstance(v, bool):
        return {"booleanValue": v}
    if isinstance(v, int):
        return {"integerValue": str(v)}
    if isinstance(v, float):
        return {"doubleValue": v}
    if isinstance(v, str):
        return {"stringValue": v}
    if isinstance(v, list):
        return {"arrayValue": {"values": [to_firestore_value(i) for i in v]}}
    if isinstance(v, dict):
        return {"mapValue": {"fields": {k: to_firestore_value(val) for k, val in v.items()}}}
    return {"nullValue": None}

# Process the ledger
for t in ledger:
    desc = t.get('description', '').lower()
    cat = str(t.get('category', '')).lower()
    if 'feeding' in desc or 'feeding' in cat or t.get('category') == 'UVkoQZLvPc9ry4WMsf0K':
        t['isVoided'] = True
        t['voidedReason'] = "Admin Manual Clear (Antigravity)"

rest_ledger = to_firestore_value(ledger)
print(json.dumps(rest_ledger, indent=2))
