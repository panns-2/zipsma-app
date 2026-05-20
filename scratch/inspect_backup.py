import json

fp = r'C:\Users\User\.gemini\antigravity\brain\8a40ee34-664b-4b49-94db-cb2307684728\.system_generated\steps\33\output.txt'
with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
    data = json.load(f)

docs = data.get('documents', [])
feeding_payments = []
for doc in docs:
    fields = doc.get('fields', {})
    school_id = fields.get('schoolId', {}).get('stringValue', '')
    if school_id == 'PANNS290':
        name = fields.get('name', {}).get('stringValue', '')
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
                feeding_payments.append({
                    'student_name': name,
                    'credit': credit,
                    'description': desc,
                    'category': cat,
                    'date': date,
                    'periodId': pid,
                    'recordedBy': rec,
                    'id': tid
                })

print('Found', len(feeding_payments), 'feeding payments in April 24 backup:')
for idx, p in enumerate(feeding_payments[:15]):
    print(f'  {idx+1}. Student: {p["student_name"]}, Date: {p["date"]}, Credit: {p["credit"]}, Cat: {p["category"]}, Desc: {p["description"]}, ID: {p["id"]}')
if len(feeding_payments) > 15:
    print('  ... and', len(feeding_payments) - 15, 'more')
