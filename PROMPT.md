# Skywalker Training — Kurzbefehle

Die dauerhaften Arbeitsregeln stehen in `AGENTS.md`, `CLAUDE.md` und `docs/PROJECT.md`.
Diese Datei enthält bewusst keine aktuelle Versionsnummer, Testzahl oder Feature-Liste.

## Standard für laufende Arbeit

In Codex oder Claude Code genügt normalerweise:

**Notion Sync durchführen.**

Der Agent liest dann nur den relevanten aktuellen Produktkontext aus Notion, prüft ihn gegen den Code, implementiert eindeutige Punkte, testet und aktualisiert anschließend Notion und die dauerhafte technische Dokumentation bei Bedarf.

## Einzelne Aufgabe

Wenn nur ein konkreter Punkt umgesetzt werden soll:

**Bearbeite nur [ID oder kurze Beschreibung] aus dem Notion Product Hub. Prüfe den Punkt zuerst gegen den aktuellen Code, implementiere ihn mit minimal nötigen Änderungen, führe die relevanten Tests aus und aktualisiere anschließend den Status in Notion.**

## Review ohne Umsetzung

Wenn zunächst nur geprüft werden soll:

**Prüfe die neuen Punkte im Notion Product Hub gegen den aktuellen Code. Implementiere noch nichts. Klassifiziere jeden Punkt als Bug, Feature, Verbesserung, Frage oder Entscheidung durch mich und gib mir eine priorisierte Empfehlung.**
