# Skywalker Training — technische Projektdokumentation

## Zweck

Skywalker Training ist ein persönlicher Trainingstracker als iPhone-PWA für Heavy-Duty-Training nach Mike Mentzer: hohe Intensität, wenig Volumen, lange Regeneration. Diese Trainingsphilosophie prägt Produkt- und UI-Entscheidungen.

## Source-of-Truth-Regel

- Dieses Dokument ist die zentrale technische Projektdokumentation.
- Das zugehörige Notion-Dokument ist die Product Source of Truth für neue Ideen, Bugs, offene Anforderungen, Produktentscheidungen und den aktuellen Produktstatus.
- Der Code ist maßgeblich dafür, was tatsächlich implementiert ist. Notion-Anforderungen müssen deshalb immer gegen den aktuellen Code geprüft werden.
- Historische Notion-Changelogs nur lesen, wenn sie für die aktuelle Aufgabe relevant sind.
- Notion ist **keine Langzeithistorie**; Git/GitHub übernimmt diese Rolle.

## Architektur

Die Anwendung ist eine PWA mit Vanilla HTML/CSS/JavaScript. Die Hauptanwendung liegt in `index.html`. Es gibt keinen klassischen Framework-Build für die App-Auslieferung; GitHub Pages dient als Hosting.

Wichtige Dateien:

- `index.html` — Hauptanwendung
- `sw.js` — Service Worker und Cache
- `manifest.webmanifest` — PWA-Manifest
- `icon-*.png` — App-Icons
- `package.json` / Tests — lokale Testumgebung
- Trainingsbackup-Dateien — Test-/Historiedaten, sofern im Repo vorhanden

## Datenhaltung

Produktivdaten liegen lokal im Browser (`localStorage`). Zentrales Laufzeitobjekt ist `state`; historische Trainingseinheiten liegen in `state.history`.

Historische Übungen dürfen nicht ausschließlich über ihre Position im Trainingsplan identifiziert werden. Die Zuordnung über Übungsnamen bzw. `slotMeta` ist zentral, damit Planänderungen und Übungstausch die Historie nicht zerstören.

## Satztypen

Die Anwendung unterscheidet mehrere Satztypen, unter anderem:

- `wu` — Warm-up; zählt nicht zum effektiven Volumen
- `ws` — normaler Arbeitssatz
- `hit` — zentraler Heavy-Duty-Arbeitssatz bis zum Muskelversagen
- `bo` — Back-off
- `rp` — Rest-Pause

Altdaten können abweichende Schreibweisen enthalten und müssen normalisiert werden.

## Dauerhafte technische Regeln

### iOS-PWA

- Native `confirm()`, `alert()` und `prompt()` nicht für kritische Interaktionen verwenden; Rückfragen über eigene UI-Overlays lösen.
- Overlays verwenden die im bestehenden Code etablierte Öffnungslogik; bestehende Klassenkonventionen nicht ohne Grund ändern.
- Timer müssen auf Wall-Clock-Zeit basieren (`Date.now()` / Endzeit) und beim Zurückkehren aus dem Hintergrund korrekt rekonstruierbar sein.
- iOS kann JavaScript im Hintergrund einfrieren. Hintergrund-Ton/Vibration und echte Hintergrundausführung sind Plattformgrenzen und dürfen nicht als zuverlässig angenommen werden.

### Historie und Vorbelegung

- Historische Werte plan- und übungsbewusst zuordnen, nicht anhand fragiler Array-Positionen.
- Vorausgefüllte Zielwerte und tatsächlich ausgeführte Sätze sauber unterscheiden.
- Änderungen an Satztypen, Vorbelegung oder Historienzuordnung besonders auf Regressionen prüfen.

### Heavy-Duty-Logik

- Warm-ups zählen nicht zum effektiven Trainingsvolumen.
- Progression orientiert sich primär am HIT-Satz.
- Meso-/Zykluslogik ist regenerations- und rundenorientiert, nicht einfach kalenderwochenbasiert.
- Ein mehrfach ausgeführter Split darf eine unvollständige Runde nicht künstlich vervollständigen.
- Streaks oder Tagesziele, die häufiges Training belohnen, widersprechen dem Produktprinzip und sollen nicht ohne neue explizite Produktentscheidung eingeführt werden.

## Progression

Die Anwendung nutzt doppelte Progression: innerhalb des Wiederholungsbereichs zunächst Wiederholungen erhöhen, anschließend das Gewicht erhöhen und Wiederholungen entsprechend zurücksetzen. Die konkreten Parameter sind aus dem aktuellen Code zu lesen und nicht aus veralteten Dokumentationswerten abzuleiten.

## Wichtige Funktionsbereiche

Beim Arbeiten am Code zuerst die aktuelle Implementierung suchen. Besonders relevante Bereiche sind typischerweise:

- Erkennung erledigter Sätze
- historische Übungsdaten und Vorbelegung
- Progressionsziel
- Zyklus-/Rundenfortschritt
- effektives Volumen
- Timer / Pausenansicht
- Workout-Abschluss und Validierung
- Progressions-/Statistikansichten

Funktionsnamen können sich ändern; der aktuelle Code ist maßgeblich.

## Tests

- Vor Abschluss einer Änderung die vollständigen relevanten Tests ausführen.
- Neue oder behobene Logik nach Möglichkeit durch Regressionstests absichern.
- Keine feste Testanzahl in Agent-Anweisungen dokumentieren, weil sie schnell veraltet.
- Eine Änderung nur dann als erledigt behandeln, wenn Tests grün sind oder eine nicht testbare Einschränkung klar dokumentiert wurde.

## Versionierung und Deployment

Die App wird über GitHub Pages ausgeliefert. Bei Releases den bestehenden Versions- und Service-Worker-Cache-Mechanismus konsistent aktualisieren. Vor Änderungen die aktuellen Stellen in `index.html` und `sw.js` prüfen; keine Versionsnummer aus diesem Dokument übernehmen.

Da Nutzerdaten lokal gespeichert werden, müssen Updates die bestehende Datenstruktur möglichst rückwärtskompatibel behandeln. Vor riskanten Datenmigrationen Backup-/Restore-Verhalten berücksichtigen.

## Sicherheitsregeln

- Keine API-Keys, Tokens, Passwörter oder sonstige Secrets in dieses Repository, Agent-Dateien oder Notion-Arbeitsdokumente schreiben.
- Persönliche Trainingsdaten nur soweit notwendig im Repository halten und bestehende Backup-/Testdaten nicht unnötig vervielfältigen.

## Notion Retention / Housekeeping

- `CURRENT STATE` aktualisieren/ersetzen statt Statusabsätze anzuhängen.
- Verarbeitete `INBOX`-Punkte und erledigte `OPEN`-Punkte entfernen.
- `PRODUCT DECISIONS` nur für dauerhaft relevantes Produktwissen verwenden.
- `CHANGELOG` auf **maximal 10 relevante Einträge bzw. ungefähr 60 Tage** begrenzen.
- Alte Test-/Versions-/Implementierungsprotokolle nicht in Notion aufbewahren; Git/GitHub ist die vollständige Historie.

## Notion-Sync-Workflow

Der Befehl **„Notion Sync durchführen“** bedeutet:

1. `AGENTS.md` bzw. `CLAUDE.md` und dieses Dokument lesen.
2. Im zugehörigen Notion Product Hub primär `CURRENT STATE`, `INBOX`, `OPEN`, `WAITING FOR ME` sowie bei Bedarf relevante `PRODUCT DECISIONS` lesen.
3. Historische Quellen nur bei tatsächlichem Bedarf lesen.
4. Neue Punkte gegen den aktuellen Code verifizieren.
5. Punkte als Bug, Feature, Verbesserung, Frage oder notwendige Nutzerentscheidung klassifizieren.
6. Eindeutig definierte Änderungen möglichst klein und getrennt implementieren.
7. Relevante Tests ausführen.
8. Dieses Dokument nur bei dauerhaft relevanten technischen Änderungen aktualisieren.
9. Notion gemäß Retention-Regel aufräumen und kompakt aktualisieren.
10. Abschließend Änderungen, Tests und offene Nutzerentscheidungen kurz berichten.
