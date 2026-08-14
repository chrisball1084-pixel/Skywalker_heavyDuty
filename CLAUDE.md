# Skywalker Training — Projektkontext

Persönlicher Trainingstracker als PWA, wird am iPhone im Gym benutzt.
Trainingsphilosophie: Mike Mentzer Heavy Duty — hohe Intensität, wenig Volumen,
lange Regeneration. Das prägt fast jede Designentscheidung.

**Aktuelle Version: v6.7.1** (in `index.html`, Konstante `APP_VERSION`)

---

## Architektur

Eine einzige HTML-Datei, ~4600 Zeilen: CSS, HTML und Vanilla JS in einem Dokument.
Kein Build, kein Framework, keine Abhängigkeiten. Das ist Absicht — die Datei wird
per Drag-and-drop auf GitHub Pages geschoben und ist sofort live.

| Datei | Zweck |
|---|---|
| `index.html` | die komplette App |
| `sw.js` | Service Worker, Cache-Name trägt die Versionsnummer |
| `manifest.webmanifest` | PWA-Manifest, alle Pfade relativ (`./`) |
| `icon-*.png` | Home-Bildschirm-Icons |
| `skywalker-backup-merged.json` | echte Trainingshistorie, 22 Einheiten Apr–Aug 2026 |

### Datenhaltung

`localStorage`, Schlüssel mit Präfix `sw51_` (Altlast aus v5.1, rein kosmetisch).
Zentrales Objekt ist `state`:

```js
state = { philId, plans, defaultTimer, history[], mesoWeek,
          forceFree, autoPause, repCeiling, bodyWeight, cycleStart }
```

`state.history` ist die Liste abgeschlossener Einheiten. Ein Eintrag:

```js
{ type:"workout", planId:"SKY_A", planName:"Chest & Back", philId:"skywalker",
  date:"5.8.2026", weekday:"Mittwoch", startTime, endTime, elapsed,
  mesoWeek, totalSets, totalVol, wsSets, wsVol,
  sets:     { "0_0":[{kg,wdh,type,name,wu,uni}, ...], "1_0":[...] },
  slotMeta: { "0_0":"Chest Fly Maschine", "1_0":"Latzug eng (Untergriff)" } }
```

**`slotMeta` ist der Schlüssel zu allem.** Übungen werden über den Namen
zugeordnet, nicht über die Position — nur so überlebt die Historie einen
Übungstausch oder eine Planänderung.

### Satztypen

Jeder Satz trägt ein `type`-Feld. Daran hängen Beschriftung, Farbe und Logik:

- `wu` — Warm-Up (zählt **nicht** ins effektive Volumen)
- `ws` — normaler Arbeitssatz
- `hit` — der eine Satz bis zum Muskelversagen, Kern von Heavy Duty
- `bo` — Back-off, folgt automatisch auf einen HIT-Satz
- `rp` — Rest-Pause

`normType()` normalisiert Altdaten, in denen Klartext statt Code stand.

---

## Regeln, die beim Ändern zu beachten sind

**iOS-PWA blockiert `confirm()`, `alert()` und `prompt()` stillschweigend.**
Kein Dialog, kein Fehler — der Code läuft einfach weiter. Jede Rückfrage muss ein
eigenes Overlay sein. Ein solcher Bug steckte bis v6.7.0 im Deload-Dialog.

**Overlays öffnen mit der Klasse `.open`**, nicht `.show`.

**Keine verschachtelten Template-Literals** in `innerHTML`-Strings. Durchgängig
`var` und Stringverkettung — hat sich auf älteren iOS-Safari-Versionen bewährt.

**Timer laufen über Wall-Clock**: `endTime = Date.now() + sek*1000`, dazu ein
`visibilitychange`-Listener. Herunterzählen per Interval geht schief, sobald iOS
die App einfriert. Ton und Vibration bleiben im Hintergrund trotzdem aus — das ist
eine Plattformgrenze, keine Lücke im Code.

**Versionswechsel**: `APP_VERSION` in `index.html` **und** `CACHE` in `sw.js`
hochziehen. Wird der Cache-Name vergessen, bekommen Nutzer weiter die alte Fassung.

**Tests laufen mit jsdom** gegen die echte Datei — statische Prüfungen übersehen
Laufzeitfehler. Für v6.7.0 waren es 30 Tests.

---

## Wichtige Funktionen

| Funktion | Aufgabe |
|---|---|
| `isSetDone(d)` | Satz gilt als erledigt, sobald kg **und** Wdh stehen (`pre` zählt nicht) |
| `getLastData(planId,pi,si,name)` | Historie einer Übung — **erst im selben Plan**, dann planübergreifend |
| `getProgressionGoal(slot,prev,pi,si)` | Zielvorgabe per doppelter Progression |
| `prefillSlot(pi,si)` | belegt Felder mit Zielwerten vor, markiert sie `pre:true` |
| `cycleProgress()` | Mesozyklus: zählt **Runden**, nicht Kalenderwochen |
| `calcEffectiveVolume()` | Volumen ohne Warm-Ups, verdoppelt bei `slot.unilat` |

### Doppelte Progression

Unterhalb `repCeiling` (Standard 12): eine Wiederholung mehr bei gleichem Gewicht.
An der Grenze: +2,5 kg (bzw. +1,25 kg unter 20 kg), Wiederholungen fallen zurück.
Gilt nur für den HIT-Satz.

### Mesozyklus

Zählt **Durchläufe, nicht Wochen**: Eine Runde ist voll, wenn alle drei Splits je
einmal absolviert wurden. Nach 6 Runden schlägt die App Deload plus Übungswechsel
vor. Grund: Bei Heavy Duty richtet sich der Abstand nach der Regeneration, nicht
nach dem Wochentag — manche Woche hat drei Einheiten, manche zwei.

`state.cycleStart` ist der Index in `history`, ab dem gezählt wird. Ältere
Einheiten bleiben erhalten, zählen aber nicht in den laufenden Zyklus.

**Fallstrick:** Wird ein Split zweimal gemacht, bevor die Runde voll ist, darf das
keine volle Runde ergeben. Genau dieser Fehler steckte in der ersten Fassung.

---

## Datenlage

22 Einheiten, 12. April bis 8. August 2026, rund 62 t effektives Volumen.
Quellen: Google-Sheets-Tracker plus handschriftliches Trainingstagebuch.

Beim Import bereinigt — falls Zahlen seltsam wirken, hier steht warum:

- **Dips** haben nie ein Gewicht getragen, im Sheet stand ein Platzhalter. Jetzt
  durchgängig 73 kg Körpergewicht (`state.bodyWeight`).
- **Trizeps 16.4.** war in Pfund abgelesen: 80/140 lbs → 36,3/63,5 kg.
- **Sieben Zellen** hatte Excel zu Datumswerten gemacht (2,5 kg → 2026-05-02).
- **Vier Zeilen** vom 23.4. waren doppelt.
- Von den Rest-Pause-Notizen ließen sich nur sieben eindeutig auflösen. Der Rest
  hängt als Notiz am HIT-Satz — das reale Volumen liegt also etwas höher.

Körpergewicht war über den ganzen Zeitraum konstant bei 73 kg.

---

## Offene Punkte

Aus dem Notion-Dokument „Skywalker Heavy Duty app", noch nicht umgesetzt:

1. **Suchfeld in der Übungsauswahl** — der Katalog hat 80 Einträge, Scrollen nervt.
   Dazu die Möglichkeit, eine Übung frei einzutippen.
2. **Plananpassung**: RDL zu Legs, Leg Raise zu Chest & Back.
3. **Dashboard** — konzipiert, nicht gebaut. Siehe unten.

### Dashboard-Konzept

Nach Nutzen sortiert, abgestimmt auf Heavy Duty:

- **Was steht an?** Nächster Split, Tage seit der letzten Einheit, Runde im Zyklus.
  Der Abstand ist bei Mentzer die zentrale Größe und gehört nach oben.
- **Progression je Übung** — Verlauf des HIT-Satzes, Veränderung seit Zyklusbeginn.
  Übungen, die drei Runden stagnieren, markieren: Signal für Wechsel oder Deload.
- **Bestwerte** — höchstes Gewicht und geschätztes 1RM (`kg × (1 + wdh/30)`).
  Das 1RM macht 40×8 und 45×5 vergleichbar.
- **Volumenverlauf** — bewusst klein halten. Steigendes Volumen ist bei Heavy Duty
  **kein** Ziel, die Intensität zählt.
- **Konsistenz** — Einheiten pro Monat, durchschnittlicher Abstand.

**Nicht bauen:** Streaks und Tagesziele. Die belohnen häufiges Training und geben
bei diesem Ansatz genau das falsche Signal.

---

## Deployment

Repo auf GitHub Pages. Dateien ersetzen, `APP_VERSION` und `CACHE` hochziehen,
fertig. Installation am iPhone nur über **Safari**: Teilen → Zum Home-Bildschirm.

Daten liegen ausschließlich lokal. Vor jedem Update ein Backup ziehen:
Startseite → 📊 → ganz nach unten → „Daten-Backup" → „📥 JSON-Backup herunterladen".
Der Abschnitt sitzt am Fuß des **Statistik**-Screens, nicht in den Einstellungen.
