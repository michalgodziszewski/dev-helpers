# Lokalny Git i zdalne repozytoria tylko dla projektów

Ustalenie użytkownika z 18 września 2026: zdalne repozytoria mają wyłącznie projekty. System, context i brain zachowują lokalny Git, ale nie mają żadnego remote. Ten rozdział określa adaptację wcześniejszego workflow i ma pierwszeństwo przed założeniami o origin w niezmienionych źródłach starego skilla.

## Granice repozytoriów

| Katalog | Git | Remote | Operacje |
|---|---|---|---|
| ai-system/ | Brak | Brak | Rozpoznanie workspace i generowane wejścia klientów |
| system/ | Lokalny | Brak | Gałęzie, commity, lokalne scalenia |
| context/ | Lokalny | Brak | Specyfikacje, gałęzie i worktree kontekstu, lokalne scalenia |
| brain/ | Lokalny | Brak | Historia własnych zapisów pamięci |
| projects/<name>/ | Osobny dla projektu | Zdalny origin projektu | Gałęzie, commity, fetch, push i scalenia zgodnie z workflow projektu |

Nie tworzymy lokalnego bare origin dla system/context/brain. To był inny wariant starego ai-os. Lokalny Git działa bez remote; brak origin jest tutaj stanem prawidłowym, a nie awarią do naprawienia przez dodanie serwera.

Wymaganie repozytorium dla feature pozostaje. Cel `--system ai-os` wskazuje repo system/, a nie folder nadrzędny. Specyfikacje tego celu należą do context/ai-os/. Pliki klienta generowane w folderze nadrzędnym pochodzą ze źródeł i szablonów wersjonowanych w system/.

## Rozpoznawanie trybu Git

Rejestr rozpoznaje każde repo osobno i przypisuje mu `local-only` albo `remote`. Nie wystarcza obecność lub brak origin: porównujemy rzeczywisty stan z jawną konfiguracją. Projekt skonfigurowany jako remote nie staje się lokalny dlatego, że ktoś usunął jego origin lub utracił połączenie.

Po load zapisujemy rozpoznane repozytoria, tryby i bazy jako część stanu zadania. Następne akcje sprawdzają ich zgodność z rejestrem. Zmiana trybu lub celu wymaga jawnego rozstrzygnięcia przed kolejnymi mutacjami.

## Kontrakt poszczególnych akcji

| Akcja | System i context: local-only | Kod projektu: remote |
|---|---|---|
| plan / plan done | Dotychczasowe preview, pytania i finalizacja; jawne bazy bez zakładania main | Ten sam kontrakt planowania |
| load | Wymaga poprawnego lokalnego repo i konfiguracji; nie wymaga origin | Wymaga poprawnego repo i skonfigurowanego zdalnego origin |
| start | Sprawdza stan i lokalną bazę; tworzy gałąź/worktree; bez fetch/pull | Sprawdza stan, pobiera origin, weryfikuje bazę i stosuje dotychczasowe ff-only przed utworzeniem gałęzi |
| test / review / status | Bez zmiany statusów i bez ukrytego zapisu do pamięci | Ten sam kontrakt |
| publish | Po zatwierdzeniu pakietu tworzy lokalne commity; bez push | Po zatwierdzeniu pakietu tworzy commity i wysyła gałąź pracy na origin |
| clear | Przenosi kompletny wpis do Pending Reviews bez sprawdzania merge | Ten sam kontrakt |
| complete | Sprawdza wymagane SHA w lokalnych gałęziach bazowych | Pobiera aktualny stan origin i sprawdza wymagane SHA w zdalnej bazie kodu; kontekst sprawdza lokalnie |
| abandon | Zachowuje reguły porzucania i osobnego potwierdzania usunięć | Ten sam kontrakt; nie usuwa gałęzi remote |
| backport | Jeśli włączony i spełnia warunki, używa lokalnego release i nie robi push | Używa istniejącego release na origin i publikuje gałąź backportu |

Bazy kodu i kontekstu są ustalane osobno. Przy nowym planie brak wartości oznacza pytanie; istniejąca odpowiedź nie jest ponownie wymagana. Start sprawdza, czy wskazana baza istnieje i czy można z niej rozpocząć pracę. Nadrzędny katalog nigdy nie staje się awaryjnym celem operacji Git.

## Dwa warianty publish

| Cel feature | Repo kodu | Repo kontekstu | Warunek Published |
|---|---|---|---|
| Rozwój ai-system | Lokalne commity w system/ | Lokalne commity w context/ | Oba zestawy commitów zapisane |
| Zmiana projektu | Commit i push gałęzi projects/<name>/ | Lokalne commity w context/ | Push kodu oraz commit kontekstu zakończone |

Przed wykonaniem nadal pokazujemy dokładne wiadomości, listy plików, kolejność commitów oraz gałęzie. Dla local-only pakiet wyraźnie wskazuje brak push; dla projektu wskazuje konkretny cel push. Zatwierdzanie pozostaje zgodne z kontraktem feature. Publish nie scala gałęzi i nie wypycha context/system/brain na zdalny serwer.

Zachowujemy nazwę statusu **Published**, ale jawnie rozszerzamy jej znaczenie: pakiet został przygotowany do osobnego scalenia zgodnie z trybem każdego repo. Status sam w sobie nie jest dowodem wysłania wszystkich plików do sieci. Interfejs pokazuje wynik per repo, np. „Kod: push zakończony; kontekst: lokalne commity gotowe do scalenia”.

Pola Published Commits i Context Published Commits zawierają uporządkowane SHA także dla local-only. Dziennik runtime rozróżnia commit ukończony, push niewymagany, push ukończony i błąd. Jeśli działań nie udało się zakończyć w obu repo, stan pozostaje częściowy; nie nadajemy pozornego Published. Ponowienie rozpoznaje istniejące własne commity i nie dubluje ich. Nowe wywołanie publish nadal przedstawia aktualny pakiet do zatwierdzenia.

## Scalenie i complete

Scalenie jest oddzielną czynnością kontrolowaną przez użytkownika. Dla projektu odbywa się zgodnie z jego workflow, zwykle przez PR na serwerze. Dla system/context jest lokalnym merge do zadeklarowanej bazy. Użytkownik może osobno zlecić agentowi wykonanie tego lokalnego merge; ani publish, ani complete nie wykonują go automatycznie.

Complete sprawdza ancestry **każdego** zarejestrowanego SHA:

- Kod systemu: lokalna gałąź Base Branch w repo system.
- Kod projektu: świeżo pobrana gałąź origin/Base Branch w repo projektu.
- Kontekst obu rodzajów zadań: lokalna Context Base Branch w repo context.
- Backport, jeśli zarejestrowany: właściwy release lokalny albo origin/release zgodnie z trybem repo kodu.

Brak dostępu do origin projektu uniemożliwia potwierdzenie aktualnego zdalnego merge. Agent nie zastępuje tego sprawdzenia lokalną gałęzią ani starym opisem checkpointu. Brak lokalnego scalenia kontekstu również blokuje complete, nawet gdy PR projektu został scalony. Obsługa squash/rebase nie jest dodana przez tę zmianę; dotychczasowy kontrakt SHA pozostaje.

Przy backporcie pozostają wymagania typu poprawki, trunk i opt-in, zapis metadanych przed cherry-pick, uporządkowane cherry-pick -x oraz zatrzymanie na konflikcie. Adaptujemy wybór release i ewentualny push. Dotychczasowe pojedyncze pola backportu nadal przechowują ostatni zestaw metadanych.

## Pierwszy etap budowy

Oryginalny skill z ZIP nie jest gotową implementacją tego kontraktu. Etap przygotowawczy musi:

1. Utworzyć strukturę i lokalne repo system/context/brain, początkowe commity oraz jawnie wybrane bazy, bez remote i bare origin.
2. Zarejestrować rozwój samego systemu jako cel wskazujący repo system; projekty podłączać do ich istniejących repo i origin.
3. Dostosować wspólne rozpoznawanie repo oraz wszystkie zależne akcje i role, szczególnie load/start/publish/complete/backport. Zmiana samego SKILL.md nie wystarcza.
4. Zapewnić krótki routing i dostęp do źródeł dla Claude/Kiro oraz lokalny stan wykonania.
5. Sprawdzić cykl na małej zmianie w samym systemie oraz rozdzielenie operacji kod/kontekst dla projektu.

Ten etap wykonuje agent zwykłymi narzędziami na podstawie zaakceptowanej specyfikacji. Dalszy rozwój przechodzi na nowy feature dopiero po sprawdzeniu, że sam system można nim rozwijać bez origin.

## Historia i kopia zapasowa

Brain zachowuje lokalną historię własnych zapisów; nie ma kolejki push ani zdalnej synchronizacji Git. Kopia zapasowa to osobny mechanizm. Powinna obejmować lokalne repo wraz z ich historią Git, niezatwierdzone pliki oraz nieodtwarzalny stan .state. Sam remote projektu nie zabezpiecza kontekstu, wiedzy ani narzędzi tego workspace.

Nie zmieniono żadnego repozytorium użytkownika ani nie zainstalowano skilla. Wersja 4 dokumentacji opisuje wymaganą adaptację. Oryginalne źródła w reference-ai-os/ oraz feature-skill/ pozostają niezmienionym punktem odniesienia.
