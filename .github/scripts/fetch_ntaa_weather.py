"""
C3P - Récupération automatique METAR/TAF/NOTAM + PDFs Aeroweb pour NTAA (Tahiti-Faa'a)
Exécuté par GitHub Actions toutes les 15 minutes.
Source METAR/TAF/NOTAM : metarcentral.com (agrégateur public NOAA/NWS).
Source PDFs : aviation.meteo.fr (Aeroweb — authentification tahiti/tahiti).
Écrit data/weather-ntaa.json à la racine du dépôt.
"""
import base64
import http.cookiejar
import json
import os
import re
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; C3P-Weather-Bot/1.0; +https://github.com/ihpniggel-cyber)'}
OUTPUT_PATH = 'data/weather-ntaa.json'

AEROWEB_LOGIN_URL = 'https://aviation.meteo.fr/login.php'
AEROWEB_DOSSIER_URL = 'https://aviation.meteo.fr/dossier_personnalise_show_html.php'
AEROWEB_ID = '104767'


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


def fetch_aeroweb_ntaa():
    """
    Authentification Aeroweb (tahiti/tahiti) + récupération des PDFs TEMSI/WINTEM NTAA.
    Séquence complète : GET login → POST creds → GET accueil → GET dossier AJAX → DL PDFs.
    Retourne {updated_utc, produits:[{libelle,type,url,pdf_b64,size_kb}], error}.
    """
    result = {
        'updated_utc': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'produits': [],
        'error': None
    }

    BH = {  # headers navigateur réalistes pour ne pas être bloqué comme bot
        'User-Agent': (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/125.0.0.0 Safari/537.36'
        ),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    }

    try:
        jar = http.cookiejar.CookieJar()
        opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

        # — Étape 0 : GET page login (cookies initiaux + tokens CSRF éventuels) —
        with opener.open(
            urllib.request.Request(AEROWEB_LOGIN_URL, headers=BH), timeout=30
        ) as r:
            login_page = r.read().decode('utf-8', errors='replace')

        # Extraire tous les champs <input type="hidden"> du formulaire
        hidden = {}
        for tag in re.findall(r'<input[^>]+>', login_page, re.IGNORECASE):
            t = re.search(r'type=["\']([^"\']*)["\']', tag, re.IGNORECASE)
            n = re.search(r'name=["\']([^"\']*)["\']', tag, re.IGNORECASE)
            v = re.search(r'value=["\']([^"\']*)["\']', tag, re.IGNORECASE)
            if t and t.group(1).lower() == 'hidden' and n:
                hidden[n.group(1)] = v.group(1) if v else ''

        # — Étape 1 : POST login (credentials + tokens CSRF) —
        post_data = {**hidden, 'identifiant': 'tahiti', 'motdepasse': 'tahiti'}
        login_req = urllib.request.Request(
            AEROWEB_LOGIN_URL,
            data=urllib.parse.urlencode(post_data).encode('utf-8'),
            headers={
                **BH,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': AEROWEB_LOGIN_URL,
                'Origin': 'https://aviation.meteo.fr',
            }
        )
        with opener.open(login_req, timeout=30) as r:
            login_final_url = r.geturl()
            r.read()  # consommer le body (accueil.php après redirect)

        # — Étape 2 : GET accueil.php (établit l'état session complet côté serveur) —
        with opener.open(
            urllib.request.Request(
                'https://aviation.meteo.fr/accueil.php',
                headers={**BH, 'Referer': login_final_url}
            ), timeout=30
        ) as r:
            accueil_html = r.read().decode('utf-8', errors='replace')

        if 'Se connecter' in accueil_html or 'motdepasse' in accueil_html.lower():
            result['error'] = 'Authentification Aeroweb échouée — identifiants rejetés'
            return result

        # — Étape 3 : GET dossier NTAA (endpoint AJAX) —
        ts_ms = int(time.time() * 1000)
        qs = urllib.parse.urlencode({
            'id_recent_ordre': '1', 'id': AEROWEB_ID,
            'origine': 'favoris', 'time': ts_ms
        })
        dossier_req = urllib.request.Request(
            f'{AEROWEB_DOSSIER_URL}?{qs}',
            headers={
                **BH,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'text/html, */*; q=0.01',
                'Referer': 'https://aviation.meteo.fr/accueil.php',
            }
        )
        with opener.open(dossier_req, timeout=30) as r:
            dossier_html = r.read().decode('utf-8', errors='replace')

        # — Étape 4 : extraction des liens PDF —
        pdf_urls = list(dict.fromkeys(
            re.findall(r'(?:href|src)=["\']([^"\']*\.pdf)["\']', dossier_html)
        ))

        if not pdf_urls:
            result['error'] = f'Aucun PDF (réponse {len(dossier_html)} o)'
            result['debug_html'] = dossier_html[:800]
            return result

        # — Étape 5 : téléchargement binaire + encodage base64 —
        for rel_url in pdf_urls[:6]:
            abs_url = rel_url if rel_url.startswith('http') else 'https://aviation.meteo.fr' + rel_url
            fname = abs_url.split('/')[-1].lower()

            ptype = ('TEMSI' if ('temsi' in fname or 'tsfc' in fname) else
                     'WINTEM' if ('wintem' in fname or 'wfl' in fname or 'wtem' in fname) else 'PDF')
            label = fname.replace('.pdf', '').replace('_', ' ').upper()
            ctx = re.search(
                r'([A-Za-zÀ-ÿ][^<]{3,60}?)\s*(?:</[^>]+>\s*){1,4}[^<]*' + re.escape(fname),
                dossier_html, re.DOTALL
            )
            if ctx:
                cand = strip_tags(ctx.group(1)).strip()
                if 3 < len(cand) < 80:
                    label = cand

            try:
                pdf_req = urllib.request.Request(
                    abs_url,
                    headers={**BH, 'Referer': 'https://aviation.meteo.fr/accueil.php'}
                )
                with opener.open(pdf_req, timeout=30) as r:
                    pdf_bytes = r.read()
                result['produits'].append({
                    'libelle': label, 'type': ptype, 'url': abs_url,
                    'pdf_b64': base64.b64encode(pdf_bytes).decode('ascii'),
                    'size_kb': round(len(pdf_bytes) / 1024, 1),
                })
            except Exception as e:
                result['produits'].append({
                    'libelle': label, 'type': ptype, 'url': abs_url,
                    'pdf_b64': None, 'error': str(e),
                })

    except Exception as e:
        result['error'] = str(e)

    return result


def main():
    result = {
        'updated_utc': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'source': 'metarcentral.com',
        'metar_raw': None,
        'taf_raw': None,
        'notams': [],
        'aeroweb_ntaa': None,
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

    try:
        result['aeroweb_ntaa'] = fetch_aeroweb_ntaa()
        n_pdfs = len([p for p in (result['aeroweb_ntaa'] or {}).get('produits', []) if p.get('pdf_b64')])
        print(f'Aeroweb: {n_pdfs} PDF(s) téléchargé(s)', end='')
        if result['aeroweb_ntaa'] and result['aeroweb_ntaa'].get('error'):
            print(f' — erreur: {result["aeroweb_ntaa"]["error"]}', end='')
        print()
    except Exception as e:
        result['errors'].append('aeroweb: ' + str(e))

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
