---
type: architecture-proposal
status: awaiting-review
version: 4
updated: 2026-09-18
reference_repository: michalgodziszewski/ai-os
reference_commit: 1e2cb5a9de87f58ec15ccb412d545347a30075b2
primary_clients: [claude-code, kiro]
future_clients: [codex, other]
---

# ai-system — docelowy projekt do akceptacji

Projekt nowego systemu pisanego od podstaw, z zachowaniem zachowania obecnego skilla `feature` i dodaniem wspólnej pamięci. Głównymi klientami są Claude Code i Kiro. Kolejny klient ma korzystać z tego samego systemu przez adapter.

To wersja do dyskusji i akceptacji architektury. Nie jest backlogiem, harmonogramem ani instrukcją instalacji. Nie utworzono implementacji ani nie zmieniono repozytorium GitHub. Rozpisanie kroków budowy nastąpi po zatwierdzeniu projektu.

## 1. Podstawa projektu: co rzeczywiście jest w ai-os

Przeczytano źródła na `main`, commit `1e2cb5a9de87f58ec15ccb412d545347a30075b2`: README, CLAUDE.md, GUIDELINES, wszystkie akcje skilla feature, cztery role feature, session-handoff, konfigurację i wybrane dokumenty wyjaśniające wcześniejsze decyzje.

Aktualny system ma:

- Nadrzędne repo ai-os obejmujące skille, kontekst i wiki; projekty mogą być częścią tego repo albo osobnymi repozytoriami.
- Centralny router CLAUDE.md i kontekst projektów poza ich kodem.
- Skill `feature` zarządzający całym cyklem pracy, jednym aktywnym zadaniem per system oraz Pending Reviews.
- Cztery role: planner, implementer, tester i reviewer. Stan workflow i operacje Git należą do orkiestratora.
- Dwie gałęzie dla projektu z własnym repo: kodu oraz kontekstu w repo ai-os.
- Osobne planowanie wielu preview, jawne wznawianie i numerowane specyfikacje.
- Kontrolę publikacji, konfigurację Jira, backport poprawek oraz tryb z lokalnym bare origin dla dotychczasowego repo ai-os.
- Wiki traktowane jako ostatnie miejsce wyszukiwania; procedury feature są samowystarczalne.
- `session-handoff`, który wyświetla blok do skopiowania i z założenia nie zapisuje pliku.

Dokument `0014-local-install-update.md` opisuje plan instalatora, ale w odczytanym drzewie nie ma katalogów `scripts/` ani `assets/` przewidzianych przez ten dokument. Sama obecność specyfikacji nie oznacza gotowej implementacji.

Źródła odniesienia:

- [README](https://github.com/michalgodziszewski/ai-os/blob/1e2cb5a9de87f58ec15ccb412d545347a30075b2/README.md)
- [Feature: akcje](https://github.com/michalgodziszewski/ai-os/blob/1e2cb5a9de87f58ec15ccb412d545347a30075b2/.claude/skills/feature/SKILL.md)
- [Rozpoznawanie systemów i dwie gałęzie](https://github.com/michalgodziszewski/ai-os/blob/1e2cb5a9de87f58ec15ccb412d545347a30075b2/.claude/skills/feature/actions/_common.md)

Obecne ai-os jest wzorcem zachowania. Nowy system otrzyma własne źródła i układ; nie zakładamy przebudowy istniejącego repo w miejscu ani kopiowania całej jego historii.

## 2. Docelowa struktura

Folder nadrzędny `ai-system/` nie ma repozytorium Git. W środku znajdują się niezależne repozytoria i lokalny stan pracy.

| Ścieżka względem ai-system | Przeznaczenie | Wersjonowanie |
|---|---|---|
| `system/` | Kod i instrukcje nowego systemu AI | Lokalny Git, bez remote |
| `context/` | Konfiguracja instalacji i projektów, specyfikacje workflow | Lokalny Git, bez remote |
| `brain/` | Jeden globalny vault wiedzy | Lokalny Git, bez remote |
| `projects/<name>/` | Kod konkretnego projektu | Osobne repo każdego projektu ze zdalnym origin |
| `.state/` | Aktywne sloty, preview, checkpointy, blokady, kolejka awarii | Bez Git; dane trwałe wymagają backupu |
| `.worktrees/` | Izolowane checkouty gałęzi kontekstu | Worktree repo context; katalog nadrzędny bez repo |
| `AGENTS.md`, `CLAUDE.md` | Generowane krótkie wejścia do systemu | Odtwarzalne z system |
| `.claude/`, `.kiro/` | Konfiguracja dla otwarcia całego workspace’u | Generowana, bez ręcznie utrzymywanych kopii logiki |

Ustalenie z 18 września 2026: zdalne repozytoria mają wyłącznie projekty. Repozytoria system, context i brain używają lokalnego Git bez remote, także bez lokalnego bare origin. Zachowują commity, gałęzie i historię, ale nie wykonują fetch/pull/push. Rejestr opisuje tryb każdego repo: local-only albo remote. Brak origin w system/context/brain jest prawidłową konfiguracją; brak skonfigurowanego origin w projekcie jest błędem konfiguracji. Pełną adaptację akcji określa rozdział o lokalnym Git.

Rozdzielenie `context` i `brain` jest celowe: publikacja specyfikacji zadania podlega workflow feature, natomiast przechwytywanie wiedzy ma działać na bieżąco. Te operacje nie powinny wzajemnie blokować swoich gałęzi ani przypadkowo publikować tych samych plików.

## 3. Pięć pojęć, których nie mieszamy

| Pojęcie | Odpowiada na pytanie | Przykład |
|---|---|---|
| Workspace | Gdzie działa cała instalacja? | ai-system |
| Cel pracy feature | Który projekt ma aktywny slot i workflow? | projects/lfo-gui |
| Repozytorium | Gdzie są kod, gałęzie i commity? | repo lfo-gui |
| System biznesowy/techniczny | O jakim elemencie architektury wiemy? | frontend, API, worker, baza |
| Sesja agenta | Kto i w jakim kliencie teraz pracuje? | sesja Claude albo Kiro |

Termin `--system` w feature pozostaje zgodny z obecnym interfejsem: oznacza cel workflow. System wiedzy w brainie jest osobną encją. Nie wymuszamy relacji 1:1: jeden projekt może obejmować kilka usług; jedna baza może być używana przez kilka projektów.

Stały rejestr w `context/registry/` mapuje cele workflow, repozytoria, systemy wiedzy i względne ścieżki. Lokalne nadpisania, np. checkout poza workspace’em, są w `.state/`. Rozpoznanie uwzględnia tożsamość repo i worktree, a nie tylko nazwę folderu.

Dla kompatybilności `--system ai-os` wskazuje nowy `system/`. Nadrzędne `ai-system/` nigdy nie staje się celem operacji Git. Domyślne zachowanie poszczególnych akcji opisano w kontrakcie feature poniżej.

## 4. System: miejsce, które będziesz dostosowywał

| Obszar w system | Co zawiera |
|---|---|
| `skills/feature/` | Jeden wspólny skill i jego akcje |
| `skills/brain-context/` | Procedura wyszukiwania wiedzy |
| `skills/brain-capture/` | Procedura zapisu i aktualizacji |
| `skills/brain-ingest/` | Kontrolowane wprowadzanie systemu lub źródła |
| `skills/brain-maintain/` | Przegląd jakości i aktualności |
| `skills/brain-checkpoint/` | Minimalny stan do wznowienia sesji |
| `skills/session-handoff/` | Dotychczasowe podsumowanie do skopiowania |
| `roles/` | Wspólne kontrakty planner/implementer/tester/reviewer |
| `policies/` | Zasady pracy i pamięci niezależne od klienta |
| `templates/` | Szablony specyfikacji, notatek i konfiguracji |
| `adapters/claude/`, `adapters/kiro/` | Specyficzne konfiguracje, hooki, mapowanie narzędzi i modeli |
| `runtime/` | Mały lokalny program: stan, pliki, rejestr, walidacja i zapis |
| `docs/` | Dokumentacja samego systemu |

Skille i role są plikami, które możesz zmieniać w swoim repo. Proponowany runtime to mały CLI w TypeScript, dopasowany do Twojego doświadczenia. Nie wymaga serwera NestJS, bazy wektorowej ani stale działającego procesu.

Rozdział odpowiedzialności:

- **Skill** określa, jak przeprowadzić zadanie i jakie informacje zebrać.
- **Rola** określa odpowiedzialność agenta, zakres pracy i format odpowiedzi.
- **Runtime** wykonuje deterministyczne czynności, np. walidację, bezpieczny zapis i przejście stanu.
- **Adapter** tłumaczy te pojęcia na możliwości klienta.

Rozumienie reguły biznesowej należy do modelu i człowieka. Poprawność formatu i ochronę przed nadpisaniem nowszego pliku można sprawdzać programowo.

Preferencje użytkownika i ustawienia konkretnego projektu należą do `context`, nie do ogólnej treści skilla. Konfigurację klienta generujemy ze źródeł; ręczne edytowanie kopii instalowanych w dwóch narzędziach prowadziłoby do rozjazdów.

## 5. Context: konfiguracja i dokumenty pracy

| Obszar | Zawartość |
|---|---|
| `context/profile/` | Preferencje komunikacji i pracy użytkownika |
| `context/registry/` | Rejestr projektów, repozytoriów i mapowania do systemów wiedzy |
| `context/ai-os/` | Kontekst rozwoju samego systemu AI |
| `context/projects/<name>/project-overview.md` | Przeznaczenie projektu, stack, struktura, komendy |
| `context/projects/<name>/coding-standards.md` | Standardy kodowania tego projektu |
| `context/projects/<name>/project-config.md` | Jira, backport, repo, bazy gałęzi i polityka publikacji |
| `context/<context_path>/features/`, `fixes/` | Zatwierdzone specyfikacje; context_path z rejestru, np. projects/customer-ui albo ai-os |

Projekt-overview jest jednym autorytatywnym dokumentem orientacyjnym. Brain może do niego odsyłać, ale nie utrzymuje drugiej niezależnej kopii listy komend i stacku. Instrukcje znajdujące się już w repo projektu pozostają źródłami zasad tego projektu; osobisty kontekst nie powinien ich po cichu zastępować.

Krótkotrwały stan runtime jest oddzielony od dokumentów wersjonowanych. `current-feature.md` zachowuje dotychczasowe pola i Pending Reviews, ale jest lokalnym plikiem w `.state/features/<system>/`. Preview planów znajdują się w `.state/plans/<system>/`. Te zmiany lokalizacji są jawną zmianą infrastruktury, nie zmianą znaczenia komend.

`plan done` nadal nadaje numer i kończy planowanie bez commita. Sfinalizowana specyfikacja czeka w lokalnym stagingu dokumentów do `start`. Po utworzeniu gałęzi kontekstu jest przenoszona do jej worktree. Resolver aktualizuje ścieżkę Source Spec; istnieje jeden aktywny egzemplarz dokumentu danej rewizji. Brain odwołuje się do stabilnego identyfikatora zadania, a nie tymczasowej ścieżki worktree.

Numeracja skanuje specyfikacje scalone, oczekujące i aktywne worktree danego systemu. Rezerwacja numeru jest blokowana na czas operacji, żeby dwie sesje nie nadały tego samego numeru. Wiele planów może współistnieć; jedno aktywne zadanie per system pozostaje regułą.

## 6. Kontrakt feature — co zachowujemy

Źródłem zgodności są konkretne akcje istniejącego skilla, nie jedynie skrót w SKILL.md. Przykładowo tabela ogólna mówi o domyślnym ai-os, ale aktualne `plan.md` wymaga pytania o system przy nowym planie bez argumentu; `status` bez argumentu obejmuje wszystkie systemy.

| Akcja | Zachowanie do zachowania |
|---|---|
| `plan` | Nowy preview albo kontynuacja planowania śledzonego w tej rozmowie; pytania pojedynczo; brak zgadywania istniejącego planu |
| `plan resume <name>` | Jawny wybór preview; przy kilku trafieniach wybór systemu |
| `plan status` | Braki aktywnego planu albo lista wszystkich preview; bez zapisu |
| `plan cancel` | Koniec bieżącego planowania; usunięcie pliku wyłącznie na żądanie/potwierdzenie |
| `plan done` | Wymagane pola, numeracja, feature/chore → features, fix/bugfix/hotfix → fixes, bez commita |
| `load` | Jedno aktywne zadanie per system, Source Spec, status Not Started, dotychczasowe reguły tworzenia brakującego kontekstu |
| `start` | Sprawdzenie repo i jawnych baz; fetch/ff-only tylko projektu ze zdalnym origin; lokalna baza dla system/context; gałęzie, checklisty i implementer |
| `test` | Rzeczywiste komendy projektu i wyniki per check; bez zmiany stanu workflow i bez napraw kodu |
| `review` | Ocena zmiany względem Goals/Constraints/Acceptance Criteria; odczyt, bez poprawiania kodu |
| `publish` | Konkretny pakiet commitów do zatwierdzenia; lokalne commity system/context, push wyłącznie gałęzi projektu ze zdalnym origin |
| `clear` | Przeniesienie Published/Merged do Pending Reviews i zwolnienie slotu; bez potwierdzania merge |
| `complete` | Sprawdzenie wszystkich wymaganych merge, w tym kontekstu i zarejestrowanego backportu; potem zwolnienie/usunięcie wpisu |
| `abandon` | Dotychczasowe rozróżnienie aktywnego slotu i konkretnego Pending Reviews; usuwanie gałęzi jawne, bez usuwania remote |
| `backport` | Tylko opt-in projektu i poprawki trunk; osobna gałąź z istniejącego release, uporządkowane cherry-pick -x, stan aktualizowany po każdym commicie |
| `status` | Widok aktywnych zadań, Pending Reviews i preview; bez argumentu wszystkie systemy; bez zapisu |

Zachowujemy też:

- Stały szablon specyfikacji: Git Workflow, Description, Goals, Constraints, References, Acceptance Criteria.
- Nazewnictwo gałęzi i commitów oraz opcjonalny Jira Ticket. Jira pozostaje polem wpływającym na nazwy, nie integracją API.
- Bazy kodu i kontekstu są jawne w specyfikacji. W nowym planie agent pyta o brakującą bazę, po jednym pytaniu; podanej już wartości nie pyta ponownie. Oryginalne main jako fallback pozostaje opisem starego skilla, nie sposobem uzupełniania nowych planów.
- Jednego właściciela mutacji stanu feature: orkiestrator. Role nie robią commitów, pushów ani zmian current-feature.
- Dotychczasowy model zatwierdzania publikacji, ręcznego merge i osobnego zatwierdzania destrukcyjnego sprzątania. Nowa pamięć nie rozszerza tych uprawnień.
- `test`, `review`, `status` i `plan status` pozostają działaniami bez zapisu do pamięci oraz stanu. Hook nie wykonuje ukrytego capture po tych akcjach. Odkrycia z ich odpowiedzi można wykorzystać przy kolejnym kroku zapisującym albo osobnym wywołaniu brain-capture.
- Brak automatycznego uruchamiania kolejnych akcji feature tylko dlatego, że poprzednia się skończyła. Obecna sekwencja sterowana poleceniami pozostaje.
- Session-handoff zachowuje wyjście w rozmowie; checkpoint plikowy jest osobnym mechanizmem.

### Granice zgodności, które trzeba nazwać

Zachowujemy interfejs, role i cykl feature, z jawną adaptacją zachowania Git do repo bez remote. Nowy układ wymaga zmiany rozpoznawania katalogów i repo. Każdy projekt ma własne repo, więc odpada dotychczasowy wariant projektu śledzonego w nadrzędnym ai-os. Dwie gałęzie dla kodu i kontekstu pozostają. W nowym układzie także rozwój `system/` korzysta z oddzielnej gałęzi kontekstu — wcześniej ai-os miał obie rzeczy w jednym repo. Obie gałęzie pozostają wtedy lokalne. Dawny tryb Remote: local oznaczał bare origin; nowy local-only oznacza całkowity brak remote i wymaga zmiany komend, a nie wyłącznie komunikatów.

Sprawdzanie merge w starym skillu opiera się na ancestry oryginalnych SHA. Zachowanie tego kontraktu oznacza obsługę scalania zachowującego te commity; squash/rebase wymagałby osobnej, jawnej zmiany. Obecny backport przechowuje tylko ostatni zestaw metadanych backportu. Nie zmieniamy go po cichu na zarządzanie wieloma release’ami naraz.

Szczegóły wymagające usunięcia sprzeczności źródeł zapisujemy jawnie: start faktycznie ustawia In Progress w końcowym kroku, choć komentarz w backport opisuje to inaczej. Warunek czystego repo powinien rozpoznawać oczekiwane, własne dokumenty planu; lokalny staging daje temu jednoznaczne miejsce. Nie traktujemy takich rozbieżności dokumentacji jako dodatkowych funkcji.

## 7. Dwie gałęzie bez nadrzędnego repo

Dla zadania w projekcie powstają:

- Gałąź kodu w `projects/<name>/`.
- Gałąź kontekstu w repo `context/`, zawierająca dokumenty tego zadania.

Gałąź kontekstu ma własny worktree w `.worktrees/context/<work-item-id>/`. Dwa projekty nie przełączają sobie wspólnego checkoutu context i nie przenoszą przypadkowo niezacommitowanych dokumentów między gałęziami. Nazwy i cele gałęzi pozostają zgodne z kontraktem feature; ścieżka worktree jest detalem wykonania.

`publish` przedstawia wspólny pakiet operacji na dwóch gałęziach. Dla projektu: commit i push kodu oraz lokalny commit kontekstu. Dla rozwoju systemu: dwa lokalne zestawy commitów, bez push. Częściowy sukces musi być widoczny. Po osobnym, kontrolowanym przez użytkownika scaleniu `complete` sprawdza kod projektu względem świeżo pobranej bazy origin, kod systemu względem lokalnej bazy, a kontekst zawsze względem lokalnej bazy repo context. Backport dotyczy wyłącznie kodu.

Wiedza w `brain/` nie jest trzecią gałęzią tego feature’a. To niezależny zapis z przypisanym zakresem: plan, konkretna gałąź, commit albo środowisko. W ten sposób pamięć może powstawać podczas pracy, nie udając stanu już wdrożonego.

## 8. Brain — jeden globalny vault

Brain jest zwykłym folderem Markdown, który można otworzyć w Obsidianie. Działanie agentów nie wymaga uruchomienia Obsidiana ani konkretnej jego wtyczki.

| Folder | Wiedza |
|---|---|
| `systems/<system-id>/` | Zachowania, integracje i pułapki danego systemu |
| `domains/` | Słownik i reguły biznesowe |
| `flows/` | Przepływy przez kilka systemów |
| `data/` | Znaczenie struktur danych i zależności |
| `decisions/` | Podjęte decyzje wraz z uzasadnieniem |
| `runbooks/` | Sprawdzone procedury |
| `lessons/` | Przyczyny problemów i rozwiązania warte ponownego użycia |
| `ideas/` | Propozycje, nieudające podjętych decyzji |
| `inbox/` | Niepewne ustalenia, brakujące informacje i konflikty |
| `sources/` | Niezmienne, oczyszczone snapshoty materiałów źródłowych |
| `_index.md`, `_generated/` | Odtwarzalne indeksy i raporty |

Relacje są opisane identyfikatorami w metadanych i linkami w treści. Nie potrzeba osobnej bazy grafowej, żeby powiązać frontend, API, bazę i regułę biznesową. Zależność calls zapisujemy raz; zależności odwrotne generujemy.

Nie zapisujemy całych rozmów ani każdej przeczytanej funkcji. Wartość wpisu wynika z przydatności przy przyszłym pytaniu: dlaczego coś działa w dany sposób, co wpływa na inne systemy, czego nie wolno przeoczyć, jak wcześniej rozwiązaliśmy problem.

## 9. Polityka zapisu: autonomicznie, z zakresem i źródłem

Domyślna propozycja: agent może sam zapisywać wartościowe fakty i jawnie podjęte decyzje. Informuje krótko o wyniku, bez osobnego „zapisać?” za każdym razem. To świadoma zmiana względem starej filozofii ręcznego zatwierdzania każdego trwałego wpisu, wynikająca z obecnego wymagania użytkownika.

| Informacja | Działanie |
|---|---|
| Sprawdzone zachowanie kodu | Zapis z dowodem i rewizją |
| Wyraźna decyzja użytkownika | Zapis decyzji, uzasadnienia i zakresu; bez ponownego pytania o samo dokumentowanie |
| Potwierdzona przyczyna błędu i rozwiązanie | Lessons/runbook z warunkami zastosowania |
| Wniosek bez wystarczających dowodów | Candidate w inbox, z opisem braków |
| Pomysł agenta | Idea/proposal |
| Nowe źródło sprzeczne z notatką | Konflikt i obie referencje; bez cichego wyboru |
| Nowsze jednoznaczne ustalenie w tym samym zakresie | Aktualizacja istniejącego wpisu z historią |
| Istniejący duplikat | Uzupełnienie źródeł lub brak nowego zapisu |
| Sekret, token, pełny connection string | Pominięcie; przechowujemy tylko nazwę połączenia/zmiennej |

Każda notatka ma co najmniej: stabilne ID, typ, temat, powiązane systemy, status, zakres, dowód i datę weryfikacji. Dowód może być ścieżką i symbolem kodu wraz z commitem/hashem, referencją do dokumentu albo krótkim zapisem jawnego ustalenia użytkownika z datą i identyfikatorem sesji.

Rozróżniamy:

- **Status treści:** candidate, confirmed, disputed, superseded.
- **Aktualność:** checked albo needs-review.
- **Zakres:** planowana zmiana, working tree, commit/gałąź, środowisko.

Potwierdzony fakt z feature brancha może być prawdziwy na tej gałęzi i nie dotyczyć produkcji. Merge nie jest dowodem deploymentu. Zmiana pliku źródłowego oznacza potrzebę przeglądu powiązanej wiedzy, nie automatyczne unieważnienie całego braina.

Nie można samą datą nadawać pewności. Weryfikacja ma wskazywać konkretny dowód. Ręcznie chronione notatki dostają propozycję aktualizacji zamiast nadpisania. Aktualizacja wiedzy nie zmienia automatycznie uprawnień, skilli ani polityk wykonawczych.

Proponowane profile zapisu do późniejszej konfiguracji: `automatic` jako domyślny, `inbox-only` i `manual`. Zmiana profilu jest decyzją użytkownika, nie swobodnym wyborem agenta. Tryb tylko do odczytu pojedynczej akcji zawsze wyłącza zapis, niezależnie od profilu.

## 10. Skille pamięci i ich granice

| Skill | Wejście i efekt | Czego nie robi |
|---|---|---|
| `brain-context` | Cel, systemy i rewizje → trafne notatki, źródła, luki i ostrzeżenia o aktualności | Nie zapisuje wiedzy; nie wczytuje całego vaulta |
| `brain-capture` | Odkrycie lub zbiór ustaleń → zapis, aktualizacja, kandydat, konflikt albo świadome pominięcie | Nie zmienia stanu feature ani zasad agentów |
| `brain-ingest` | Wskazane repo lub materiał → uporządkowana wiedza w wybranym zakresie | Nie skanuje automatycznie wszystkich repo i sekretów |
| `brain-maintain` | Wybrany zakres braina → przegląd linków, źródeł, duplikatów, kandydatów i świeżości | Nie uznaje treści za prawdziwą tylko dlatego, że plik jest poprawnym Markdown |
| `brain-checkpoint` | Bieżąca sesja → mały zapis pozwalający wznowić pracę | Nie przepisuje całej rozmowy i nie zastępuje current-feature |

Capture obejmuje zarówno nowe notatki, jak i aktualizacje. Nie tworzymy osobnego skilla dla każdej drobnej operacji na pliku. Ingest służy pierwszemu poznaniu źródła, maintain utrzymaniu istniejącej wiedzy, a capture codziennej pracy.

Checkpoint przechowuje: session-id, klienta, cel workflow, identyfikator zadania/planu, aktualny krok, referencje do plików, otwarte pytania i nieprzetworzone odkrycia. Stan Git i status feature odczytuje ponownie ze źródeł, zamiast ufać staremu opisowi checkpointu.

Użytkownik nadal może ręcznie powiedzieć „zapisz to”, „co wiemy o scoringu?”, „zaktualizuj wiedzę o tym API” albo „przejrzyj brain”. Skille mają także działać w zwykłej rozmowie o projekcie, poza cyklem feature.

## 11. Automatyczne zauważanie wiedzy podczas pracy

Agent uruchamia ocenę potrzeby zapisu, gdy:

- Użytkownik poprawił jego rozumienie systemu lub doprecyzował regułę biznesową.
- W celu rozwiązania problemu trzeba było zbadać kilka repozytoriów.
- Odkryto nieoczywisty efekt uboczny lub zależność.
- Zidentyfikowano i sprawdzono przyczynę błędu.
- Podjęto decyzję, której uzasadnienie może być ważne później.
- Powraca pytanie, na które baza nie daje odpowiedzi.
- Znaleziono sprzeczność między notatką a bieżącym źródłem.

Przed zapisem sprawdza wartość dla przyszłej pracy, istniejące wpisy i dowody. Nie mówi „nie ma tego w całej bazie”, jeśli jedynie nie znalazł odpowiedzi w ograniczonym wyszukiwaniu. Wskazuje sprawdzony zakres.

Przykładowe zachowanie:

> Warto to zachować: ta zależność wpływa na frontend i API, a nie znalazłem jej w opisie przepływu. Uzupełniłem notatkę i dodałem źródła.

> Zapisuję Twoje ustalenie jako planowaną zmianę. W obecnym kodzie ta reguła jeszcze nie obowiązuje.

> Znalazłem sprzeczność w opisie statusu. Zachowałem oba źródła. Trzeba ją rozstrzygnąć przed zmianą tego fragmentu.

Komunikaty grupujemy na końcu naturalnego kroku, żeby nie przerywać co chwilę pracy. Istotne odkrycie trafia na dysk w trakcie zadania. Nie polegamy wyłącznie na końcowym hooku.

## 12. Połączenie feature i brain

Feature otrzymuje jawne punkty integracji. Procedury feature pozostają samowystarczalne; brain dostarcza wiedzy o domenie i projektach, a nie instrukcji wyjaśniającej, jak wykonać Git workflow.

| Moment | Odczyt/zapis pamięci |
|---|---|
| Rozpoczęcie planowania | Brain-context: istotne reguły, wcześniejsze decyzje i luki |
| Kolejna odpowiedź w planowaniu | Aktualizacja preview; capture tylko trwałych, wyraźnie podjętych ustaleń, z oznaczeniem planned |
| Plan done | Powiązanie ustaleń z numerowaną specyfikacją; brak oznaczania implementacji jako wykonanej |
| Load/start | Odczyt aktualnego kontekstu i źródeł; powiązanie sesji z zadaniem i checkoutem |
| Istotne odkrycie w implementacji | Natychmiastowy zapis małej obserwacji i następnie ocena capture |
| Zakończenie kroku implementacji | Checkpoint i uzupełnienie wiedzy; wynik brain oddzielony od statusu feature |
| Test/review/status | Odczyt; brak dodatkowych zapisów. Raport może wskazać odkrycia warte osobnego capture |
| Publish | Finalizacja oczekujących odkryć przed przygotowaniem publikacji; wiedza nadal ma zakres gałęzi, a branch brain nie wchodzi do pakietu publish |
| Complete | Aktualizacja zakresu na potwierdzony merge dla konkretnych faktów; brak automatycznego stwierdzenia deploymentu |
| Abandon/plan cancel | Faktycznie poznane zachowania pozostają; niezrealizowane propozycje są oznaczane jako porzucone, a nie wdrożone |

Zachowujemy szablon specyfikacji. Odnośniki do wiedzy trafiają do istniejącej sekcji References, istotne ograniczenia do Constraints, a wymagane sprawdzenia do Goals/Acceptance Criteria. Luki i pełny pakiet kontekstu sesji mogą pozostać w checkpoincie. Nie dokładamy obowiązkowo kilku nowych sekcji do każdego feature’a.

Read-only akcje nie zapisują również dziennika wiedzy w hooku. Samo wyszukiwanie może działać bez trwałej telemetrii. Dzięki temu „status” nadal oznacza tylko sprawdzenie stanu.

Jeżeli brain jest niedostępny, agent ujawnia brak pamięci i korzysta z bieżącego kodu, jeśli zadanie nadal da się wykonać poprawnie. Odkrycia zapisuje do lokalnej kolejki awarii i oznacza jako oczekujące. Nie twierdzi, że zapis do braina się udał. Jeżeli brak konkretnej wiedzy uniemożliwia poprawną decyzję, zatrzymuje ten krok i wyjaśnia, czego brakuje.

## 13. Role i wspólny orkiestrator

| Rola | Zachowana odpowiedzialność | Dodatek związany z pamięcią |
|---|---|---|
| Planner | Pełny zaktualizowany draft i jedno kolejne pytanie; bez zapisu plików | Otrzymuje kontekst brain i wskazuje luki |
| Implementer | Realizacja Goals w wyznaczonym repo; bez commit/push i bez stanu feature | Raportuje odkrycia wraz ze źródłami |
| Tester | Uruchamia realne sprawdzenia i raportuje wyniki; bez napraw kodu | Oznacza potwierdzone zachowania przydatne w przyszłości |
| Reviewer | Ocenia diff i nowe pliki względem specyfikacji; bez edycji | Wskazuje rozjazdy z wiedzą i ważne ustalenia |
| Orkiestrator | Rozpoznaje system, zleca role, zarządza stanem i Git | Uruchamia właściwy zapis pamięci przez runtime |

Role zwracają strukturę „odkrycie, dowód, zakres, niepewność”. Nie otrzymują ogólnego prawa do równoczesnego edytowania tych samych notatek. Jeśli implementacja potrzebuje checkpointów podczas długiego zadania, adapter może przekazać obserwację orkiestratorowi albo do izolowanej kolejki obserwacji. Nie daje to roli prawa do zmiany current-feature czy kanonicznej notatki.

Wspólny kontrakt roli określa wymagane możliwości, np. odczyt repo, edycję kodu lub uruchamianie testów. Nazwy narzędzi, sposób delegacji i model są konfiguracją klienta. Przykładowo wybór Sonnet dla Claude reviewera nie staje się obowiązkową nazwą modelu dla przyszłego Codexa.

## 14. Claude Code i Kiro jako równorzędne klienty

Rdzeń systemu jest niezależny od klienta. Oba adaptery używają tych samych specyfikacji, stanu feature, rejestru, braina i definicji zachowania. Klient nie ma własnej konkurencyjnej wersji pamięci projektu.

| Obszar | Kontrakt adaptera |
|---|---|
| Start | Dostarczyć krótki router, rozpoznać workspace i właściwy projekt |
| Skille | Udostępnić wspólną treść przez mechanizm danego klienta |
| Role | Utworzyć konfiguracje czterech ról i mapować ich narzędzia |
| Kontynuacja planowania | Zachować bieżący draft i przyjęte odpowiedzi bez zadawania ich ponownie |
| Widoczność zadań | Pokazać checklistę Goals i rzetelny postęp |
| Hooki | Wywoływać wspólne operacje tam, gdzie dane zdarzenie jest wspierane |
| Dostęp do plików | Zapewnić jawny dostęp do właściwych repo, context, brain i stanu |
| Diagnostyka | Wykrywać brak skilla, roli, dostępu lub wymaganej funkcji |

Claude Code używa własnego formatu instrukcji i konfiguracji subagentów. Wznowienie własnego subagenta może zachować jego historię. Dokumentacja Kiro potwierdza role własne i delegację w IDE/CLI, ale nie stanowi dowodu identycznego cyklu SendMessage.

Projektowana zasada przenośności: jedna logiczna sesja plannera, której trwałym źródłem jest bieżący draft i checkpoint. Claude może utrzymywać żywą instancję plannera zgodnie z obecnym skillem. Adapter Kiro wykorzystuje kontynuację, jeśli wersja klienta ją zapewnia; w przeciwnym razie nowa instancja tej samej roli otrzymuje pełny zaakceptowany stan. To jawna adaptacja techniczna, nie zgoda na utratę kontekstu czy zastąpienie plannera improwizacją orkiestratora.

Jeśli wymaganej roli lub niezbędnej możliwości nie ma, właściwa akcja zgłasza problem. Nie udaje wykonania review/testów ani delegacji. Obsługa Kiro wymaga sprawdzenia konkretnej wersji IDE/CLI; „Kiro” nie oznacza identycznych zdarzeń we wszystkich wariantach produktu.

Hooki są zabezpieczeniem, a podstawowe punkty odczytu i zapisu należą do wspólnego workflow. Stop w Claude i Agent Stop w Kiro mają różną semantykę; nie kopiujemy konfiguracji pomiędzy nimi. Hook nie zastępuje capture podczas pracy i musi respektować tryb read-only akcji.

W zwykłej rozmowie poza feature krótkie instrukcje i skille także zapewniają odczyt/capture. Nie ma technicznej gwarancji, że model rozpozna każde wartościowe odkrycie. Możemy natomiast wymagać zapisu wykrytych obserwacji, końcowego wyniku przeglądu pamięci i komunikatu o awarii.

Kiro Specs nie staje się drugim właścicielem zadań feature. Źródłem pozostaje dotychczasowa specyfikacja i stan wspólnego systemu. Ewentualna integracja z natywnym systemem zadań jest widokiem/adaptacją, nie osobną listą wymagań.

Fakty o klientach sprawdzono 17 września 2026 w dokumentacji: [Claude subagents](https://code.claude.com/docs/en/sub-agents), [Kiro custom agents](https://kiro.dev/docs/custom-agents/), [Kiro subagents](https://kiro.dev/docs/custom-agents/subagents/), [Kiro hooks](https://kiro.dev/docs/hooks/). To podstawa projektu adapterów, nie potwierdzenie ich działania w Twojej lokalnej instalacji.

## 15. Dodanie Codexa lub innego klienta w przyszłości

Nowy adapter ma implementować ten sam kontrakt: router, dostęp do skilli, role, checklisty, wywołania runtime i pamięć. Nie wymaga przenoszenia notatek, zmiany formatu specyfikacji ani nowego stanu feature.

Rdzeń nie zawiera nazw konkretnych narzędzi takich jak SendMessage czy TaskCreate. Są w adapterze, który mapuje je na operacje „kontynuuj rolę”, „utwórz checklistę”, „zaktualizuj wynik”. Lista możliwości klienta jest jawna; brak funkcji oznacza wskazane ograniczenie, nie pozorną pełną zgodność.

Przyszły klient zdalny będzie wymagał osobnego sposobu dostępu do plików. Samo skonfigurowanie lokalnego katalogu nie udostępnia braina agentowi działającemu w chmurze. Na tym etapie projektujemy lokalne użycie Claude Code i Kiro.

## 16. Zmiana klienta i równoległe sesje

Możesz zaplanować zadanie w Claude, a później wznowić je w Kiro. Nowy klient odczytuje specyfikację, stan feature, checkpoint i odpowiedni kontekst braina. Nie odtwarza całej historii czatu, tylko to, co jest potrzebne do dalszego działania.

Jedno aktywne zadanie per system pozostaje. Dwie sesje mogą czytać ten sam projekt, ale mutacje workflow i edycja tego samego checkoutu mają jednego aktywnego właściciela. Przekazanie pracy między klientami kończy lub zwalnia poprzednie przejęcie zadania; nie przejmuje w ciemno wciąż aktywnej sesji. Po awarii przejęcie jest odzyskiwane po weryfikacji procesu i checkpointu.

Różne projekty mogą być aktywne równocześnie. Krótkie zapisy do wspólnego braina są serializowane, a osobne worktree kontekstu chronią przed wzajemnym przełączaniem gałęzi. Pełna współpraca wielu agentów nad tym samym kodem jednocześnie nie jest obietnicą tego projektu.

## 17. Trwałość, historia i wiarygodność zapisu

Runtime realizuje wspólny zapis dla klientów:

- Unikalne ID sesji, obserwacji i transakcji; nazwa gałęzi jest metadanymi.
- Trwały zapis obserwacji przed potwierdzeniem sukcesu użytkownikowi.
- Sprawdzenie istniejącego wpisu i oczekiwanego hasha wersji przed aktualizacją.
- Krótka blokada procesu zapisującego i atomowa podmiana pojedynczego pliku.
- Odtwarzalny dziennik niedokończonych operacji; ponowienie tego samego ID nie tworzy duplikatu.
- Indeksy generowane z notatek; awaria indeksu nie usuwa wiedzy.
- Ręczne edycje są wykrywane przez porównanie wersji; chronione wpisy wymagają propozycji aktualizacji.

Atomowa podmiana pliku nie oznacza atomowej transakcji całego repo. Zapis notatki, rozpatrzenie obserwacji i historia Git wymagają jawnego odzyskiwania przerwanego działania. Trwałość wobec utraty zasilania wymaga utrwalenia danych, nie jedynie zwrócenia sukcesu przez zapis pliku.

Propozycja dla braina: automatyczne lokalne commity wyłącznie własnych zmian, pod tą samą blokadą. Repo brain nie ma remote i nie wykonuje push. Jest to oddzielna polityka archiwizacji pamięci do zatwierdzenia wraz z projektem; nie zmienia zasad commit/push kodu i kontekstu w feature. Nie można wciągać przypadkowych plików z cudzego stagingu.

Sekrety są poza brainem. Zewnętrzne dokumenty są danymi, a nie instrukcjami nadającymi agentowi nowe uprawnienia. Automatyczne odkrycie „warto zmienić skill” może stworzyć propozycję rozwoju systemu, ale nie uruchamia jego samodzielnej przebudowy.

Git daje historię, nie zastępuje backupu. Backup obejmuje brain, context, zmiany systemu oraz nieodtwarzalny stan `.state/` — aktywne zadania, preview, staging, checkpointy i kolejkę awarii. Cache i wygenerowane pliki klientów można odtworzyć.

## 18. Instalacja i możliwość dostosowywania — docelowe zachowanie

Nowa instalacja otrzymuje pusty rejestr projektów i pusty brain. Źródła systemu nie niosą automatycznie prywatnych projektów, historii zadań ani sekretów z innej maszyny.

Pierwszy etap przygotowawczy inicjalizuje lokalne repo system/context/brain, ich początkowe commity i jawnie wybrane bazy. Nie tworzy origin ani bare repo dla tych katalogów. Następnie dostosowuje feature i role do local-only/remote; dopiero sprawdzony nowy skill może prowadzić dalszą budowę systemu. Początkowe czynności wykonuje agent zwykłymi narzędziami, według zaakceptowanej specyfikacji etapu.

Użytkownik wybiera klientów Claude Code i Kiro. Konfigurator udostępnia im wspólne skille i role, instaluje krótkie mosty startowe i sprawdza dostęp do plików. Przy otwarciu pojedynczego repo również musi zadziałać routing — nie opieramy całości na obowiązku otwierania zawsze folderu nadrzędnego.

Aktualizacja systemu:

- Obejmuje źródła systemu i jego zarządzane konfiguracje.
- Nie zastępuje context, brain ani projektów.
- Nie nadpisuje obcych ustawień klienta ani ręcznie zmienionych plików bez wykrycia konfliktu.
- Raportuje różnice wersji skilli, ról i schematów.
- W przypadku zmiany schematu danych wymaga jawnej migracji z możliwością cofnięcia.

Będziesz mógł zmienić samodzielnie reguły capture, szablony notatek, standardy konkretnego projektu, zakres wiedzy pobieranej na start, model przypisany roli w kliencie i treść skilli. Wersjonowanie pozwala sprawdzić, od której zmiany agent zachowuje się inaczej.

## 19. Przykład codziennej pracy

Scenariusz jest ilustracyjny, nie opisuje potwierdzonego zachowania LFO.

1. W Claude uruchamiasz `feature plan` dla zmiany w projekcie frontendowym.
2. Feature rozpoznaje cel i wczytuje jego context. Brain-context znajduje wcześniejszą decyzję biznesową oraz flow obejmujące API.
3. Planner doprecyzowuje wymagania po jednym pytaniu. Ustalenia zapisuje orkiestrator w preview; trwała decyzja trafia do braina jako planned.
4. Po plan done/load/start implementer pracuje na gałęzi kodu. Dokumenty zadania mają gałąź w osobnym worktree context.
5. Podczas analizy okazuje się, że dodatkowy system zmienia interpretację pola. Agent zapisuje obserwację, sprawdza źródło i uzupełnia istniejącą notatkę. Informuje jednym zdaniem.
6. Zamykasz klienta i wracasz w Kiro. Kiro widzi ten sam aktywny feature, odtwarza checkpoint i ponownie sprawdza Git.
7. Test i review raportują wyniki bez samodzielnego poprawiania kodu i bez ukrytego zapisu do braina.
8. Publish przedstawia konkretny pakiet commitów kodu i kontekstu. Po zatwierdzeniu wysyła gałąź projektu na jego origin i zapisuje lokalne commity kontekstu. Kontekst nie trafia na serwer.
9. Complete potwierdza merge obu gałęzi. Wiedza może zostać oznaczona jako dotycząca scalonego kodu; produkcja nadal wymaga własnego dowodu.
10. Przy kolejnym zadaniu agent znajduje tę zależność bez ponownego przeszukiwania wszystkiego od zera.

## 20. Decyzje proponowane do akceptacji

| Decyzja | Propozycja |
|---|---|
| Układ | ai-system bez Git; system/context/brain z lokalnym Git bez remote; tylko projekty mają zdalne repo |
| Sposób budowy | Nowe źródła od podstaw; obecne ai-os jako wzorzec kontraktu |
| Feature | Interfejs, role i cykl zachowane; jawna adaptacja Git, Published i referencji merge dla local-only/remote |
| Kontekst pracy | Oddzielne repo context, dwie gałęzie i worktree dla kontekstu zadania |
| Pamięć | Jeden globalny vault Markdown, możliwy do otwarcia w Obsidianie |
| Zapis | Automatyczny dla potwierdzonych ustaleń; kandydaci i konflikty opisane wprost |
| Historia braina | Automatyczne lokalne commity pamięci; bez remote i push |
| Klienci | Claude Code i Kiro; wspólny rdzeń i osobne adaptery |
| Kolejni klienci | Rozszerzenie przez adapter, bez migracji wiedzy |
| Dostosowanie | Własne wersjonowane skille, role, polityki, szablony i ustawienia projektów |
| Technika | Pliki, Git i mały lokalny runtime; propozycja TypeScript |
| Obecny etap | Akceptacja lub korekta architektury; bez rozpisywania kroków budowy |

Najważniejsze jawne odstępstwa od dosłownego kopiowania starego systemu: lokalny Git bez remote dla system/context/brain, brak repo nadrzędnego, oddzielne repo context, fizyczny stan w `.state`, context worktree zamiast przełączania wspólnego katalogu, kontekst pamięci na początku zadania oraz techniczna adaptacja kontynuacji plannera w Kiro. To elementy do zatwierdzenia jako część nowej architektury.
