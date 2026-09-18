# Oryginalne źródła skilla feature

Zacznij od **SKILL.md**. To pełny oryginalny plik definicji skilla z ai-os.

| Ścieżka w tym folderze | Zawartość |
|---|---|
| SKILL.md | Definicja skilla, interfejs i kierowanie do właściwej akcji |
| actions/_common.md | Wspólne reguły systemów, repozytoriów i gałęzi |
| actions/plan.md | Plan, resume, status planu, cancel i done |
| actions/load.md | Wczytanie specyfikacji |
| actions/start.md | Przygotowanie gałęzi i rozpoczęcie implementacji |
| actions/test.md | Testy |
| actions/review.md | Review |
| actions/publish.md | Zatwierdzenie pakietu, commity i push |
| actions/clear.md | Przeniesienie do Pending Reviews |
| actions/complete.md | Weryfikacja merge i zakończenie |
| actions/abandon.md | Porzucenie zadania i zasady sprzątania |
| actions/backport.md | Backport poprawki na release |
| actions/status.md | Status workflow |
| agents/ | Cztery role: planner, implementer, tester, reviewer |
| GUIDELINES.md | Oryginalne wspólne zasady ai-os |
| source-map.json | Mapowanie na oryginalne ścieżki i sumy kontrolne |

## Pochodzenie

Repozytorium: michalgodziszewski/ai-os.
Commit: 1e2cb5a9de87f58ec15ccb412d545347a30075b2.

Wszystkie 18 plików źródłowych skopiowano bez zmiany treści. Ich oryginalne położenie to .claude/skills/feature/, .claude/agents/ oraz .claude/GUIDELINES.md. Widoczne foldery ułatwiają przeglądanie materiału bez włączania wyświetlania ukrytych katalogów.

W pełnej paczce ai-system-offline te same źródła są również zachowane pod reference-ai-os/.claude/ w oryginalnym układzie. Są to dwie kopie tego samego snapshotu, a nie konkurencyjne wersje skilla.

## Jak użyć przy budowie nowego systemu

Udostępnij agentowi ten folder jako źródło odniesienia dla zachowania feature. Definicja SKILL.md odsyła do plików actions/; należy czytać też właściwą akcję i kontrakt danej roli.

To eksport istniejącego skilla, nie nowa implementacja dopasowana do ai-system i nie instalator. Oryginalne ścieżki w treści wskazują stary układ ai-os oraz konfigurację Claude. Ich adaptację do osobnych repo system/context/brain i do Kiro opisuje dokumentacja architektury. Nadrzędny skill change omawiany później w rozmowie nie został tutaj zaimplementowany.
