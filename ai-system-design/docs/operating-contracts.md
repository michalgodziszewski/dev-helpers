# Kontrakty operacyjne i praca bez dostępu do repo źródłowego

## Przenośność dokumentacji a działanie produktu

Ta paczka jest samodzielną dokumentacją projektu i kopią źródeł referencyjnych. Nie jest instalatorem gotowego ai-system. Nowe skille brain-* i adaptery wymagają napisania oraz sprawdzenia po zatwierdzeniu projektu.

Brak dostępu do prywatnego repo ai-os w pracy nie może blokować czytania dokumentacji ani odtworzenia skilla. W paczce znajdują się pełne źródła z konkretnego commita, role, reguły, kontekst i wiki. Żaden opis zachowania feature nie wymaga otwarcia GitHuba: oryginalne pliki są dostępne lokalnie, a najważniejsze zostały również osadzone w dokumentacji zbiorczej.

Nie utożsamiamy tego z działaniem modelu całkowicie bez internetu. Claude Code i Kiro mogą wymagać dostępu do swoich usług. Projekty firmowe mogą korzystać z własnych remote. Projekt usuwa zależność od prywatnego repo źródłowego ai-os, nie obiecuje lokalnego działania modeli.

## Co przenosimy do pracy

| Element | Cel przeniesienia | Stan w tej paczce |
|---|---|---|
| Opis całego produktu | Zrozumienie architektury bez historii czatu | Gotowa dokumentacja |
| Specyfikacja każdego skilla | Samodzielne napisanie nowych procedur | Gotowy projekt zachowania |
| Oryginalny feature i jego akcje | Dokładny punkt odniesienia zgodności | Kompletne, niezmienione źródła |
| Cztery role i GUIDELINES | Zakresy odpowiedzialności i istniejące zasady | Kompletne, niezmienione źródła |
| Session-handoff | Zachowanie podsumowania rozmowy | Kompletny oryginał |
| Context i wiki starego systemu | Uzasadnienia, historia i istniejące specyfikacje | Snapshot dokumentów |
| Diagramy SVG | Oglądanie bez renderera Mermaid | Gotowe pliki i osadzenie w HTML |
| Źródła Mermaid | Późniejsza edycja diagramów | Pliki .mmd |
| Nowy runtime i adaptery | Wykonywanie projektowanego systemu | Jeszcze niezaimplementowane |

Snapshot nie zawiera kodu przykładowych aplikacji Angular/Nest. Ich opisy kontekstowe są zachowane; sam kod aplikacji nie jest zależnością procedur feature. Nie jest to eksport historii Git, issue ani PR. Pochodzenie plików określa source-manifest.json.

Oryginalny feature nie jest gotowym modułem do bezpośredniego uruchomienia w nowym układzie. Zawiera ścieżki oraz założenia o repo nadrzędnym. Zachowujemy go jako wzorzec, a nową implementację dopasujemy do oddzielnego system/context/brain. Samo skopiowanie katalogu `.claude/skills/feature` nie załatwia tej adaptacji.

## Hierarchia źródeł w paczce

1. Dokumentacja nowego produktu opisuje projekt docelowy zgodny z bieżącymi wymaganiami użytkownika.
2. Rozdział zgodności wskazuje zachowanie feature, które ma zostać zachowane, oraz jawne adaptacje infrastruktury.
3. Oryginalne pliki operacyjne pokazują dokładny obecny kontrakt akcji i ról.
4. Historyczne specyfikacje i wiki opisują wcześniejsze plany lub uzasadnienia. Nie są automatycznie instrukcją obowiązującą w nowym systemie ani dowodem wdrożenia.

W razie rozbieżności nie składamy nowego zachowania przypadkowo z kilku historycznych opisów. Zapisujemy rozbieżność i rozstrzygamy ją w specyfikacji nowej wersji. Przykładem jest deklarowany moment ustawienia In Progress w start oraz odwołujący się do niego komentarz w backport.

## Pełny interfejs feature

Prefiks poleceń pozostaje `/feature`. Poniższa tabela definiuje argumenty, nie uruchamia żadnego workflow.

| Polecenie | Argumenty i znaczenie |
|---|---|
| plan | [--system SYSTEM] [feature/bugfix/fix/hotfix/chore] [NAME_OR_DESCRIPTION] |
| plan resume | NAME [--system SYSTEM] |
| plan status | Braki planu bieżącej rozmowy lub przegląd preview |
| plan cancel | Koniec bieżącego planowania; opcjonalne usunięcie pliku |
| plan done | Finalizacja bieżącego preview |
| load | WORK_TYPE NUMBER-NAME [--system SYSTEM] |
| start | [--system SYSTEM] |
| test | [--system SYSTEM] |
| review | [--system SYSTEM] |
| publish | [--system SYSTEM] |
| clear | [--system SYSTEM] |
| complete | [WORK_BRANCH] [--system SYSTEM] |
| abandon | [--discard] [WORK_BRANCH] [--system SYSTEM] |
| backport | RELEASE_BRANCH [WORK_BRANCH] [--system SYSTEM] |
| status | [--system SYSTEM]; brak argumentu pokazuje wszystkie systemy |

`plan` bez systemu przy nowej sesji pyta o niego jawnie. Pozostałe akcje zachowują swoje szczegółowe reguły; ogólne domyślne ai-os nie zastępuje wyjątków w plan/status/resume. Po ustaleniu System/Work Type/Name w bieżącym planowaniu agent nie pyta o nie ponownie w każdej turze.

Kolizja nazwy preview powoduje odmowę utworzenia nowego pliku i wskazanie resume lub innej nazwy. Skill nie dopisuje sam sufiksu i nie nadpisuje istniejącego preview. Plan done wymaga Description, co najmniej jednego Goal, Work Type i Base Branch. Numeracja jest osobna dla features i fixes w obrębie systemu.

## Stany aktywnego zadania

| Stan przed | Akcja/warunek | Stan po | Uwagi |
|---|---|---|---|
| Idle lub brak slotu | load poprawnej specyfikacji | Not Started | Inny system nie blokuje tego slotu |
| Not Started | start | In Progress | W źródłowym start końcowy krok po pracy implementera; przerwanie wymaga rozpoznania etapu |
| In Progress / Published | test lub review | Ten sam | Raport bez mutacji stanu |
| In Progress | Wszystkie operacje publish zakończone | Published | Listy commitów obu repo; push wymagany tylko dla kodu projektu remote |
| Published | clear | Idle + Pending Reviews: Published | Bez weryfikacji merge |
| Published/Merged | backport aktywnego wpisu | Merged | Stan zapisywany po utworzeniu gałęzi backportu przed cherry-pick |
| Merged | clear | Idle + Pending Reviews: Merged | Metadane backportu podróżują razem z wpisem |
| Published/Merged | complete, wszystkie merge potwierdzone | Idle | Dotyczy aktywnego slotu |
| Not Started/In Progress/Merged | abandon | Idle | Zachowane reguły sprzątania |
| Published | abandon aktywnego slotu | Odmowa | Właściwe clear albo complete |

Published oznacza gotowy pakiet do osobnego scalenia. Dla local-only jest to zestaw lokalnych commitów, dla remote także udany push. Nie dowodzi wysłania context/system na serwer. Pełny kontrakt trybów jest w rozdziale o lokalnym Git.

Status Merged w źródłowym workflow nie znaczy, że cały backport jest już scalony. Primary jest scalony, a metadane backportu są zapisane i wymagają dalszej weryfikacji. Znaczenia tych stanów nie należy odczytywać wyłącznie z ich nazw.

Pending Reviews może mieć wiele wpisów. Polecenie z WORK_BRANCH wybiera dokładny wpis, nie dopasowanie przybliżone. Backport wpisu pending nadaje mu Backport Awaiting Review. Complete usuwa właściwy wpis dopiero po sprawdzeniu wszystkich wymaganych merge; aktywny slot innego zadania pozostaje.

## Specyfikacja feature: pola i źródła

| Pole/sekcja | Znaczenie |
|---|---|
| Git Workflow: Workflow | trunk albo branch |
| Work Type | feature, bugfix, fix, hotfix, chore |
| Jira Ticket | Opcjonalny klucz używany w nazwach; bez integracji API |
| Base Branch | Jawna baza kodu; przy nowym planie brak wartości oznacza pytanie, nie automatyczne main |
| Context Base Branch | Jawna, niezależna lokalna baza repo context |
| Description | Problem, obecne zachowanie i oczekiwany wynik |
| Goals | Konkretne cele implementacji i weryfikacji |
| Constraints | Ograniczenia i zachowania, które mają pozostać |
| References | Rzeczywiste źródła, w tym trafne notatki braina |
| Acceptance Criteria | Obserwowalne warunki uznania pracy za wykonaną |

W nowym układzie aktualne pliki projektowe, instrukcje i istniejące standardy repo są rozpoznawane przez resolver. Osobisty kontekst nie może po cichu unieważniać zasad repo. Nierozstrzygnięty konflikt jest pokazywany użytkownikowi.

## current-feature i stan lokalny

Pola zachowanego modelu: System, Workflow, Work Type, Base Branch, Work Branch, Source Spec, Status, Published Commits; dodatkowo Context Base Branch, Context Work Branch, Context Published Commits oraz Backport Release Branch, Backport Branch i Backport Commits. Dokument zawiera również Pending Reviews.

Docelowe położenie jest lokalne: `.state/features/<system>/current-feature.md`. Zmiana katalogu jest świadomą adaptacją. Source Spec odwołuje się do właściwego pliku w stagingu lub worktree, a stabilny work-item-id pozwala zachować odniesienie podczas przeniesienia pliku.

Tryb Git i rozpoznane cele repo są zapisywane przy przyjęciu zadania. Brak remote nie może po cichu zmieniać zadania projektu z remote na local-only. Pola Published Commits oraz Context Published Commits przechowują także SHA lokalnego pakietu po publish. Nowe techniczne pola, takie jak operacja przerwana, właściciel sesji i numer rewizji, należą do dziennika runtime. Nie wprowadzają ukrytego nowego statusu feature. Runtime zapisuje wynik częściowej operacji, aby wznowienie nie tworzyło ponownie gałęzi lub commitów.

## Granice ról

| Czynność | Orkiestrator | Planner | Implementer | Tester | Reviewer |
|---|---|---|---|---|---|
| Czytanie specyfikacji i wskazanych źródeł | Tak | Tak | Tak | Tak | Tak |
| Zapis preview/specyfikacji/stanu | Tak | Nie | Nie | Nie | Nie |
| Edycja kodu | Zleca implementerowi | Nie | Tak, w zakresie Goals | Nie | Nie |
| Uruchamianie sprawdzeń | Organizuje | Nie | Pomocniczo | Tak | Odczyty potrzebne do review |
| Branch/commit/push | Tak, zgodnie z akcją | Nie | Nie | Nie | Nie |
| Zapis kanonicznej notatki brain | Przez capture/runtime | Nie | Nie | Nie | Nie |
| Zgłoszenie odkryć | Tak | Tak | Tak | Tak | Tak |

Uprawnienia shell nie są automatycznie twardą gwarancją read-only. Adapter musi mapować zakresy i ograniczenia realnymi możliwościami klienta, a dokumentacja nie powinna twierdzić, że sam opis roli technicznie uniemożliwia każdą niedozwoloną komendę.

## Wymagany kontrakt adaptera

| Możliwość | Warunek zgodności |
|---|---|
| Routing | Działa w root workspace, pojedynczym repo i podkatalogu |
| Dostęp do plików | Jawny, ograniczony do potrzebnych repo, context, brain i stanu |
| Skille | Jedno źródło treści, brak konkurencyjnych wersji feature |
| Role | Właściwy brief, zakres narzędzi i format raportu |
| Kontynuacja plannera | Zachowuje logiczną sesję i zaakceptowany draft |
| Lista zadań | Pokazuje rzeczywisty postęp Goals, bez oznaczania niepotwierdzonych celów jako wykonanych |
| Pamięć | Wywołuje capture/checkpoint w dozwolonych momentach |
| Read-only | Hooki nie zapisują po akcjach tylko do odczytu |
| Diagnostyka | Wskazuje brak roli, skilla, uprawnienia i nieobsługiwaną wersję |
| Przejęcie pracy | Weryfikuje stan i nie przejmuje w ciemno aktywnego właściciela |

W Claude mapujemy własne instrukcje, role, checklisty i hooki klienta. W Kiro mapujemy odpowiednie steering, skills, custom agents i zdarzenia IDE/CLI. Nie deklarujemy, że te same pliki konfiguracyjne są przenośne między klientami. Obsługa lokalnej wersji jest wynikiem sprawdzenia, nie założeniem z nazwy produktu.

## Model notatki wiedzy

| Pole | Wymaganie |
|---|---|
| id | Stabilny, unikalny identyfikator |
| type | system, flow, rule, decision, lesson, runbook, idea lub inny zarejestrowany typ |
| subject | Temat pomagający wyszukać istniejący wpis |
| systems / domains | Jednoznaczne ID powiązanych encji |
| status | candidate, confirmed, disputed, superseded |
| freshness | checked albo needs-review |
| scope | Plan/working tree/commit/gałąź/środowisko, zgodnie z dowodem |
| evidence | Lista źródeł i tego, co potwierdzają |
| verified_at | Data rzeczywistego sprawdzenia; null, jeśli nie sprawdzono |
| updated_at | Data zapisu/aktualizacji, niezależna od weryfikacji |
| managed_by | agent albo human; ręczna ochrona oddzielnie określona |
| supersedes / related | Referencje do poprzednich i powiązanych ustaleń |

Treść zawiera twierdzenie, znaczenie praktyczne, dowody, ograniczenia i ewentualne otwarte pytania. Kilka zdań o różnej pewności otrzymuje dowody i statusy per twierdzenie albo osobne notatki. Wpis confirmed nie może ukrywać niepotwierdzonej części pod wspólnym nagłówkiem.

Zmiana źródła jest sygnałem do przeglądu. Sam nowy commit w repo nie unieważnia wszystkich notatek; hash właściwego pliku/symbolu pomaga zawęzić sprawdzenie. Połączenie kandydatów z kilku sesji powinno zachować wszystkie istotne dowody.

## Zapis i awarie

| Sytuacja | Oczekiwane zachowanie |
|---|---|
| Ten sam capture wykonany drugi raz | Idempotentny wynik, bez duplikatu |
| Ręczna zmiana pliku po odczycie | Konflikt wersji, ponowny odczyt, bez nadpisania |
| Dwie sesje zapisują jednocześnie | Krótka blokada wspólnego zapisu |
| Awaria po zapisie notatki przed zamknięciem obserwacji | Dziennik operacji pozwala zakończyć bez drugiej kopii |
| Zapis pliku udany, lokalny commit brain nieudany | Wiedza zachowana; jawny brak wersji Git, naprawa historii osobno |
| Brain niedostępny | Lokalna trwała kolejka i status queued |
| Capture nie ma dowodu | Candidate, nie confirmed |
| Indeks jest stary | Odczyt źródeł, odbudowa w odpowiedniej akcji |
| Push kodu udany, commit kontekstu nieudany | Raport częściowego wyniku; bez pozornego Published całego zadania |
| Brak origin w system/context/brain | Prawidłowe local-only; bez prób fetch/push lub utworzenia remote |
| Brak origin w projekcie remote | Błąd konfiguracji; bez cichego przejścia na local-only |
| Conflict w cherry-pick | Stop i zachowanie stanu, bez automatycznego abort |
| Klient nie ma potrzebnej roli | Akcja zgłasza brak; nie udaje delegacji |
| Proces zginął przed zapisaniem obserwacji | Brak gwarancji odzyskania niezapisanego odkrycia |

## Scenariusze odbiorowe produktu

To warunki poprawności, a nie kolejność budowy.

1. Nowa sesja rozpoznaje właściwe repo bez polegania na basename.
2. Własny worktree jest mapowany do tego samego projektu z osobnym checkout-id.
3. Dwa preview o różnych nazwach współistnieją, a kolizja nazwy nie nadpisuje pliku.
4. Jeden aktywny slot nie blokuje pracy nad innym systemem.
5. Dwie sesje nie przydzielają tego samego numeru specyfikacji.
6. Planner zachowuje odpowiedzi podczas kontynuacji i zmiany klienta.
7. Review nie edytuje kodu, a status nie zapisuje do braina nawet przez hook.
8. Odkrycie podczas implementacji pojawia się w pamięci nowej sesji.
9. Ten sam fakt odkryty ponownie aktualizuje wpis lub daje already-known.
10. Reguła planned nie jest przedstawiana jako wdrożona.
11. Wiedza z gałęzi nie jest automatycznie stosowana do PROD.
12. Chroniona ręczna notatka dostaje propozycję, nie nadpisanie.
13. Partial publish obu repo jest widoczny i możliwy do rozpoznania przy wznowieniu.
14. Complete odmawia, gdy kod scalono, a kontekstu jeszcze nie.
15. Backport konfliktuje na drugim commicie i zachowuje SHA pierwszego.
16. Brak dostępu do prywatnego ai-os nie blokuje przeczytania dokumentacji ani źródeł feature w tej paczce.
17. Dokumentacja HTML wyświetla wszystkie diagramy bez CDN, fontów lub skryptów z internetu.
18. Kopia zapasowa pozwala odtworzyć nie tylko brain i context, ale również lokalny stan aktywnej pracy.
19. Rozwój systemu przechodzi pełny workflow bez origin, serwera Git i bare repo.
20. Publish projektu wysyła wyłącznie kod; kontekst jest commitowany i scalany lokalnie.
21. Complete nie uznaje lokalnego scalenia kodu projektu za dowód scalenia na jego origin.
22. Complete local-only sprawdza wszystkie wymagane SHA w lokalnej bazie, bez fetch.

## Słownik

- **Brain/vault:** trwała wiedza w Markdown, wspólna dla klientów.
- **Context:** ustawienia projektów, standardy i wersjonowane dokumenty pracy.
- **Runtime:** program obsługujący powtarzalne operacje na plikach i stanie.
- **Adapter:** integracja wspólnego zachowania z konkretnym klientem.
- **Orkiestrator:** agent odpowiedzialny za cały workflow, stan i zlecenia ról.
- **Checkpoint:** mały zapis do wznowienia zadania, nie pełna historia czatu.
- **Observation:** odkrycie oczekujące na ocenę i ewentualny zapis wiedzy.
- **Candidate:** zapisane twierdzenie wymagające potwierdzenia.
- **Worktree:** oddzielny katalog roboczy innej gałęzi tego samego repo.
- **Pending Reviews:** wpisy opublikowanych zadań odłożone poza aktywny slot.
- **Scope:** wersja, gałąź lub środowisko, do którego odnosi się informacja.
- **Local-only:** repo Git bez jakiegokolwiek remote; lokalne commity, gałęzie i scalenia.
- **Local origin:** dawne rozwiązanie ai-os z lokalnym bare remote; nie stosujemy go w system/context/brain.

## Otwarte kwestie przed implementacją

Architektura i kontrakty są opisane. Dokładna wersja Claude Code/Kiro, system operacyjny w pracy, dostępne mechanizmy uprawnień oraz mapowanie kontynuacji roli wymagają sprawdzenia na docelowym komputerze. To parametry integracji, nie brakująca wiedza o tym, jak ma zachowywać się produkt.

Należy również potwierdzić przy implementacji sposób scalania projektów. Obecny feature sprawdza ancestry opublikowanych commitów, więc zachowanie zgodności nie obejmuje automatycznie squash merge. Obsługa squash i wielu równoczesnych celów backportu byłyby jawnymi rozszerzeniami, a nie ukrytymi zmianami przy dodawaniu braina.
