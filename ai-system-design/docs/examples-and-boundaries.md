# Przykłady danych i granice produktu

Przykłady w tym rozdziale są projektem formatów, nie gotowymi plikami konfiguracyjnymi klienta. Nazwy projektów, identyfikatory i zachowania są ilustracyjne. Schematy wykonawcze powstaną podczas implementacji.

## Co oznacza „wiedza zawsze dostępna”

Nowa sesja otrzymuje krótki router z informacją, gdzie jest brain i jak go przeszukać. Przy zadaniu odczytuje istotne notatki oraz właściwe źródła. Nie ładuje całego vaulta do każdego promptu. Trwałość pliku, możliwość jego znalezienia i aktualność zawartego faktu to trzy osobne wymagania.

Automatyczne zauważanie wiedzy działa w aktywnej pracy z agentem: podczas czytania kodu, rozmowy, planowania i implementacji. Agent nie widzi sam wszystkich działań w innych aplikacjach ani pracy wykonanej, gdy był wyłączony. Po powrocie może porównać stan repo i wskazane źródła, a większą zmianę poznać przez ingest. Obserwator całego komputera nie jest elementem tego produktu.

Prompt i skill kierują zachowaniem modelu; runtime zabezpiecza rzeczywiście zlecony zapis. Hook może uruchomić przegląd pamięci lub odłożyć już zebrane obserwacje, lecz sam nie gwarantuje semantycznego wykrycia każdego ważnego faktu. Warunkiem odbioru jest obserwowalne działanie capture w scenariuszach pracy, a nie samo istnienie reguły w instrukcji.

Brain jest globalny **w obrębie jednej instalacji**. Komputer prywatny i firmowy mogą mieć własne instalacje oraz osobne brain/context. Ten projekt nie włącza synchronizacji firmowej wiedzy na prywatne konto. Przenośna paczka procedur pozwala uruchamiać ten sam produkt z innymi lokalnymi danymi.

## Jednoznaczne ścieżki i rejestr

Każdy cel feature ma stabilne ID, ścieżkę repo kodu oraz ścieżkę kontekstu względem repo context. Dla zgodności alias ai-os wskazuje kod nowego systemu. Przykład koncepcji rejestru:

```yaml
schema_version: 1
workspace_id: work-main
repositories:
  system: {path: system, git_mode: local-only, remote: null}
  context: {path: context, git_mode: local-only, remote: null}
  brain: {path: brain, git_mode: local-only, remote: null}
workflow_targets:
  ai-os:
    code_path: system
    code_git_mode: local-only
    context_path: ai-os
    knowledge_systems: [ai-system]
  customer-ui:
    code_path: projects/customer-ui
    code_git_mode: remote
    remote_name: origin
    context_path: projects/customer-ui
    knowledge_systems: [customer-ui, shared-auth]
  customer-api:
    code_path: projects/customer-api
    code_git_mode: remote
    remote_name: origin
    context_path: projects/customer-api
    knowledge_systems: [customer-api, customer-db]
```

Zatem specyfikacje customer-ui znajdują się pod `context/projects/customer-ui/features/`, a specyfikacje samego produktu pod `context/ai-os/features/`. W aktywnym zadaniu ten sam układ względny istnieje w worktree repo context. Resolver wybiera kanoniczny egzemplarz danej rewizji. Zapisy `context/<system>/…` w oryginalnym źródle wymagają tej jawnej adaptacji; nie są drugim docelowym układem.

Rejestr identyfikuje repozytorium niezależnie od ścieżki checkoutu i jawnie opisuje tryb Git. System/context/brain mają local-only i remote: null; projekty remote oraz nazwany origin. Brak pola nie upoważnia do zgadywania trybu ani zakładania remote. Wartość code_path pomaga znaleźć katalog; sama nazwa folderu nie wystarcza do potwierdzenia tożsamości repo. Lokalne nadpisanie ścieżki nie zmienia trwałego ID projektu.

## Przykład kompletnej notatki

To fikcyjne ustalenie użytkownika o planowanej regule. `confirmed` opisuje pewność, że decyzja została podjęta; `scope.kind: planned` wyraźnie mówi, że nie potwierdzono wdrożenia.

```yaml
---
schema_version: 1
id: decision-product-disable-reason
type: decision
subject: wymagany powód wyłączenia usługi
systems: [customer-ui, customer-api]
domains: [products]
status: confirmed
freshness: checked
scope:
  kind: planned
  work_item_id: example-work-item
evidence:
  - kind: user-decision
    reference: session:example-session#decision-3
    excerpt: "Przy wyłączeniu usługi wymagamy podania powodu."
    supports: decyzja o docelowym zachowaniu
verified_at: 2026-09-17
updated_at: 2026-09-17
managed_by: agent
protected: false
related: [flow-product-service-change]
supersedes: []
---
```

Treść pod tym frontmatterem:

> **Ustalenie:** przy wyłączeniu usługi użytkownik ma podać powód.
>
> **Dlaczego:** powód ma umożliwiać wyjaśnienie zmiany w późniejszej obsłudze.
>
> **Zakres:** decyzja do implementacji; nie zweryfikowano obecnego zachowania API.
>
> **Źródło:** jawne ustalenie użytkownika zapisane powyżej. Referencja sesji identyfikuje pochodzenie, a krótki zapis decyzji pozwala zrozumieć dowód bez pełnej historii czatu.
>
> **Do sprawdzenia:** miejsce walidacji i sposób przechowywania powodu.

Dowód z kodu zamiast decyzji użytkownika powinien identyfikować repo, commit, ścieżkę i symbol oraz zakres potwierdzonego twierdzenia. Dla niezatwierdzonych zmian dochodzi hash właściwego źródła/diffa. Wspomnienie środowiska produkcyjnego wymaga osobnego dowodu dotyczącego tego środowiska.

## Przykład obserwacji i wyniku capture

Obserwacja jest krótkim wejściem do oceny, nie gotową prawdą. Przykładowy logiczny format:

```yaml
operation_id: example-capture-1
session_id: example-session
work_item_id: example-work-item
claim: wyłączenie usługi wymaga podania powodu
claim_kind: user-decision
systems: [customer-ui, customer-api]
scope_kind: planned
evidence_refs: ["session:example-session#decision-3"]
reason_to_keep: wpływa na walidację w UI oraz API
```

Po udanym zapisie capture zwraca ID notatki, ścieżkę, wynik created/updated i status trwałości zapisu. W zwykłej rozmowie wystarczy: „Zapisałem tę decyzję i połączyłem ją z przepływem wyłączenia usługi. Jest oznaczona jako planowana”. Jeśli odnaleziono identyczny wpis, odpowiedź wskazuje istniejącą notatkę. Jeśli zapis trafił tylko do kolejki, agent mówi o kolejce.

## Minimalny pakiet kontekstu nowej sesji

| Element | Kiedy czytany | Dlaczego |
|---|---|---|
| Router i zasady wspólne | Start | Znalezienie systemu i właściwego trybu pracy |
| Rejestr i standardy repo | Rozpoznanie projektu | Właściwe ścieżki i reguły |
| current-feature / wybrany preview | Praca nad zadaniem | Stan autorytatywny workflow |
| Checkpoint | Wznowienie | Ostatni krok i pytania |
| Trafne notatki i flow | Przed decyzją lub zmianą | Wiedza potrzebna do zadania |
| Właściwe źródła kodu | Weryfikacja twierdzeń | Aktualny stan zamiast ślepego zaufania pamięci |

Nie stosujemy stałej zasady „zawsze jeden sąsiad”. Liczba odczytanych zależności wynika z pytania. Mały budżet początkowy można rozszerzyć, jeśli inaczej analiza byłaby niepełna.

## Powiązanie z załączonym planem second brain

| Element wcześniejszego planu | Decyzja w nowym projekcie |
|---|---|
| Obsidian i Markdown | Zachowane; Obsidian jest opcjonalnym interfejsem |
| Jedno repo skilli i symlinki | Wspólny system z adapterami; dowiązania albo zarządzane kopie zależnie od klienta i OS |
| raw/ | Odpowiada brain/sources/; źródła z oznaczeniem pochodzenia i rewizji |
| db/ | Odpowiada brain/data/; wiedza o bazach, strukturach i znaczeniu danych |
| calls oraz called_by | Jedna relacja źródłowa; kierunek odwrotny generowany |
| Każdy fakt najpierw draft | Potwierdzone fakty zapisujemy bezpośrednio; niepewność do inbox |
| Ręczne „zapisać?” po każdym zadaniu | Automatyczny zapis w przyjętym zakresie i krótki komunikat |
| brain-context/capture/ingest/maintain | Zachowane, z dokładniejszymi kontraktami |
| brain-ops | Możliwe późniejsze rozszerzenie; nie jest częścią pierwszego projektowanego rdzenia pamięci |
| Hook na koniec sesji | Uzupełnienie zapisu w trakcie pracy, nie jedyny mechanizm |
| Brak stanu zadania w vaulcie | Zachowane; checkpoint i current-feature są w .state |
| Cotygodniowy przegląd | Możliwa przyszła konfiguracja; nie uruchomiono automatyzacji |

`brain-ops` byłby wykonawcą operacji na systemach, a nie kolejnym sposobem zapisu pamięci. Musiałby korzystać z właściwych uprawnień, jawnie określonego celu oraz aktualnego stanu. Sam fakt istnienia runbooka nie uruchamia jego kroków. Możliwość opisania procedury pozostaje dostępna od początku przez capture/ingest.

## Z czego składa się paczka do zabrania do pracy

Dokument HTML zawiera całą nową specyfikację, osadzone diagramy oraz pełne źródła operacyjne feature i ról. Markdown zachowuje edytowalną treść i źródła diagramów Mermaid. ZIP dodatkowo zawiera wszystkie 77 plików wybranego snapshotu ai-os, diagramy SVG/Mermaid i oryginalny załączony plan.

Źródła referencyjne pozostają w swoim układzie, dzięki czemu można czytać ich wzajemne odnośniki. Ich treść nie została przetłumaczona ani zmieniona. Nowa dokumentacja jest po polsku; dawna reguła angielskich dokumentów pozostaje właściwością starego systemu do świadomego rozstrzygnięcia w nowym.

Do czytania paczki nie potrzeba GitHuba ani internetu. Uruchamianie Claude/Kiro może nadal wymagać połączenia z usługą danego klienta. Nowego runtime, instalatora ani adapterów jeszcze nie ma — powstaną dopiero po akceptacji projektu i przygotowaniu kroków budowy.
