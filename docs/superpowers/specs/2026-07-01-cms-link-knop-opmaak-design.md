# Ontwerp — Link/knop-opmaak op /clares + in het CMS

**Datum:** 2026-07-01
**Project:** Pauline Zeij (site/clares.html + admin.html)
**Status:** Goedgekeurd in gesprek

## Probleem
Projectdetail-teksten (`copy_p1/2/3`, tabel `paulinezeij_projects`) worden als HTML gerenderd,
maar het admin/CMS heeft geen link-knop. Daardoor staan bestel-URL's (bv. bij "Joek de serie")
als kale tekst op de pagina. Pauline wil links kunnen plaatsen én kiezen of ze als tekstlink of
als knop verschijnen.

## Scope
Alleen `clares.html` (de demo op `/clares`). `index.html` blijft ongewijzigd.
Oplevering: (1) quick-fix van de 2 sauberhaus-links van Joek, (2) herbruikbare CMS-link/knop-optie.

## Ontwerp

### 1. Knop-styling — `clares.html`
Nieuwe CSS-class `.pz-btn` binnen `#p-body` (naast de bestaande `#p-body p a`-regels):
verfijnde omlijnde pill, Tenor Sans, inkt-rand `#1E1B18` op crème, letter-spacing, uppercase,
hover invert (donkere vulling, crème letters). Meerdere knoppen naast elkaar: `inline-flex` met
onderlinge marge, netjes wrappend. Geen render-wijziging nodig — copy rendert al via `innerHTML`,
dus `<a class="pz-btn">` wordt automatisch een knop.

### 2. Admin-editor — `admin.html` (alle 3 tekstblokken)
Twee knoppen toevoegen aan elke `.rte-toolbar` (naast Vet/Cursief/Kop/Wissen):
- **🔗 Link** (`data-cmd="link"`): selectie → prompt URL → `execCommand('createLink')`.
  Externe URL (http/mailto/tel) → `target="_blank" rel="noopener"` waar van toepassing.
  Cursor in bestaande link → prompt toont huidige URL (bewerken); lege invoer → `unlink`.
- **Knop** (`data-cmd="btnlink"`): cursor in een link → toggelt `class="pz-btn"` op díe `<a>`.
  Actief-status in de balk als de huidige link al een knop is.
Zelfde vanilla-patroon als de bestaande `mousedown`-handler; geen framework, geen dependencies.

### 3. Quick-fix Joek
Live Supabase-rij (`paulinezeij_projects`, project `lkcfwndigzhzcjnhxcmb`), `copy_p3` van de
Joek-serie: de 2 kale sauberhaus-URL's vervangen door twee `<a class="pz-btn" target="_blank"
rel="noopener">`-knoppen ("Het boek van Joek" · "Joeks cosy wereld").

## YAGNI-grenzen
Geen kleur-/grootte-kiezer (alleen tekstlink ↔ knop). Geen wijziging aan `index.html`.
Sanitizing ongewijzigd (alleen ingelogde admin bewerkt).

## Verificatie
- Admin lokaal: link maken + knop-toggle op alle 3 velden.
- `/clares` na Supabase-fix: Playwright desktop + mobiel, Joek-detail toont 2 knoppen.
