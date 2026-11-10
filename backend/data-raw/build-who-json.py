"""Rebuilds src/data/knowledge/who-growth-standards.json from the raw WHO tables in data-raw/who/.
Run from the backend folder:  python3 data-raw/build-who-json.py
"""
import csv, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'src', 'data', 'knowledge', 'who-growth-standards.json')

def load(name):
    rows = {'1': [], '2': []}
    with open(os.path.join(HERE, 'who', f'{name}.txt')) as f:
        for row in csv.DictReader(f, delimiter='\t'):
            row = {k.strip(): v.strip() for k, v in row.items()}
            rows[row['sex']].append((int(row['age']), float(row['l']), float(row['m']), float(row['s'])))
    for k in rows:
        rows[k].sort()
        assert [a for a, *_ in rows[k]] == list(range(len(rows[k]))), name
    return rows

out = {
    "source": "WHO Child Growth Standards (2006). LMS parameters by age in days (0-1856), taken unmodified from the World Health Organization's official 'anthro' package: https://github.com/WorldHealthOrganization/anthro (data-raw/growthstandards).",
    "method": "z = ((x/M)^L - 1) / (L*S). For weight-for-age and BMI-for-age WHO restricts the LMS model beyond +/-3 SD and uses the SD3/SD23 extrapolation; this is implemented in knowledge.service.ts. Length is used below 731 days (lying), height from 731 days (standing).",
    "sexCodes": {"1": "MALE", "2": "FEMALE"},
    "columns": ["L", "M", "S"],
    "indicators": {},
}
files = {"weight": "weianthro", "lengthHeight": "lenanthro", "headCircumference": "hcanthro", "bmi": "bmianthro"}
for key, f in files.items():
    d = load(f)
    out["indicators"][key] = {"MALE": [[l, m, s] for _, l, m, s in d['1']], "FEMALE": [[l, m, s] for _, l, m, s in d['2']]}
with open(OUT, 'w') as fh:
    json.dump(out, fh, separators=(',', ':'))
print('wrote', os.path.normpath(OUT))
