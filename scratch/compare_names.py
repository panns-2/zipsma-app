import json

# Load active students
with open('scratch/active_students.json', 'r', encoding='utf-8') as f:
    active_students = json.load(f)

active_names = {s['name'].strip().lower(): s for s in active_students}

# Load backup students
fp = r'C:\Users\User\.gemini\antigravity\brain\8a40ee34-664b-4b49-94db-cb2307684728\.system_generated\steps\33\output.txt'
with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
    data = json.load(f)

docs = data.get('documents', [])
feeding_payments_by_student = {}
for doc in docs:
    fields = doc.get('fields', {})
    school_id = fields.get('schoolId', {}).get('stringValue', '')
    if school_id == 'PANNS290':
        name = fields.get('name', {}).get('stringValue', '').strip()
        ledger = fields.get('ledger', {}).get('arrayValue', {}).get('values', [])
        for val in ledger:
            t = val.get('mapValue', {}).get('fields', {})
            credit = float(t.get('credit', {}).get('doubleValue') or t.get('credit', {}).get('integerValue') or 0)
            desc = t.get('description', {}).get('stringValue', '')
            cat = t.get('category', {}).get('stringValue', '')
            if credit > 0 and ('feeding' in desc.lower() or 'feeding' in cat.lower()):
                date = t.get('date', {}).get('stringValue', '')
                pid = t.get('periodId', {}).get('stringValue', '')
                rec = t.get('recordedBy', {}).get('stringValue', '')
                tid = t.get('id', {}).get('stringValue', '')
                if name not in feeding_payments_by_student:
                    feeding_payments_by_student[name] = []
                feeding_payments_by_student[name].append({
                    'credit': credit,
                    'description': desc,
                    'category': cat,
                    'date': date,
                    'periodId': pid,
                    'recordedBy': rec,
                    'id': tid
                })

for name, payments in feeding_payments_by_student.items():
    print(f'Student: {name} ({len(payments)} payments)')
    total_credit = sum(p['credit'] for p in payments)
    print(f'  Total Credit: GH¢ {total_credit:.2f}')
    for p in payments[:3]:
        print(f'    - Date: {p["date"]}, Credit: {p["credit"]}, Cat: {p["category"]}, Desc: {p["description"]}, ID: {p["id"]}')
    if len(payments) > 3:
        print(f'    ... and {len(payments)-3} more')
