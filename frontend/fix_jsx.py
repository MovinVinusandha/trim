import sys

with open('src/pages/HomePage.tsx', 'r') as f:
    content = f.read()

# Fix the JSON string in curl
bad_json = """-d <span className="text-amber-300">'{'{'}"campaign_id": "black-friday", "links": [{"url": "https://...", "tags": ["promo"]}]}'</span>"""
good_json = """-d <span className="text-amber-300">{"'{\\"campaign_id\\": \\"black-friday\\", \\"links\\": [{\\"url\\": \\"https://...\\", \\"tags\\": [\\"promo\\"]}]}'"}</span>"""
content = content.replace(bad_json, good_json)

# Fix the > in terminal
bad_term_1 = "> docker-compose up -d<br/>"
good_term_1 = "&gt; docker-compose up -d<br/>"
content = content.replace(bad_term_1, good_term_1)

bad_term_2 = "> Initializing multi-tenant isolation...<br/>"
good_term_2 = "&gt; Initializing multi-tenant isolation...<br/>"
content = content.replace(bad_term_2, good_term_2)

bad_term_3 = "> System ready."
good_term_3 = "&gt; System ready."
content = content.replace(bad_term_3, good_term_3)

with open('src/pages/HomePage.tsx', 'w') as f:
    f.write(content)

print("Fixed JSX!")
