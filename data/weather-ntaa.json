"""
C3P - Récupération automatique METAR/TAF/NOTAM pour NTAA (Tahiti-Faa'a)
Exécuté par GitHub Actions toutes les 15 minutes.
Source : metarcentral.com (agrégateur public NOAA/NWS).
Écrit data/weather-ntaa.json à la racine du dépôt.

V2 : ajoute une traduction française de chaque NOTAM (champ "desc_fr"),
avec mise en cache pour ne retraduire que les NOTAM nouveaux ou modifiés
(le texte anglais original "desc" reste toujours présent et fait foi).
"""
import json
import os
import re
import time
import urllib.request
from datetime import datetime, timezone

HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; C3P-Weather-Bot/1.0; +https://github.com/ihpniggel-cyber)'}
OUTPUT_PATH = 'data/weather-ntaa.json'


def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode('utf-8', errors='replace')


def strip_tags(html):
    text = re.sub(r'<[^>]*>', ' ', html)
    text = text.replace('&amp;', '&')
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def extract_metar(text):
    m = re.search(r'METAR\s+NTAA\s+\d{6}Z.*?(?=\s(?:Clouds|Weather Briefing))', text)
    return m.group(0).strip() if m else None


def extract_taf(text):
    m = re.search(r'TAF\s+NTAA\s+\d{6}Z.*?(?=\s(?:Detailed TAF Table|Forecast Periods|Upcoming Changes))', text)
    return m.group(0).strip() if m else None


def extract_notams(text):
    pattern = re.compile(
        r'NOTAM:\s*([A-Za-z0-9]+/\d+)\s*\|\s*(?:Q-Code:\s*([A-Z]*)\s*\|\s*)?Priority:\s*(\d+).*?'
        r'(ACTIVE|UPCOMING[^E]*?)?\s*Effective From\s*(.*?)\s*Expires\s*(.*?)\s*'
        r'NOTAM Description\s*(.*?)(?:\s*THE FRENCH VERSION[^N]*|\s*(?=NOTAM:)|$)'
    )
    entries = []
    for m in pattern.finditer(text):
        status = 'upcoming' if (m.group(4) or '').startswith('UPCOMING') else 'active'
        entries.append({
            'id': m.group(1),
            'qcode': m.group(2) or '',
            'status': status,
            'effFrom': m.group(5).strip(),
            'expires': m.group(6).strip(),
            'desc': m.group(7).strip(),
        })
        if len(entries) >= 30:
            break
    return entries


def load_previous_translations():
    """Relit le fichier JSON déjà publié pour réutiliser les traductions déjà faites."""
    cache = {}
    try:
        with open(OUTPUT_PATH, encoding='utf-8') as f:
            previous = json.load(f)
        for n in previous.get('notams', []):
            if n.get('desc') and n.get('desc_fr'):
                cache[(n['id'], n['desc'])] = n['desc_fr']
    except Exception:
        pass
    return cache


def translate_notams(entries):
    """Traduit desc -> desc_fr, en réutilisant le cache pour les NOTAM inchangés."""
    cache = load_previous_translations()
    try:
        from deep_translator import GoogleTranslator
        translator = GoogleTranslator(source='en', target='fr')
    except Exception as e:
        for n in entries:
            n['desc_fr'] = cache.get((n['id'], n['desc']))
            n['desc_fr_error'] = None if n['desc_fr'] else ('module de traduction indisponible: ' + str(e))
        return entries

    for n in entries:
        key = (n['id'], n['desc'])
        if key in cache:
            n['desc_fr'] = cache[key]
            n['desc_fr_error'] = None
            continue
        try:
            n['desc_fr'] = translator.translate(n['desc'])
            n['desc_fr_error'] = None
            time.sleep(0.6)
        except Exception as e:
            n['desc_fr'] = None
            n['desc_fr_error'] = str(e)
    return entries


def main():
    result = {
        'updated_utc': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'source': 'metarcentral.com',
        'metar_raw': None,
        'taf_raw': None,
        'notams': [],
        'errors': []
    }

    try:
        metar_page = strip_tags(fetch('https://metarcentral.com/airport/NTAA'))
        result['metar_raw'] = extract_metar(metar_page)
        if not result['metar_raw']:
            result['errors'].append('metar: motif non trouvé dans la page (structure du site a peut-être changé)')
    except Exception as e:
        result['errors'].append('metar: ' + str(e))

    try:
        taf_page = strip_tags(fetch('https://metarcentral.com/airport/NTAA/taf'))
        result['taf_raw'] = extract_taf(taf_page)
        if not result['taf_raw']:
            result['errors'].append('taf: motif non trouvé dans la page (structure du site a peut-être changé)')
    except Exception as e:
        result['errors'].append('taf: ' + str(e))

    try:
        notam_page = strip_tags(fetch('https://metarcentral.com/airport/NTAA/notam'))
        entries = extract_notams(notam_page)
        result['notams'] = translate_notams(entries)
    except Exception as e:
        result['errors'].append('notam: ' + str(e))

    os.makedirs('data', exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print('METAR:', result['metar_raw'])
    print('TAF:', result['taf_raw'])
    print('NOTAMs:', len(result['notams']), '- traduits:', sum(1 for n in result['notams'] if n.get('desc_fr')))
    if result['errors']:
        print('Erreurs:', result['errors'])


if __name__ == '__main__':
    main()
