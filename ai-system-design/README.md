# ai-system — paczka dokumentacji do akceptacji

Najpierw otwórz **ai-system-documentation.html** w przeglądarce. Ten pojedynczy plik zawiera pełny projekt, 10 diagramów oraz rozwijane oryginalne źródła operacyjne. Do czytania nie potrzebuje internetu, GitHuba ani renderera Mermaid.

## Aktualizacja wersji 4 — 18 września 2026

Zdalne repozytoria mają wyłącznie projekty. System/context/brain zachowują lokalny Git bez remote i bez bare origin. Dokładny kontrakt feature jest w docs/local-git-contract.md oraz części VI pełnej dokumentacji.

Omawiane później propozycje skilla change, indeksu zadań i katalogu helperów SQL pozostają dodatkowymi wymaganiami z rozmowy/promptu startowego; ta rewizja dotyczy zasad Git.

## Gdzie jest definicja skilla feature?

Otwórz **feature-skill/SKILL.md**. W feature-skill/actions/ są wszystkie procedury, a w feature-skill/agents/ cztery role. To niezmienione kopie źródłowe, które wymagają opisanej adaptacji. Oryginalny układ jest również pod reference-ai-os/.claude/.

## Zawartość

| Plik lub katalog | Przeznaczenie |
|---|---|
| ai-system-documentation.html | Wygodne czytanie pełnej dokumentacji bez połączenia |
| ai-system-architecture.md | Pełny edytowalny dokument; ten sam projekt i źródła operacyjne |
| docs/ | Architektura, skille, kontrakty, przykłady i nowy kontrakt lokalnego Git |
| diagrams/ | 10 gotowych diagramów SVG oraz źródła Mermaid .mmd |
| feature-skill/ | Widoczna kopia definicji feature, akcji, ról i zasad |
| reference-ai-os/ | 77 niezmienionych plików ze starego repo |
| reference-materials/ | Oryginalny plan second brain dostarczony jako załącznik |
| source-manifest.json | Pochodzenie i sumy kontrolne oryginalnych źródeł repo |
| package-manifest.json | Sumy kontrolne plików paczki, z wyjątkiem samego manifestu |

## Co jest gotowe

Gotowa jest dokumentacja, diagramy i eksport źródeł odniesienia. Nowy runtime, adaptery i skille brain nie są zaimplementowane ani zainstalowane. Oryginalne skille z reference-ai-os nie zostały automatycznie dostosowane do nowej architektury.

To projekt do akceptacji. Harmonogram, backlog i kroki budowy powstaną dopiero po jego zatwierdzeniu.

## Pochodzenie źródeł

Repo: michalgodziszewski/ai-os, branch main, commit 1e2cb5a9de87f58ec15ccb412d545347a30075b2.
Eksport obejmuje .claude/, context/, wiki/ oraz README.md, CLAUDE.md i pliki .gitignore root/projects. Nie obejmuje kodu aplikacji przykładowych, historii Git ani PR/issue. Wszystkie 77 plików zweryfikowano względem Git blob SHA.

Można korzystać z opisów i źródeł bez dostępu do prywatnego repo. Samo uruchamianie klientów Claude/Kiro może wymagać dostępu do ich usług. Nie jest to pakiet lokalnego modelu AI.
