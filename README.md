# Dev Helpers Skill — dokumentacja użycia

**Dev Helpers Skill** to pomocnik dla Claude Code/Codex, który wspiera codzienną pracę w repozytorium Git. Zamiast pamiętać zestaw komend i ręcznie analizować wynik `git status`, możesz poprosić agenta o wykonanie konkretnego zadania developerskiego: sprawdzenie kontekstu pracy, przygotowanie podsumowania zmian, znalezienie `TODO`/`FIXME` albo zebranie informacji potrzebnych do opisu PR.

Dokumentacja opisuje **jak używać skilla jako narzędzia w rozmowie z agentem**, a nie jak uruchamiać wewnętrzne skrypty bezpośrednio.

## Co robi skill?

Skill dostarcza gotowe zachowania dla typowych sytuacji w repozytorium:

- rozpoznaje aktualny kontekst Git: gałąź, upstream, commit `HEAD`, stan working tree;
- pomaga ocenić, czy lokalna gałąź jest przed lub za zdalną gałęzią;
- generuje zwięzłe podsumowanie ostatnich commitów;
- wyszukuje znaczniki `TODO` i `FIXME` w repozytorium;
- podpowiada, jakie informacje warto zebrać przed commitem, pushem albo pull requestem;
- prezentuje wyniki w czytelnej formie, gotowej do dalszej pracy lub wklejenia do opisu zadania.

## Kiedy używać?

Użyj Dev Helpers Skill, gdy chcesz szybko odpowiedzieć na pytania:

- „Na jakiej gałęzi jestem i czy mam lokalne zmiany?”
- „Czy mogę bezpiecznie zrobić push?”
- „Co zmieniło się w ostatnich commitach?”
- „Czy w kodzie zostały `TODO` albo `FIXME`?”
- „Jakie informacje powinienem zebrać przed PR-em?”
- „Czy moja gałąź jest zsynchronizowana z upstreamem?”

## Jak wywołać skill?

Najwygodniej używać go przez naturalny język w rozmowie z agentem. Napisz, co chcesz sprawdzić, a agent dobierze odpowiednią akcję.

Przykłady krótkich poleceń:

```text
Sprawdź stan repozytorium.
```

```text
Podsumuj aktualną gałąź i powiedz, czy mogę zrobić push.
```

```text
Przygotuj podsumowanie ostatnich commitów do PR.
```

```text
Znajdź TODO i FIXME w repozytorium.
```

```text
Zrób pre-flight check przed pull requestem.
```

Jeżeli w Twojej instalacji skill jest udostępniony jako slash command, możesz używać analogicznych poleceń slash zgodnie z nazwami skonfigurowanymi w danym środowisku. Najważniejsza jest intencja zadania: status, gałąź, commit, historia, raport TODO/FIXME albo przygotowanie PR.

## Najważniejsze scenariusze użycia

### 1. Start pracy w repozytorium

**Cel:** szybko zrozumieć, w jakim stanie jest projekt przed rozpoczęciem zmian.

Użyj promptu:

```text
Sprawdź kontekst repozytorium przed rozpoczęciem pracy.
```

Skill powinien zebrać i podsumować:

- aktualną gałąź;
- commit `HEAD`;
- upstream, jeśli jest skonfigurowany;
- informację, czy gałąź jest przed/za upstreamem;
- stan working tree: czysty albo z lokalnymi zmianami.

Przykładowa odpowiedź:

```text
Jesteś na gałęzi feature/login-flow.
Upstream: origin/feature/login-flow.
Gałąź jest 2 commity przed upstreamem.
Working tree zawiera 3 zmienione pliki.
HEAD: a1b2c3d feat: add login validation.
```

**Kiedy to pomaga:** po checkout, po pullu, po powrocie do projektu następnego dnia albo przed rozpoczęciem nowego zadania.

### 2. Kontrola przed commitem

**Cel:** sprawdzić, czy repozytorium jest gotowe do utworzenia commita.

Użyj promptu:

```text
Sprawdź repozytorium przed commitem i wypisz potencjalne ryzyka.
```

Skill powinien zwrócić:

- listę zmienionych plików lub informację o liczbie zmian;
- informację, czy working tree jest czysty;
- znalezione `TODO`/`FIXME`, jeśli poprosisz o ich kontrolę;
- krótką rekomendację, co zrobić dalej.

Przykładowa odpowiedź:

```text
Repozytorium nie jest czyste: 4 zmienione pliki.
Znaleziono 1 TODO w src/AuthService.cs.
Rekomendacja: przejrzyj TODO przed commitem albo świadomie zostaw go jako część długu technicznego.
```

Dobry prompt rozszerzony:

```text
Przed commitem sprawdź status repozytorium, TODO/FIXME i podsumuj, co powinienem zweryfikować.
```

### 3. Kontrola przed pushem

**Cel:** upewnić się, że wypychasz właściwą gałąź i rozumiesz relację względem upstreamu.

Użyj promptu:

```text
Sprawdź, czy aktualna gałąź jest gotowa do push.
```

Skill powinien sprawdzić:

- nazwę lokalnej gałęzi;
- skonfigurowany upstream;
- liczbę commitów ahead/behind;
- czy working tree ma niezacommitowane zmiany.

Przykładowa odpowiedź:

```text
Gałąź fix/payment-timeout śledzi origin/fix/payment-timeout.
Lokalnie jesteś 1 commit przed upstreamem i 0 commitów za nim.
Working tree jest czysty.
Możesz wykonać push.
```

Jeżeli gałąź jest za upstreamem, skill powinien to jasno zaznaczyć:

```text
Uwaga: gałąź jest 3 commity za upstreamem. Przed pushem rozważ pull/rebase, żeby uniknąć konfliktów lub odrzucenia push.
```

### 4. Przygotowanie opisu pull requesta

**Cel:** zebrać informacje potrzebne do sensownego opisu PR.

Użyj promptu:

```text
Przygotuj dane do opisu PR na podstawie ostatnich commitów.
```

Skill powinien pomóc zebrać:

- aktualną gałąź;
- bazowy kontekst Git;
- listę ostatnich commitów;
- skrócone podsumowanie zmian;
- potencjalne punkty do sekcji „Testing”, jeśli były wykonywane testy lub kontrole.

Przykładowy wynik:

```markdown
## Summary
- Dodano walidację formularza logowania.
- Poprawiono obsługę wygasłej sesji.
- Zaktualizowano dokumentację modułu auth.

## Git context
- Branch: feature/login-flow
- HEAD: a1b2c3d feat: add login validation
- Recent commits: 3
```

Dobry prompt rozszerzony:

```text
Na podstawie ostatnich 10 commitów przygotuj szkic opisu PR z sekcjami Summary i Testing.
```

### 5. Przegląd długu technicznego

**Cel:** znaleźć miejsca oznaczone jako `TODO` albo `FIXME`.

Użyj promptu:

```text
Znajdź TODO i FIXME w repozytorium i pogrupuj wyniki.
```

Skill powinien zwrócić:

- plik i numer linii;
- typ znacznika (`TODO` albo `FIXME`);
- treść znalezionej linii;
- sumaryczną liczbę znalezionych markerów.

Przykładowa odpowiedź:

```text
Znaleziono 2 markery:
- src/AuthService.cs:42 [TODO] Add refresh token rotation
- tests/AuthServiceTests.cs:18 [FIXME] Stabilize flaky timeout test
```

Możesz poprosić również o interpretację:

```text
Znajdź TODO/FIXME i oceń, które mogą blokować merge.
```

### 6. Szybka diagnoza „co się zmieniło?”

**Cel:** zrozumieć ostatnie zmiany bez ręcznego czytania historii Git.

Użyj promptu:

```text
Podsumuj ostatnie commity i wskaż główne obszary zmian.
```

Skill powinien zebrać historię commitów i zamienić ją w krótkie, czytelne podsumowanie.

Przykładowa odpowiedź:

```text
Ostatnie zmiany dotyczą głównie modułu auth:
- dodano walidację logowania,
- poprawiono obsługę wygasłych sesji,
- zaktualizowano dokumentację.
```

## Rekomendowane prompty

### Minimalne

```text
Sprawdź status repozytorium.
```

```text
Pokaż aktualny HEAD.
```

```text
Podsumuj ostatnie commity.
```

```text
Znajdź TODO/FIXME.
```

### Bardziej precyzyjne

```text
Sprawdź aktualną gałąź, upstream, ahead/behind i working tree.
```

```text
Podsumuj ostatnie 10 commitów w formie punktów do opisu PR.
```

```text
Wykonaj checklistę przed commitem: status repozytorium, TODO/FIXME i potencjalne ryzyka.
```

```text
Wykonaj checklistę przed pushem i powiedz, czy gałąź wygląda bezpiecznie.
```

```text
Znajdź TODO/FIXME, pogrupuj po plikach i oznacz potencjalne blokery.
```

## Oczekiwany styl odpowiedzi skilla

Dobra odpowiedź powinna być:

- **krótka, ale kompletna** — najpierw wnioski, potem szczegóły;
- **akcyjna** — zawierać rekomendację, co zrobić dalej;
- **konkretna** — podawać nazwy gałęzi, SHA commitów, liczby ahead/behind i ścieżki plików;
- **bezpieczna** — jasno oznaczać ryzyka, np. lokalne zmiany, brak upstreamu albo gałąź będącą za zdalną;
- **gotowa do użycia** — np. jako szkic opisu PR albo checklisty.

Przykład dobrego formatu:

```markdown
### Wynik
Gałąź jest gotowa do push.

### Szczegóły
- Branch: feature/login-flow
- Upstream: origin/feature/login-flow
- Ahead/behind: 1 ahead, 0 behind
- Working tree: clean

### Rekomendacja
Możesz wykonać push. Przed PR-em warto jeszcze uruchomić testy projektu.
```

## Czego skill nie powinien robić bez wyraźnej prośby?

Dev Helpers Skill jest domyślnie nastawiony na odczyt i raportowanie. Bez wyraźnej prośby użytkownika nie powinien:

- tworzyć commitów;
- robić push;
- usuwać plików;
- resetować gałęzi;
- wykonywać rebase lub merge;
- modyfikować kodu;
- automatycznie usuwać znalezionych `TODO`/`FIXME`.

Jeżeli potrzebujesz akcji zmieniającej repozytorium, poproś o nią wprost, np.:

```text
Po sprawdzeniu statusu utwórz commit z komunikatem: docs: update skill docs.
```

## Jak działa pod spodem?

Skill może korzystać z pomocniczych skryptów PowerShell znajdujących się w katalogu `scripts/`. Są one detalem implementacyjnym i służą do zebrania danych z Git oraz repozytorium. Użytkownik nie musi znać ich nazw, aby korzystać ze skilla.

Dostępne akcje implementacyjne obejmują:

- sprawdzenie statusu repozytorium;
- sprawdzenie informacji o gałęzi;
- odczyt aktualnego commita `HEAD`;
- podsumowanie ostatnich commitów;
- wyszukiwanie `TODO` i `FIXME`.

## Szybka ściąga użycia

| Chcesz osiągnąć | Napisz do agenta |
| --- | --- |
| Sprawdzić ogólny stan repozytorium | `Sprawdź status repozytorium.` |
| Zweryfikować gałąź przed push | `Sprawdź, czy aktualna gałąź jest gotowa do push.` |
| Przygotować PR | `Przygotuj dane do opisu PR na podstawie ostatnich commitów.` |
| Znaleźć dług techniczny | `Znajdź TODO i FIXME w repozytorium.` |
| Zobaczyć aktualny commit | `Pokaż aktualny HEAD i krótko go opisz.` |
| Zrobić pre-flight check | `Wykonaj checklistę przed commitem i wskaż ryzyka.` |

## Najlepszy workflow

1. **Na początku pracy:** poproś o sprawdzenie kontekstu repozytorium.
2. **W trakcie pracy:** pytaj o status gałęzi i lokalne zmiany, gdy zmieniasz kontekst.
3. **Przed commitem:** poproś o checklistę statusu i `TODO`/`FIXME`.
4. **Przed pushem:** sprawdź upstream oraz ahead/behind.
5. **Przed PR-em:** wygeneruj podsumowanie ostatnich commitów i szkic opisu PR.

Dzięki temu skill działa jak mały asystent release/development hygiene: pomaga widzieć kontekst, unikać pomyłek i szybciej przygotowywać czytelne zmiany do review.
