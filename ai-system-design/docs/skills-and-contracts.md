# Szczegółowa dokumentacja skilli i kontraktów produktu

Ten rozdział opisuje projektowane zachowanie. Skille brain-* i wspólny runtime nie są jeszcze zaimplementowane. Oryginalny feature i session-handoff zostały zachowane osobno jako źródła referencyjne; ich obecność w paczce nie instaluje ich ani nie dostosowuje automatycznie do nowego układu.

## Katalog skilli

| Skill | Rola produktu | Domyślny zapis | Przykładowe wywołanie użytkownika |
|---|---|---|---|
| feature | Cykl pracy nad zmianą, stan i Git | Według wybranej akcji | /feature plan, /feature start |
| brain-context | Dobranie wiedzy do zadania | Nie | Sprawdź, co wiemy o tym przepływie |
| brain-capture | Zachowanie lub aktualizacja odkryć | Tak, w brain | Zapisz tę regułę i jej uzasadnienie |
| brain-ingest | Pierwsze wprowadzenie wybranego źródła | Tak, w zadanym zakresie | Poznaj to API i opisz najważniejsze zależności |
| brain-maintain | Przegląd jakości i kontrolowane porządki | Raport osobno od zastosowania zmian | Sprawdź nieaktualne informacje o tym systemie |
| brain-checkpoint | Stan potrzebny do kontynuacji sesji | Tak, w .state | Zapisz punkt wznowienia pracy |
| session-handoff | Podsumowanie do skopiowania | Nie, tylko odpowiedź | /session-handoff |

Nie dodajemy osobnego skilla dla każdej operacji na pliku. Capture obejmuje tworzenie i aktualizowanie. Checkpoint opisuje zadanie, a capture wiedzę, która ma przeżyć zakończenie zadania.

## Wspólna umowa wykonania

Każde wykonanie otrzymuje rozpoznany workspace i rejestr projektów, zakres zadania, tryb dostępu, wersję schematu, identyfikator sesji oraz — jeśli dotyczy — zadania, checkoutu i rewizji. Nie wszystkie pola muszą być znane: pytanie przekrojowe może nie mieć wybranego repo. Brak pola oznacza brak ustalenia, nie wartość domyślną zgadywaną przez model.

Każdy skill zwraca wynik merytoryczny, wykorzystane źródła, ujawnione niepewności i wykonane zmiany. Jeżeli nic nie zapisano, wynik nie zawiera komunikatu sugerującego zapis. Pola techniczne są do obsługi programu; użytkownik dostaje krótką, zrozumiałą informację.

Wyniki capture: created, updated, already-known, candidate, conflict, skipped, queued lub failed. Wynik queued oznacza lokalne zabezpieczenie obserwacji oczekującej na właściwy zapis. Nie jest sukcesem publikacji wiedzy do braina.

Nieznana wersja schematu blokuje mutację wymagającą tego schematu. Odczyt może pokazać surową treść z ostrzeżeniem. Skill nie dokonuje samowolnej migracji całej bazy podczas odpowiedzi na zwykłe pytanie.

## brain-context — wyszukiwanie wiedzy

**Cel:** dostarczyć najmniejszy wystarczający pakiet kontekstu, aby agent mógł wykonać zadanie i rozpoznać brakujące informacje.

**Uruchomienie:** plan/load/start, zmiana obszaru pracy, pytanie o architekturę lub regułę biznesową, debugowanie z zależnościami między projektami, prośba o odczyt pamięci. Nie wymaga uruchomienia całego feature.

**Wejście:** pytanie lub cel, opcjonalne ID systemów i domen, rozpoznane repo/checkout, potrzebny zakres wersji lub środowiska, kontekst już odczytany w tej sesji.

**Czyta:** rejestr i właściwy project-overview, indeks braina, pasujące notatki, decyzje, flows i dowody. Może sprawdzić wskazany plik źródłowy w ramach dostępu sesji. Nie czyta całego braina z definicji.

**Zapis:** brak. Użycie indeksu nie wymaga trwałego licznika odczytów. Weryfikacja nie aktualizuje sama notatki; wykryty rozjazd jest wynikiem dla dalszego capture lub maintain.

**Przebieg:**

1. Rozpoznaj cel i właściwe systemy. Nie myl systemu workflow feature z encją systemu technicznego.
2. Ustal, o jaką wersję chodzi: bieżący working tree, gałąź, scalony kod czy środowisko. Jeżeli pytanie nie wymaga środowiska, nie pytaj o nie sztucznie.
3. Przeszukaj ID, tytuły, tagi, temat, aliasy i treść. Najpierw zawęź po systemie/domenie, potem rozszerz wyszukiwanie, jeśli brakuje odpowiedzi.
4. Odczytaj trafne notatki. Wyszukanie nazwy pliku nie jest dowodem przeczytania i zrozumienia treści.
5. Sprawdź zakres, źródła i świeżość. Oddziel wpisy confirmed od candidate oraz fakty o innej gałęzi.
6. Podążaj za zależnościami istotnymi dla zadania. Limit jednego sąsiada nie może urwać ważnego przepływu.
7. Zwróć kontekst, odnośniki, luki i miejsca wymagające sprawdzenia w kodzie.

**Wynik:** lista kilku istotnych ustaleń z referencjami i zakresem; konflikty i niewiadome; proponowane konkretne źródła do dalszego sprawdzenia. Budżet początkowy około 2–4 tys. tokenów jest parametrem, nie limitem kompletności analizy.

**Błędy i brzegi:** brak indeksu → odczyt plików i jawne zaznaczenie ograniczenia; niejednoznaczne repo → wybór zamiast zgadywania; brak notatki → „nie znalazłem w sprawdzonym zakresie”; notatka sprzeczna ze źródłem → pokaż konflikt. Niedostępny brain nie oznacza prawa do wymyślenia zapamiętanej wiedzy.

**Przykład:** przy zmianie walidacji agent odnajduje flow obejmujące frontend i dwa API, wskazuje znaną regułę oraz informację, że ostatni krok przepływu nie został jeszcze zweryfikowany.

## brain-capture — zapis i aktualizacja wiedzy

**Cel:** przekształcić wartościowe odkrycie w trwałą, odnajdywalną informację, bez mnożenia duplikatów i bez przedstawiania domysłów jako faktów.

**Uruchomienie:** nowe potwierdzone zachowanie, korekta użytkownika, decyzja, przyczyna błędu, zależność między systemami, rozjazd ze starą notatką, jawne „zapisz to”, koniec kroku zapisującego. Nie jest uruchamiany przez hook po read-only status/test/review.

**Wejście:** konkretne twierdzenie, źródła, wskazanie systemów, zakres wersji, powód przydatności, ewentualne ID aktualizowanej notatki i obserwacji. Cała historia czatu nie jest wymaganym wejściem.

**Czyta:** pasujące wpisy, źródła twierdzenia, politykę zapisu i szablon notatki. **Zapisuje:** notatkę w brain lub kandydata/konflikt w inbox oraz własny dziennik transakcji. Nie zmienia current-feature, specyfikacji ani polityk agentów.

**Przebieg:**

1. Sprawdź, czy zapis jest dozwolony w tej akcji i profilu. Read-only kończy się propozycją w odpowiedzi bez mutacji.
2. Oceń wartość: czy informacja pomaga przy przyszłym pytaniu, wyjaśnia przyczynę lub zależność, albo zachowuje decyzję? Chwilowy log testu zwykle nie spełnia warunku.
3. Usuń zbędne dane i sekrety. Wpis powinien być minimalny i samodzielnie zrozumiały.
4. Sprawdź duplikaty po temacie, encjach, typie i treści. Podobny tytuł nie dowodzi identycznego twierdzenia.
5. Oceń dowód. Wniosek bez dowodu trafia do candidate; nowy pomysł do ideas; konflikt zachowuje obie wersje.
6. Ustal zakres. Niezacommitowana implementacja wymaga checkoutu, commita bazowego i hasha źródła/patcha. Nowa decyzja o przyszłości pozostaje planned.
7. Przygotuj utworzenie lub aktualizację z oczekiwanym hashem poprzedniej wersji. Dla chronionej ręcznej notatki przygotuj propozycję aktualizacji.
8. Runtime waliduje strukturę i zapisuje transakcję. Nadpisana w międzyczasie notatka oznacza konflikt wersji.
9. Zaktualizuj indeksy w sposób odtwarzalny, rozpatrz obserwację i pokaż krótki wynik.

**Potwierdzenie:** samo dokumentowanie sprawdzonego faktu albo już podjętej decyzji nie wymaga kolejnego pytania. Podejmowanie nowej decyzji za użytkownika jest inną czynnością. Automatyczny zapis nie upoważnia do wykonania opisanego runbooka.

**Błędy i brzegi:** brak dostępu do brain → trwała lokalna kolejka i status queued; brak dowodu → candidate; błąd walidacji → poprawienie wpisu albo failed; zmiana hasha → ponowny odczyt i propozycja połączenia; ponowienie operation-id → zwrot istniejącego wyniku bez duplikatu. Nie potwierdzamy zapisu przed jego utrwaleniem.

**Przykład:** użytkownik wyjaśnia regułę dotyczącą statusu umowy. Agent aktualizuje istniejący opis tej reguły, wskazuje ustalenie jako źródło i zachowuje wcześniejszą wersję w historii.

## brain-ingest — poznawanie nowego źródła

**Cel:** utworzyć pierwszy użyteczny zestaw wiedzy o wskazanym repozytorium, systemie lub materiale, oparty na faktycznie przeczytanych źródłach.

**Uruchomienie:** dodanie projektu, prośba o poznanie API, import wskazanej dokumentacji lub schematu. Nie jest automatycznym skanowaniem całego komputera.

**Wejście:** konkretne źródło, ID systemu albo propozycja jego rejestracji, cel analizy i głębokość: kontrakt zewnętrzny lub pełna analiza dostępnego kodu. Rejestrację projektu i jego konfiguracji wykonuje osobna operacja runtime, z jawnymi danymi użytkownika; ingest jej nie zgaduje.

**Czyta:** zlecone pliki, struktury, kontrakty i istniejącą wiedzę dotyczącą tematu. **Zapisuje:** snapshot źródła, jeśli potrzebny, wpisy przez wspólny mechanizm capture oraz podsumowanie pokrycia analizy.

**Przebieg:**

1. Sprawdź zakres i dostęp. Wyklucz sekrety, build output, vendor i materiały niezwiązane z celem.
2. Rozpoznaj technologię z plików projektu; reguły analizy stacku należą do rozszerzalnych references.
3. Zmapuj wejścia, główną logikę, dostęp do danych i wywołania innych systemów w zakresie pytania.
4. Zbieraj referencje do konkretnych plików, symboli, rewizji lub snapshotów. Nie buduj obrazu całej architektury na podstawie samej nazwy serwisu.
5. Porównaj z istniejącą wiedzą i kieruj wpisy przez capture, korzystając z tych samych reguł duplikatów i statusów.
6. Flow przez kilka systemów uznaj za potwierdzony tylko w zakresie kroków, które mają dowody. Nieprzeczytany system to luka, nie domyślne przejście.
7. Pokaż, co przeanalizowano, czego nie sprawdzono i jakie wpisy utworzono.

**Błędy i brzegi:** brak dostępu do dalszego API → opis kontraktu i luka; za duży zakres → podział na porcje z checkpointem, bez deklaracji kompletności; nowa wersja źródła → nowy snapshot, bez nadpisania dowodów starych notatek. Adres źródła nie jest dowodem, że zostało przeczytane.

**Przykład:** ingest API zapisuje istotne operacje i zależności z kodu, a semantykę statusów bez wyjaśnienia w dokumentacji pozostawia jako pytanie do uzupełnienia.

## brain-maintain — utrzymanie jakości

**Cel:** utrzymać możliwość odnajdywania i oceniania wiedzy, gdy kod, źródła oraz decyzje się zmieniają.

**Uruchomienie:** prośba o przegląd, wykryta zmiana źródła, przygotowanie do większego zadania, ewentualna przyszła zaplanowana kontrola. Harmonogram nie jest uruchamiany przez samo istnienie tego projektu.

**Wejście:** zakres systemu/domeny albo całego braina i tryb report lub apply. Brak wyboru oznacza raport. **Czyta:** wpisy, metadane, źródła, indeksy. **Zapisuje w apply:** poprawki przez runtime; w report zwraca raport w rozmowie, chyba że jawnie zamówiono jego plik.

**Przebieg:**

1. Sprawdź schematy, identyfikatory, linki i wymagane pola.
2. Znajdź wpisy ze zmienionymi lub niedostępnymi źródłami. Zmiana źródła oznacza needs-review, nie automatycznie fałsz.
3. Znajdź prawdopodobne duplikaty, konflikty zakresu i długo nierozpatrzone kandydatury.
4. Oceń treść z odpowiednimi dowodami. Poprawność YAML nie jest dowodem poprawności reguły biznesowej.
5. Zaproponuj zestaw zmian: naprawa linku, ponowna weryfikacja, aktualizacja, połączenie albo superseded.
6. W apply wykonaj zatwierdzony zakres zgodnie z polityką. Przy zwykłych wpisach zarządzanych przez agenta można stosować wcześniej przyjętą automatyczną politykę; chronione notatki dostają propozycje.
7. Odtwórz indeksy i raportuj faktycznie zastosowane zmiany oraz nierozstrzygnięte pozycje.

**Błędy i brzegi:** brak źródła nie uzasadnia usunięcia wiedzy; decyzja zastąpiona nowszą zachowuje historię; kandydat nie staje się confirmed dlatego, że leży w inbox od dawna. Masowe usuwanie nie jest domyślnym sposobem porządkowania.

**Przykład:** po zmianie DTO maintain wskazuje dwie powiązane notatki do sprawdzenia. Nie oznacza całego opisu systemu jako nieaktualnego.

## brain-checkpoint — ciągłość pracy

**Cel:** umożliwić kontynuację po zamknięciu sesji, kompakcji kontekstu lub zmianie klienta.

**Uruchomienie:** koniec naturalnego kroku zapisującego, prośba o przerwę, przekazanie pracy drugiemu klientowi, wspierane zdarzenie klienta przed utratą kontekstu. Nie jest ukrytym zapisem po read-only akcji feature.

**Wejście:** ID sesji, cel, task/plan ID, bieżący etap, przyjęte ustalenia potrzebne do dalszej pracy, otwarte pytania, odnośniki i ID oczekujących obserwacji.

**Zapisuje:** `.state/sessions/<session-id>/checkpoint.json` oraz opcjonalny czytelny widok Markdown generowany z tego samego stanu. JSON jest stanem autorytatywnym; widok nie ma drugiej niezależnej historii.

**Przebieg zapisu:** sprawdź sesję i właściciela; odczytaj aktualny stan feature; ułóż krótki checkpoint; zapisz atomowo z numerem rewizji; wskaż poprzednią wersję umożliwiającą odzyskanie. Nie zapisuj sekretów ani pełnej rozmowy.

**Przebieg wznowienia:** rozpoznaj konkretną sesję/zadanie; sprawdź aktualny Git i current-feature; porównaj z checkpointem; odczytaj brakujący kontekst brain; przedstaw najbliższy krok. Wznowienie planu zachowuje jawne `feature plan resume <name>` — wykrycie pliku nie wybiera planu za użytkownika.

**Błędy i brzegi:** zmiana checkoutu → weryfikacja zakresu; kilku kandydatów → wybór; aktywny właściciel w innym kliencie → brak cichego przejęcia; brak checkpointu → odtworzenie minimum ze specyfikacji i stanu, z ujawnieniem braków. Bez zapisanego odkrycia nie można zagwarantować odzyskania go po nagłej awarii.

**Przykład:** Kiro przejmuje zadanie rozpoczęte w Claude, zna ostatni ukończony Goal i otwarte pytanie, ale ponownie odczytuje Git oraz aktualny diff zamiast ufać opisowi sprzed kilku godzin.

## session-handoff — zachowane zachowanie

Skill pozostaje zgodny z oryginałem: produkuje zwięzły blok do skopiowania w rozmowie. Nie zapisuje pliku i nie uruchamia sam `/clear`.

Sekcje: Decisions locked, What shipped, Key files, Open questions, Pick up here. Puste sekcje pomija. Wskazuje rzeczywiste pliki, commity i PR-y; nie wymyśla wykonanych działań.

Checkpoint i handoff można zamówić razem, ale są to dwie jawne czynności. Samo wywołanie starego session-handoff nie zaczyna zapisywać stanu do pliku.
