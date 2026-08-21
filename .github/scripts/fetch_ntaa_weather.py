"""
C3P - Récupération automatique METAR/TAF/NOTAM + PDFs Aeroweb pour NTAA (Tahiti-Faa'a)
Exécuté par GitHub Actions toutes les 15 minutes.

Source METAR/TAF : aviationweather.gov (API officielle NOAA/NWS Aviation Weather Center,
  format JSON documenté, couverture mondiale y compris NTAA — confirmé).
  -----------------------------------------------------------------------------------
  ⚠️ CHANGEMENT (voir changelog) : la source METAR/TAF était auparavant metarcentral.com,
  scrapée par regex sur le HTML de la page. Deux pannes distinctes et cumulatives ont été
  diagnostiquées le 21/08/2026 :
    1. metarcentral.com a refondu son site ; le nouveau template affiche désormais
       "Loading weather data..." — les données METAR/TAF semblent chargées en JS après coup,
       donc invisibles à un fetch HTML statique (urllib), regex ou pas.
    2. Au moment du diagnostic, le site renvoyait en plus une page d'erreur PHP/Redis
       fatale (RedisException MISCONF), donc indisponible même pour un navigateur.
  On abandonne donc ce site comme source METAR/TAF au profit de l'API officielle AWC,
  qui renvoie du JSON structuré (pas de parsing fragile) et n'a aucune dépendance à la
  mise en page d'un site tiers. Le NOTAM reste scrapé sur metarcentral.com (page distincte,
  non vérifiée comme touchée par les mêmes pannes) ; si elle casse à son tour, l'erreur
  sera loggée dans "errors" comme avant — jamais de correction silencieuse.
Source PDFs : aviation.meteo.fr (Aeroweb — authentification tahiti/tahiti).
Écrit data/weather-ntaa.json à la racine du dépôt.
"""
import base64
import json
import os
import re
import time
import urllib.request
from datetime import datetime, timezone

HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; C3P-Weather-Bot/1.0; +https://github.com/ihpniggel-cyber)'}
OUTPUT_PATH = 'data/weather-ntaa.json'

AEROWEB_LOGIN_URL = 'https://aviation.meteo.fr/login.php'
AEROWEB_DOSSIER_URL = 'https://aviation.meteo.fr/dossier_personnalise_show_html.php'
AEROWEB_ID = '104767'

AWC_METAR_URL = 'https://aviationweather.gov/api/data/metar?ids=NTAA&format=json&hours=2'
AWC_TAF_URL   = 'https://aviationweather.gov/api/data/taf?ids=NTAA&format=json'


def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode('utf-8', errors='replace')


def fetch_json(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode('utf-8', errors='replace'))


def fetch_metar_awc():
    """METAR NTAA via l'API officielle aviationweather.gov (JSON, pas de parsing HTML)."""
    data = fetch_json(AWC_METAR_URL)
    if isinstance(data, list) and data:
        raw = data[0].get('rawOb')
        if raw:
            return raw.strip()
    return None


def fetch_taf_awc():
    """TAF NTAA via l'API officielle aviationweather.gov (JSON, pas de parsing HTML)."""
    data = fetch_json(AWC_TAF_URL)
    if isinstance(data, list) and data:
        raw = data[0].get('rawTAF') or data[0].get('rawTaf')
        if raw:
            return raw.strip()
    return None


def strip_tags(html):
    text = re.sub(r'<[^>]*>', ' ', html)
    text = text.replace('&amp;', '&')
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


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
    Récupération PDFs TEMSI/WINTEM Aeroweb via navigateur headless Playwright/Chromium.
    Le fetch AJAX est exécuté depuis le contexte JS de la page (cookies session inclus
    automatiquement, pas de CORS, pas de CSRF à extraire manuellement).
    """
    result = {
        'updated_utc': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'produits': [],
        'error': None
    }
    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True, channel="chromium")
            ctx = browser.new_context(locale='fr-FR')
            page = ctx.new_page()

            # — Étape 1 : login —
            page.goto('https://aviation.meteo.fr/login.php', timeout=30000,
                      wait_until='domcontentloaded')
            page.wait_for_timeout(2000)  # JS rendering

            # Champs réels : id="login" et id="password"
            # Le mot de passe est hashé MD5 côté JS par valid() — Playwright l'exécute.
            page.locator('#login').fill('tahiti', timeout=8000)
            page.locator('#password').fill('tahiti', timeout=8000)
            # Le bouton appelle valid() qui envoie AJAX + redirige vers accueil.php
            page.locator('input[type="submit"], button[type="submit"], button').first.click(timeout=5000)
            # Attendre la navigation post-AJAX vers accueil.php
            try:
                page.wait_for_url('**/accueil**', timeout=15000)
            except Exception:
                page.wait_for_load_state('networkidle', timeout=10000)

            if 'accueil' not in page.url:
                result['error'] = (
                    f'Authentification échouée (URL: {page.url}, '
                    f'titre: {page.title()})'
                )
                result['debug_html'] = page.content()[:2000]
                browser.close()
                return result

            # — Étape 2 : fetch AJAX dossier NTAA exécuté depuis le contexte navigateur —
            #   Avantage : cookies de session inclus automatiquement par le navigateur,
            #   même-origine donc pas de CORS, X-Requested-With transmis sans blocage.
            ts_ms = int(time.time() * 1000)
            dossier_html = page.evaluate(f"""async () => {{
                const r = await fetch(
                    '/dossier_personnalise_show_html.php'
                    + '?id_recent_ordre=1&id={AEROWEB_ID}&origine=favoris&time={ts_ms}',
                    {{
                        headers: {{'X-Requested-With': 'XMLHttpRequest'}},
                        credentials: 'include'
                    }}
                );
                return await r.text();
            }}""")

            # — Étape 3 : extraction des documents via newwindow('affiche_image.php?mode=pdf&...') —
            # Aeroweb ne met PAS de liens .pdf directs ; les cartes sont servies par affiche_image.php
            # Structure : <td width:150px>LABEL</td> ... newwindow('affiche_image.php?mode=pdf&...')
            carte_entries = re.findall(
                r"<td[^>]*width:150px[^>]*>\s*([^<]+?)\s*</td>.*?newwindow\(['\"]([^'\"]+mode=pdf[^'\"]*)['\"]",
                dossier_html, re.DOTALL
            )
            # VAG (cendres volcaniques) : affiche_vagtcag.php, on prend le plus récent
            vag_urls = re.findall(r"newwindow\('(affiche_vagtcag\.php\?mode=pdf[^']+)'\)", dossier_html)

            pdf_entries = [(label.strip().rstrip(':'), url) for label, url in carte_entries]
            existing_urls = {url for _, url in pdf_entries}
            for vag_url in vag_urls:
                if vag_url not in existing_urls:
                    pdf_entries.append(('VAG Cendres volcaniques', vag_url))
                    existing_urls.add(vag_url)

            if not pdf_entries:
                result['error'] = f'Aucun document trouvé dans le dossier (réponse {len(dossier_html)} o)'
                result['debug_html'] = dossier_html
                browser.close()
                return result

            # — Étape 4 : téléchargement binaire via APIRequestContext (hérite des cookies) —
            for label, rel_url in pdf_entries[:6]:
                abs_url = rel_url if rel_url.startswith('http') else 'https://aviation.meteo.fr/' + rel_url
                ptype = ('TEMSI' if 'sigwx' in rel_url else
                         'WINTEM' if 'wintemp' in rel_url else
                         'VAG' if 'vag' in rel_url else 'PDF')
                try:
                    resp = ctx.request.get(
                        abs_url,
                        headers={'Referer': 'https://aviation.meteo.fr/accueil.php'},
                        timeout=30000
                    )
                    pdf_bytes = resp.body()
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

            browser.close()

    except Exception as e:
        result['error'] = str(e)

    return result


def main():
    result = {
        'updated_utc': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'source': 'aviationweather.gov (NOAA/AWC) — METAR/TAF ; metarcentral.com — NOTAM',
        'metar_raw': None,
        'taf_raw': None,
        'notams': [],
        'aeroweb_ntaa': None,
        'errors': []
    }

    try:
        result['metar_raw'] = fetch_metar_awc()
        if not result['metar_raw']:
            result['errors'].append('metar: aviationweather.gov n\'a renvoyé aucune donnée pour NTAA')
    except Exception as e:
        result['errors'].append('metar: ' + str(e))

    try:
        result['taf_raw'] = fetch_taf_awc()
        if not result['taf_raw']:
            result['errors'].append('taf: aviationweather.gov n\'a renvoyé aucune donnée pour NTAA')
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
