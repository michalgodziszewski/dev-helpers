---
type: plan
tags: [second-brain, obsidian, claude-code, kiro, agent-skills]
updated: 2026-09-17
---

# Second brain dla agenta: Obsidian + własne skille (Claude Code i Kiro)

Cel: wiedza o systemach organizacji (frontendy, API, bazy, przepływy) odkładana automatycznie podczas pracy, tak żeby w każdej chwili można było powiedzieć agentowi np. „przejdź na bazę i wyłącz usługę dla produktu”.

---

## 1. Kompatybilność Claude Code i Kiro

- Oba narzędzia obsługują otwarty standard **Agent Skills** (`SKILL.md` w osobnym folderze).
- Claude Code: `~/.claude/skills/<nazwa>/SKILL.md`
- Kiro: `~/.kiro/skills/<nazwa>/SKILL.md` (globalnie) lub `.kiro/skills/<nazwa>/SKILL.md` (w projekcie). Plik musi być w podfolderze, nie bezpośrednio w `skills/`.
- Rozwiązanie: jedno repo ze skillami i symlinki do obu lokalizacji.
- Budujemy wszystko sami, bez pobierania zewnętrznych skilli.

---

## 2. Jak robią to inni (research)

- **Wzorzec LLM Wiki (Karpathy)**: trzy warstwy. `raw/` to niezmienne źródła, których agent nie modyfikuje. Wiki to strony utrzymywane przez agenta. Schemat to plik CLAUDE.md lub AGENTS.md z konwencjami. Trzy operacje: ingest, query, lint. Przy około 200+ plikach potrzebne są indeksy per katalog.
- **„Czytaj na starcie, zapisuj na końcu”**: agent na początku sesji czyta pamięć globalną i projektową, a na końcu zapisuje zmiany. Reguła zapisu jest sednem systemu.
- **Warstwy o różnej częstotliwości aktualizacji**: bez tego vault szybko zamienia się w szum.
- **Typowe błędy**: sekrety w notatkach, zbyt długie reguły, nadpisywanie ręcznych notatek, notatki AI bez daty i źródła.

Wnioski dla nas:
- `raw/` na eksporty (Swagger, schemat bazy),
- wiki to foldery systemów,
- `AGENTS.md` jako schemat,
- cotygodniowy lint,
- `_index.md` w każdym głównym folderze.

---

## 3. Struktura vaulta (wiele systemów)

Przykładowy łańcuch: **lfo-gui** (Angular) → **lfo-api** (.NET, proxy) → **web-api** (API z dostępem do bazy) → **baza**.

Najważniejsza jednostka wiedzy to **system**. Całość spinają: katalog, zależności we frontmatterze i przepływy (flows).

```
work-brain/
├── AGENTS.md            # schemat: konwencje, zasady zapisu, bezpieczeństwo
├── _index.md            # mapa główna
├── _log.md              # dziennik zmian agenta
├── catalog.md           # tabela wszystkich systemów (generowana skryptem)
├── systems/             # płasko, 1 folder = 1 system
│   ├── lfo-gui/         # overview.md, api.md, modules.md
│   ├── lfo-api/
│   └── web-api/
├── domains/             # obszary biznesowe (produkty, klienci, billing...)
├── db/
│   └── <baza>/
│       ├── _index.md    # relacje (mermaid)
│       └── tables/      # 1 tabela = 1 plik
├── flows/               # akcja przez wszystkie warstwy  ← serce systemu
├── runbooks/            # operacje krok po kroku
├── raw/                 # Swagger, schemat bazy, agent tylko czyta
├── inbox/               # drafty agenta, propozycje, pytania, dzienniki sesji
├── lint/                # raporty rozjazdów
└── templates/           # system, table, flow, runbook, domain
```

Systemy trzymamy płasko, bo jeden system może należeć do kilku domen. Przynależność zapisujemy we frontmatterze.

### Frontmatter systemu

```yaml
---
type: system
kind: api            # frontend | api | proxy | worker | db
tech: dotnet
owner: my-team       # my-team | external
repo: lfo-api        # nazwa głównego folderu repo (do auto-rozpoznania)
domains: [produkty]
calls: [[web-api]]
called_by: [[lfo-gui]]
depth: full          # full | contract (cudze systemy tylko kontrakt)
status: draft        # draft | verified
source: bootstrap 2026-09
updated: 2026-09-17
---
```

- Graf zależności tworzy się sam z pól `calls` i `called_by`.
- Agent czyta system i jego sąsiadów o jeden krok, a nie cały vault.
- Pytania przekrojowe („co dotyka produktów?”) zaczynają się od `domains/`.

### Przykład flow

`flows/product-service-toggle.md` (nazwy przykładowe)

```markdown
---
type: flow
systems: [lfo-gui, lfo-api, web-api]
tables: [product_services]
status: verified
source: bootstrap 2026-09
---
# Włączanie/wyłączanie usługi dla produktu
1. [[lfo-gui]] ProductServicesComponent → ProductApiService.toggle()
2. [[lfo-api]] PUT /products/{id}/services/{code} (czyste proxy)
3. [[web-api]] ServicesController.Toggle → walidacja, audyt
4. [[product_services]] is_active = 0, modified_at, modified_by
Efekty uboczne: wpis w audit_log, cache produktu czyszczony po 5 min
```

### Przykład runbooka

`runbooks/disable-service-for-product.md`

```markdown
---
type: runbook
flow: [[product-service-toggle]]
risk: medium
---
Preferowana droga: endpoint web-api (zachowuje audyt i walidację)
Awaryjnie SQL:
1. SELECT ... WHERE product_id = :id   → pokaż wynik
2. Czekaj na potwierdzenie użytkownika
3. UPDATE ... SET is_active = 0 ...
4. Weryfikacja SELECT-em
```

### Zasady bezpieczeństwa (AGENTS.md)

- Środowisko musi być podane jawnie. Brak środowiska oznacza pytanie, nie domysł.
- Przed zmianą agent robi SELECT pokazujący rekordy i czeka na „tak”.
- Pierwszeństwo ma droga przez API, SQL tylko awaryjnie.
- Zero sekretów i connection stringów w vaulcie, tylko nazwane połączenia lub zmienne środowiskowe.
- Produkcja domyślnie tylko do odczytu. Sprawdź politykę firmy.
- Przed startem sprawdź, czy wiedza o systemach może leżeć lokalnie i czy wolno używać agentów na tym kodzie.

---

## 4. Kto decyduje o zapisie

| Co | Jak trafia do vaulta |
|---|---|
| Fakty z kodu (endpoint, tabela, kolumna, zależność) | agent **sam**, do `inbox/` jako draft |
| Flows, znaczenie statusów, efekty uboczne | agent **proponuje** na koniec zadania |
| Decyzje, runbooki, operacje na danych | agent **proponuje**, Ty zatwierdzasz |
| Cokolwiek w dowolnym momencie | Ty mówisz „zapisz to” |

Czego nie zapisywać: stanu bieżącego zadania, rzeczy oczywistych z kodu, sekretów.

Format podsumowania na koniec zadania:

```
Zapisałem do inbox:
 • ...
Proponuję zapisać:
 1. ...
 2. ...
Zapisać? (tak / numery / nie)
```

Raz w tygodniu (około 10 min) przegląd inboxu: dobre wpisy dostają status `verified`, śmieci są usuwane.

---

## 5. Skille (wszystkie własne)

1. **brain-context**: odczyt. Rozpoznaje system, czyta jego folder, sąsiadów i flows. Skrypt `find.sh`.
2. **brain-capture**: zapis. Fakty zapisuje sam, resztę proponuje. Obsługuje dziennik sesji.
3. **brain-ingest**: analiza repo i pierwszy wsad. Pliki `references/dotnet.md` i `references/angular.md`.
4. **brain-maintain**: przegląd inboxu, lint, rozjazdy z `raw/`, generowanie `catalog.md`.
5. **brain-ops**: operacje na danych z twardymi regułami bezpieczeństwa.

Poza skillami:
- **hooki**: koniec sesji uruchamia `brain-capture`,
- **AGENTS.md**: wspólne zasady, do których odwołują się wszystkie skille.

---

## 6. Jak projekt wie, gdzie jest vault

Projekt nie musi nic wiedzieć. Ścieżkę zna skill, a skille są globalne.

1. **Zmienna środowiskowa** w `~/.bashrc` / `~/.zshrc`:
   ```bash
   export BRAIN_PATH="$HOME/work-brain"
   ```
   Skrypty używają `${BRAIN_PATH:-$HOME/work-brain}`.
2. **Uprawnienia do folderu poza projektem**:
   - Claude Code, w `~/.claude/settings.json`:
     ```json
     { "permissions": { "additionalDirectories": ["~/work-brain"] } }
     ```
   - Kiro: dodaj `work-brain` jako drugi folder workspace’u i zapisz workspace.
3. **Rozpoznanie systemu przez odwrócone mapowanie**: vault wie, gdzie jest repo (pole `repo` w `overview.md`).
   ```bash
   basename "$(git rev-parse --show-toplevel)"   # → lfo-gui
   find.sh repo lfo-gui                          # → systems/lfo-gui/
   ```
   Brak dopasowania oznacza pytanie albo propozycję `brain-ingest`. W repozytoriach zespołu nic nie zmieniasz.
   Opcjonalna prywatna wskazówka: `CLAUDE.local.md` lub plik w `.kiro/steering/`, oba w `.gitignore`.

---

## 7. Plan budowy krok po kroku

**Etap 0: zgody (15 min).** Polityka firmy dotycząca vaulta i agentów.

**Etap 1: fundament (1–2 h)**
```bash
mkdir -p ~/work-brain/{systems,domains,db,flows,runbooks,raw,inbox,templates,lint}
cd ~/work-brain && git init
touch AGENTS.md _index.md _log.md catalog.md
mkdir -p ~/brain-skills/{skills,hooks}
```
Następnie: `AGENTS.md`, szablony, `BRAIN_PATH`, uprawnienia, symlinki:
```bash
ln -s ~/brain-skills/skills/brain-context ~/.claude/skills/brain-context
ln -s ~/brain-skills/skills/brain-context ~/.kiro/skills/brain-context
# analogicznie dla kolejnych skilli
```

**Etap 2: odczyt i zapis (2–3 h).** `brain-context`, `brain-capture`, hook, test na małym zadaniu.

**Etap 3: pierwszy wsad (1–2 dni).** `brain-ingest`, bootstrap od dołu (web-api → lfo-api → lfo-gui), flows, ręczna weryfikacja (najważniejszy krok), skrypty do `raw/` (Swagger, `dotnet ef migrations script` lub dump struktury).

**Etap 4: utrzymanie i operacje (po 2–3 tygodniach).** `brain-maintain`, `catalog.md`, cotygodniowy przegląd w kalendarzu, `brain-ops` (najpierw na środowisku testowym), kolejne systemy.

---

## 8. Prompty

Uruchamiaj w Claude Code w `~/brain-skills` z dostępem do `~/work-brain`. Po każdym prompcie przejrzyj wynik.

### Prompt 1: fundament vaulta

```
Zbuduj szkielet vaulta Obsidian w ${BRAIN_PATH:-~/work-brain} jako bazy wiedzy agenta o systemach firmowych.

Foldery: systems/, domains/, db/, flows/, runbooks/, raw/, inbox/, templates/, lint/.
Pliki w katalogu głównym: AGENTS.md, _index.md, _log.md, catalog.md.

AGENTS.md (max 1 strona) ma zawierać:
- opis struktury i do czego służy każdy folder,
- konwencje: nazwy plików kebab-case, linki wyłącznie jako [[wikilink]], każdy plik z frontmatterem YAML,
- pola frontmattera: type (system|table|flow|runbook|domain|decision|proposal), status (draft|verified),
  source, updated; dla system dodatkowo: kind, tech, owner, repo, domains, calls, called_by, depth,
- zasady zapisu: fakty z kodu agent zapisuje sam do inbox/ jako draft; flows, efekty uboczne,
  decyzje i runbooki tylko po zgodzie użytkownika; nigdy nie nadpisuje notatek verified,
  zmiany proponuje w sekcji "## Proponowane zmiany"; każdą zmianę dopisuje do _log.md,
- bezpieczeństwo: zakaz sekretów, connection stringów i danych osobowych; operacje na danych
  wymagają jawnego środowiska, SELECT przed zmianą i potwierdzenia.

W templates/ utwórz: system.md, table.md, flow.md, runbook.md, domain.md
(frontmatter + sekcje do wypełnienia, bez treści przykładowej).

Zanim zapiszesz, pokaż plan i treść AGENTS.md.
```

### Prompt 2: brain-context

```
Utwórz skill w ~/brain-skills/skills/brain-context/ w formacie Agent Skills
(SKILL.md z frontmatterem name i description; name zgodne z nazwą folderu).

Cel: przed pracą nad systemem wczytać wiedzę z bazy wiedzy.
Ścieżka vaulta: ${BRAIN_PATH:-$HOME/work-brain}.

description: ma się aktywować, gdy użytkownik zaczyna zadanie w repo systemu,
pyta o architekturę, API, bazę, zależności między systemami lub gdy brakuje kontekstu.

Procedura w SKILL.md (zwięźle):
1. Ustal system: weź nazwę głównego folderu repo (git rev-parse --show-toplevel)
   i znajdź plik systems/*/overview.md z polem repo o tej wartości.
   Jeśli brak dopasowania, sprawdź CLAUDE.local.md; jeśli dalej brak, zapytaj
   i zaproponuj brain-ingest.
2. Przeczytaj AGENTS.md oraz systems/<system>/.
3. Z frontmattera weź calls i called_by i przeczytaj tylko overview.md tych sąsiadów.
4. Znajdź flows i tabele powiązane z systemem skryptem find.sh.
5. Streść w 5 zdaniach, co wiesz, i zaznacz, które informacje są draft.

scripts/find.sh: wyszukiwanie w vaulcie przez rg po polach frontmattera,
np. find.sh repo lfo-gui, find.sh systems lfo-api, find.sh type flow,
find.sh tables product_services. Wynik: lista ścieżek. Bez zależności poza rg i bash.

Na końcu wypisz polecenia ln -s do ~/.claude/skills i ~/.kiro/skills.
```

### Prompt 3: brain-capture i hooki

```
Utwórz skill ~/brain-skills/skills/brain-capture/ (format Agent Skills).

Cel: zapisywanie wiedzy odkrytej podczas pracy do ${BRAIN_PATH:-$HOME/work-brain}.

description: aktywuje się na koniec zadania lub gdy użytkownik mówi "zapisz to", "zapamiętaj".

Zasady:
- SAM zapisuj do inbox/ jako draft: nowe/zmienione endpointy, tabele, kolumny,
  zależności między systemami.
- PROPONUJ (nie zapisuj bez zgody): flows przez kilka warstw, znaczenie statusów,
  efekty uboczne, decyzje, runbooki.
- NIE zapisuj: stanu bieżącego zadania, rzeczy oczywistych z kodu, sekretów.
- Przed zapisem sprawdź, czy notatka już istnieje; jeśli tak, dopisz zamiast duplikować.
- Używaj szablonów z templates/, dopisz wpis do _log.md.
- Jeśli istnieje inbox/_session-<branch>.md, przetwarzaj jego wpisy zamiast
  przeglądu pamięci sesji: [fakt] → draft, [propozycja] → pytanie lub proposal
  (w trybie automatycznym), [luka] → inbox/questions.md. Na końcu usuń plik sesji.

Format podsumowania dla użytkownika:
"Zapisałem do inbox: • ...
 Proponuję zapisać: 1. ... 2. ...
 Zapisać? (tak / numery / nie)"
Jeśli nic nie spełnia kryteriów, napisz jedno zdanie i nic nie zapisuj.

Dodatkowo przygotuj:
1. ~/brain-skills/hooks/claude-stop.sh — hook Stop dla Claude Code: czyta JSON ze stdin;
   jeśli stop_hook_active == true, kończy z kodem 0; w przeciwnym razie zwraca
   {"decision":"block","reason":"Przed zakończeniem użyj skilla brain-capture."}
2. Fragment do ~/.claude/settings.json rejestrujący ten hook.
3. Instrukcję, jak utworzyć w Kiro hook uruchamiany po zakończeniu pracy agenta
   z poleceniem "Użyj skilla brain-capture".
```

### Prompt 4: test (w repo lfo-gui)

```
Zanim cokolwiek zrobisz, powiedz, co wiesz o tym systemie z bazy wiedzy.
Potem [małe, prawdziwe zadanie].
```
Sprawdź: czy `brain-context` uruchomił się sam, czy na końcu jest podsumowanie, czy nie ma śmieci. W razie problemów poprawiaj `description`.

### Prompt 5: brain-ingest

```
Utwórz skill ~/brain-skills/skills/brain-ingest/ (format Agent Skills).

Cel: analiza repozytorium i utworzenie wiedzy o systemie w ${BRAIN_PATH:-$HOME/work-brain}.
description: aktywuje się, gdy użytkownik prosi o przeanalizowanie repo lub dodanie systemu.

Procedura:
1. Zapytaj o nazwę systemu, domeny, ownera (my-team/external) i depth (full/contract).
2. Rozpoznaj stack i wczytaj odpowiedni plik z references/.
3. Analizuj warstwami: wejście (kontrolery/komponenty) → logika → dostęp do danych
   → wywołania innych systemów (HttpClient, konfiguracja URL-i).
4. Utwórz systems/<nazwa>/overview.md (frontmatter z calls/called_by; pole repo
   zawsze = nazwa głównego folderu repozytorium), api.md (endpointy),
   a dla full także modules.md.
5. Dla tabel utwórz lub uzupełnij db/<baza>/tables/.
6. Zaktualizuj called_by w systemach, które wywołuje.
7. Zaproponuj listę flows, ale ich nie twórz bez zgody.
Wszystko jako draft. Nie czytaj wartości sekretów (appsettings.*.json z hasłami, .env) —
bierz z nich tylko nazwy kluczy i adresy usług.

references/dotnet.md: gdzie szukać kontrolerów, DbContext, encji, migracji EF,
typed HttpClientów i konfiguracji.
references/angular.md: serwisy HTTP, interceptory, environment.ts, routing, główne moduły/komponenty.
```

### Prompt 6: bootstrap (osobno w każdym repo, od dołu)

```
Użyj brain-ingest dla tego repo. System: web-api, domeny: [..],
owner: [..], depth: full. Na końcu pokaż listę utworzonych plików
i wszystko, czego nie byłeś pewien.
```
Kolejność: web-api → lfo-api → lfo-gui. Potem:
```
Na podstawie systems/lfo-gui, lfo-api i web-api zaproponuj flows
dla głównych akcji użytkownika. Każdy flow: kroki przez wszystkie warstwy
z nazwami klas/metod, dotykane tabele, efekty uboczne. Najpierw lista,
potem tworzenie po mojej akceptacji.
```
Na koniec ręczna weryfikacja i ustawienie `verified`.

### Prompt 7: brain-maintain

```
Utwórz skill ~/brain-skills/skills/brain-maintain/ (format Agent Skills).

description: aktywuje się przy "przegląd bazy wiedzy", "lint vaulta", "odśwież wiedzę".

Funkcje:
1. Przegląd inbox: pokaż listę draftów i proposali, dla każdego zaproponuj
   docelowe miejsce i przenieś po akceptacji, ustawiając verified.
2. Lint (skrypt scripts/lint.sh + analiza): martwe [[linki]], pliki bez frontmattera,
   niespójne calls/called_by, drafty starsze niż 14 dni, systemy bez ownera.
   Raport zapisz do lint/YYYY-MM-DD.md.
3. Rozjazdy: porównaj raw/<system>/openapi.json i raw/db/schema.sql
   z notatkami; wypisz brakujące i nieistniejące endpointy/kolumny.
4. scripts/build-catalog.sh: generuje catalog.md jako tabelę markdown
   ze wszystkich systems/*/overview.md (nazwa, kind, tech, owner, domains, calls).
```

### Prompt 8: brain-ops (dopiero po weryfikacji flows)

```
Utwórz skill ~/brain-skills/skills/brain-ops/ (format Agent Skills).

description: aktywuje się przy prośbach o operacje na danych lub usługach,
np. "wyłącz usługę dla produktu", "zmień status", "sprawdź w bazie".

Twarde zasady (nie do pominięcia):
1. Bez jawnie podanego środowiska — pytaj. Produkcja domyślnie tylko odczyt.
2. Znajdź runbook w runbooks/; jeśli brak — przeanalizuj flow i zaproponuj procedurę.
3. Preferuj drogę przez API; SQL tylko awaryjnie i z uzasadnieniem.
4. Przed zmianą: SELECT pokazujący rekordy, które się zmienią, i czekaj na "tak".
5. Po zmianie: SELECT weryfikujący.
6. Dane dostępowe tylko przez nazwane połączenia/zmienne środowiskowe, nigdy wpisane.
7. Po udanej operacji bez runbooka zaproponuj jego zapis przez brain-capture.
8. W trybie automatycznym (brak użytkownika) skill jest zablokowany.
```

### Prompt 9: integracja z istniejącym skillem `feature`

```
Zmodyfikuj skill feature, integrując go z bazą wiedzy (${BRAIN_PATH:-$HOME/work-brain},
skille brain-context i brain-capture). Nie zmieniaj istniejącej logiki
planowania i developmentu, tylko dodaj kroki:

1. PLAN: pierwszy krok to użycie brain-context. Dodaj do planu sekcję
   "Kontekst systemowy": dotykane systemy, flows, tabele oraz "Luki wiedzy".
2. START DEVELOPMENTU: utwórz inbox/_session-<branch>.md w bazie wiedzy.
3. W TRAKCIE: dopisuj jedną linijkę z prefiksem [fakt], [propozycja] lub [luka],
   gdy musisz szukać w kodzie innego systemu, odkryjesz nieoczywiste zachowanie
   lub brakuje ci wiedzy. Nie przerywaj pracy.
4. SUBAGENTY: przekazuj im ścieżkę dziennika i tę regułę; wymagaj sekcji
   "Odkrycia" w raporcie i przenoś ją do dziennika.
5. KONIEC: użyj brain-capture na podstawie dziennika.
6. TRYB AUTOMATYCZNY (brak użytkownika do potwierdzeń): nie zadawaj pytań,
   propozycje zapisuj jako type: proposal, nie używaj brain-ops.

Pokaż diff przed zapisem.
```

---

## 9. Jak to działa w praktyce (feature w lfo-gui)

Zadanie: „Dodać zawieszanie usługi na produkcie z datą końca” (nazwy przykładowe).

1. **Start.** `brain-context` rozpoznaje lfo-gui, czyta sąsiadów (lfo-api → web-api) i flow `product-service-toggle`. Agent od razu zauważa, że tabela nie ma kolumny na datę, więc sam frontend nie wystarczy.
2. **Praca.** Agent odkrywa, że lfo-api odrzuca nieznane pola w DTO, i dopisuje to do dziennika sesji. Ty mówisz „zapisz to” o statusie SUSPENDED, a agent pyta, gdzie to dopisać.
3. **Koniec.** Hook uruchamia `brain-capture`: fakty trafiają do inboxu, propozycje wymagają Twojego „tak” lub numerów.
4. **Kolejne dni.**
   - Przy następnym featurze agent od razu wie o DTO w lfo-api.
   - `brain-ops` ostrzega o skutkach statusu.
   - Piątkowy przegląd zatwierdza drafty.
   - Lint wykrywa nową kolumnę po wdrożeniu backendu.

### Integracja ze skillem `feature` (tryb automatyczny)

```
feature: PLAN ──────────► DEVELOPMENT ──────────► KONIEC
   │                          │                      │
brain-context            dziennik odkryć        brain-capture
(czytaj wiedzę)          (dopisuj na bieżąco)   (przetwórz dziennik)
```

- Dziennik sesji `inbox/_session-<branch>.md` chroni odkrycia przed utratą przy kompaktowaniu kontekstu.
- Prefiksy: `[fakt]`, `[propozycja]`, `[luka]`.
- Subagenty dostają ścieżkę dziennika i zwracają sekcję „Odkrycia”.
- Hook `Stop` to zabezpieczenie, gdy `feature` pominie krok capture.

| | Interaktywny | Automatyczny |
|---|---|---|
| Fakty z kodu | sam do inbox | sam do inbox |
| Flows, decyzje, gotchas | pyta „zapisać?” | zapisuje jako `proposal` |
| Operacje na danych | z potwierdzeniem | zablokowane |
| Notatki verified | nie rusza | nie rusza |

### Ryzyka i jak im zapobiegać

- **Skill się nie uruchamia**: doprecyzuj `description` albo zacznij od „sprawdź bazę wiedzy”.
- **Capture zapisuje drobiazgi**: zaostrz kryteria po pierwszym tygodniu.
- **Kontekst się rozdmuchuje**: czytaj tylko `overview.md` sąsiadów.
- **Drafty się starzeją**: cotygodniowy przegląd jest obowiązkowy.
