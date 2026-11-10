# Raw data and sources

| Dataset used by the app | Raw source | In this folder? |
|---|---|---|
| `src/data/knowledge/who-growth-standards.json` | WHO Child Growth Standards LMS tables (`weianthro.txt`, `lenanthro.txt`, `hcanthro.txt`, `bmianthro.txt`) from https://github.com/WorldHealthOrganization/anthro (`data-raw/growthstandards`) | Yes: `who/`. Rebuild with `python3 data-raw/build-who-json.py` |
| `src/data/knowledge/vaccination-schedule.json` | IAP-ACVIP 2023 Table I, Indian Pediatrics 2024;61:113-124, https://www.indianpediatrics.net/feb2024/113.pdf | No, published as a PDF. Entered by hand from the table |
| `src/data/knowledge/milestones.json` | CDC "Learn the Signs. Act Early." checklists (2022), https://www.cdc.gov/act-early/milestones/ | No, published as web pages / PDF. Entered from the checklists |
| `src/data/knowledge/parenting-faq.json` | Written for Parento from public WHO/AAP/IAP/CDC guidance | Not an official document |
