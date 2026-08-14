# Prompt für Claude Code

Diesen Text im Projektordner in Claude Code einfügen:

---

Ich arbeite an "Skywalker Training", einer Trainingstracker-PWA für mein iPhone.
Lies zuerst `CLAUDE.md` — dort stehen Architektur, Datenformat und die
Besonderheiten, die beim Ändern zu beachten sind (vor allem die iOS-Eigenheiten).

Die App ist eine einzige HTML-Datei ohne Build. Tests laufen mit `npm test`
(jsdom, 84 Tests). Vor jedem Commit müssen sie grün sein.

Als Nächstes möchte ich drei Dinge angehen:

**1. Suchfeld in der Übungsauswahl**
Der Katalog hat 80 Übungen, das Scrollen im Gym nervt. Ich hätte gern ein
Suchfeld, das live filtert. Zusätzlich sollte ich eine Übung frei eintippen
können, wenn sie nicht im Katalog steht.

**2. Zwei Übungen umsortieren**
RDL gehört zu Legs, Leg Raise zu Chest & Back.

**3. Dashboard**
Konzept steht in `CLAUDE.md` unter "Dashboard-Konzept". Ich habe 22 Einheiten
Historie in `skywalker-backup-merged.json` — die kannst du zum Testen laden.
Bevor du baust: Sag mir, welche Teile du für sinnvoll hältst und in welcher
Reihenfolge. Ich will nicht alles auf einmal.

Bitte frag nach, wenn Anforderungen unklar sind, statt auf Annahmen loszulegen.
Antworte auf Deutsch. Wenn ich etwas übersehe oder falsch liege, sag es direkt.

---

## Nach dem Ändern

`APP_VERSION` in `index.html` und `CACHE` in `sw.js` hochziehen, sonst bekommt
das iPhone die alte Fassung aus dem Cache.
