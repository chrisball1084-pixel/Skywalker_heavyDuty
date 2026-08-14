# Skywalker Training

Trainingstracker als PWA. Eine einzelne HTML-Datei, kein Build, keine Abhängigkeiten.
Daten liegen ausschließlich lokal im Browser (`localStorage`) — nichts wird übertragen.

## Auf dem iPhone installieren

1. Seite in **Safari** öffnen (nicht Chrome — nur Safari kann auf iOS installieren)
2. Teilen-Symbol antippen
3. **Zum Home-Bildschirm**
4. Die App startet danach im Vollbild ohne Safari-Leiste

## Version aktualisieren

`index.html` im Repo ersetzen und in `sw.js` die Zeile
`var CACHE = "sky-training-vX.Y.Z";` auf die neue Versionsnummer setzen.
Ohne diese Änderung liefert der Cache weiterhin die alte Fassung aus.

## Daten sichern

Startseite → **📊** (oben rechts) → ganz nach unten scrollen → **Daten-Backup** →
**📥 JSON-Backup herunterladen**. Erzeugt eine JSON-Datei mit dem kompletten Verlauf.

Zurückspielen im selben Abschnitt über **📤 Backup wiederherstellen**.

**Wichtig:** Löscht man die App vom Home-Bildschirm oder leert Safari seine
Website-Daten, sind die Trainingsdaten weg. Regelmäßig sichern.

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | die komplette App |
| `manifest.webmanifest` | Name, Farben, Icons für die Installation |
| `sw.js` | Service Worker für Offline-Betrieb |
| `icon-*.png` | Home-Bildschirm-Icons |
| `.nojekyll` | verhindert Jekyll-Verarbeitung auf GitHub Pages |
