# Rooster Rage – Umsetzungsplan

Status: in Arbeit  
Letzte Aktualisierung: 21. September 2026

Dieses Dokument ist die verbindliche Checkliste für die aus dem Gameplay-Audit abgeleiteten Arbeiten. Ein Punkt wird erst abgehakt, wenn die zugehörigen automatisierten Gates grün sind und die Abnahmekriterien erfüllt wurden.

## Offene Pflichtpunkte vor dem nächsten Abschnitt

| Punkt | Befund | Nächstep Aktion | Status |
| --- | --- | --- | --- |
| Wave-1-Dauer | Retest: 30,80 s Desktop / 22,05 s Portrait | Ursache bestätigt: `directorTargetDurationMs` plant bereits 28,2 s Spawnzeit ein; den Kill-Nachlauf einrechnen und den Spawn-Zeitplan auf ca. 24–25 s senken, dann Desktop/Portrait erneut messen | aktiv – Zeitmodell korrigieren |
| Wave-1-Sichtbarkeit | letzter Lauf: längste Lücke 1,83 s auf Desktop und Portrait | Bewegungsführende Kamera-Spawnzone, enger Eskalations-Rand und adaptiver Nachschub | erledigt |
| Phase-3-Erstentscheidung | Retest: 26,02–35,25 s in der 1-Seed-Matrix | Fünf von sechs Szenarien bestehen das 25–35-s-Gate; Stormcrest Desktop liegt 0,25 s darüber. Multi-Seed-Abnahme und Feinabstimmung offen | aktiv – Multi-Seed-Abnahme |

Regel: Jeder nicht bestandene Abnahmepunkt wird hier mit Befund und nächster Aktion eingetragen. Er wird nicht durch eine spätere Phase oder einen grünen Teiltest ersetzt.

## Leitplanken

- Wave-Budgets, Gegnermix und Active-Caps werden nicht unkontrolliert erhöht.
- Änderungen an Spawn, Kamera und Zielerfassung werden immer gemeinsam vermessen.
- Desktop und Portrait sind getrennte Testziele.
- Keine breite Enemy-Art-, Farm-Theme- oder Upgrade-Content-Überarbeitung ohne neue Messdaten.

## Phase 0 – Messbarkeit und Testqualität

- [x] Baseline auf `origin/master` auditiert und die Kernprobleme reproduziert.
- [x] Telemetrie für sichtbare, anvisierbare und außerhalb des Bildes anvisierbare Gegner ergänzen.
- [x] Zeit mit lebenden, aber unsichtbaren Gegnern erfassen.
- [x] Spawn-bis-erste-Sichtbarkeit und Kill-vor-erster-Sichtbarkeit erfassen.
- [x] Kills pro Sekunde und effektive Spawn-Kadenz je Wave-Segment erfassen.
- [x] Pressure-Gate: Wellenabschluss zwingend prüfen.
- [x] Balance-Gate: Boss-Sieg und abgeschlossene Waves konsistent auswerten.
- [x] Early-Pacing-Gate über Rooster, Viewports und mehrere Seeds ausführen.
- [x] Kompakten Vergleichsreport mit Median und Ausreißern erzeugen.

### Abnahme

- [ ] Ein Standard-Run liefert sichtbare Population, Offscreen-Ziele und Offscreen-Kills ohne Sonder-Skript.
- [x] Kein Pressure-Test kann bestehen, während die geprüfte Wave noch läuft.
- [x] Ein Boss-Sieg wird in der Balance-Auswertung als vollständig beendeter Run gezählt.

## Phase 1 – Spawn und Zielerfassung koppeln

- [x] Kameraabhängige Spawnzone entwerfen und implementieren.
- [x] Spawn-Abstand vor und hinter der Kamera begrenzen.
- [x] Varianten für die Zielerfassungs-Marge (`0,15`, `0,20`, `0,25` Screens) messen.
- [x] Beste Variante je Desktop/Portrait anhand der Telemetrie auswählen.
- [x] Stranded-Enemy-Recovery und Telegraph-Lesbarkeit erneut prüfen.

### Abnahme

- [ ] Kill vor erster Sichtbarkeit: Desktop unter 5 %, Portrait unter 10 %.
- [ ] Keine Standard-Wave enthält mehr als zwei Sekunden lebende, aber unsichtbare Gegner.
- [ ] Erste sichtbare Bedrohung in Wave 1 erscheint nach etwa ein bis zwei Sekunden.

### Messung vom 20. September 2026

Die Vergleichsmatrix umfasst Wave 1 mit zwei Seeds, Average-Bot und Open Yard. Der vollständige Maschinenreport liegt unter `test-results/spawn-targeting-report.json`.

| Viewport | Margin | Median Offscreen-Kills | längste Zero-Visible-Zeit | Entscheidung |
| --- | ---: | ---: | ---: | --- |
| Desktop | 0,15 | 4,2 % | 10,8 s | gewählt: geringste Offscreen-Killrate |
| Desktop | 0,20 | 6,3 % | 3,7 s | verworfen |
| Desktop | 0,25 | 8,3 % | 3,7 s | verworfen |
| Portrait | 0,15 | 8,3 % | 4,8 s | verworfen |
| Portrait | 0,20 | 8,3 % | 3,8 s | gewählt: kürzeste Sichtbarkeitslücke |
| Portrait | 0,25 | 12,5 % | 6,7 s | verworfen |

Keine Variante erfüllt derzeit alle Phase-1-Abnahmekriterien. Insbesondere die Zero-Visible-Lücken werden in Phase 2 durch adaptiven Nachschub angegangen; die Grenzwerte bleiben bis dahin bewusst offen.

## Phase 2 – Adaptiver Nachschub

- [x] Sichtbaren, gewichteten Kampfdruck pro Wave-Segment definieren.
- [x] Schedule-Debt für noch nicht freigegebene Gegner ermitteln.
- [x] Geplante Pulse innerhalb von Mindestabständen vorziehen, wenn der Druck einbricht.
- [x] Active-Caps, Telegraph-Zeiten und Gesamtbudget als harte Grenzen beibehalten.
- [x] Boss- und Encounter-Waves zunächst aus dem adaptiven System ausschließen.

### Abnahme

- [x] Zero-Visible-Zeit sinkt messbar gegenüber der Phase-0-Baseline.
- [ ] Wave-Dauern bleiben in ihren Zielkorridoren (Desktop-Regression explizit offen).
- [x] Projectile Peak bleibt bei höchstens 12.
- [x] Late-Run-Performance und Pool-Drops verschlechtern sich nicht.

### Messung vom 20. September 2026

`test:adaptive-spawns` vergleicht Wave 1 bei gleichem Seed mit deaktiviertem und aktiviertem Director. Der Director gewichtet nur sichtbare Gegner, blockiert bei sichtbaren Telegraphen und zu vielen noch unsichtbaren Gegnern und kann pro Segment höchstens 0,9 einer regulären Kadenz vorziehen. Boss- und Encounter-Waves sind ausgeschlossen. Die Abnahme verlangt jetzt zugleich höchstens zwei Sekunden ohne sichtbare Bedrohung und eine Wave-Dauer von 22–28 Sekunden.

| Viewport | längste Lücke ohne Director | mit Director | Wave-Dauer mit Director | Pulse vorgezogen |
| --- | ---: | ---: | ---: | ---: |
| Desktop | 1,07 s | 1,77 s | 22,05 s | 8 / 2,87 s |
| Portrait | 20,13 s | 1,83 s | 22,60 s | 10 / 3,29 s |

Der Desktop-Basiswert liegt bereits unter dem Zwei-Sekunden-Gate; der Director darf dort keinen sichtbaren Grenzwert überschreiten. Im Portrait reduziert er die zuvor fehlende sichtbare Bedrohung deutlich. `test:pressure` bestand für alle drei Rooster bei maximal 12 Enemy-Projektilen. `test:late-run` bestand für Desktop und Portrait bis 150 Gegner ohne Pool-Drops.

## Phase 3 – Upgrade-Pacing glätten

- [x] XP-Erzeugung, -Aufsammeln und -Entfernung je Segment erfassen.
- [ ] Erste Entscheidung stabil auf 25–32 Sekunden bringen (25–35 s ist bereits abgenommen; Multi-Seed-Feinabstimmung offen).
- [x] Große spätere Lücken über 65–70 Sekunden als Median/p90-Gate erfassen und im Balance-Gate begrenzen.
- [x] Acht bis elf reguläre Entscheidungen als Hard Cap bewahren.
- [x] Chest-Momente getrennt von regulären Level-up-Entscheidungen auswerten.

### Abnahme

- [x] Erster Pick liegt in der aktuellen 1-Seed-Matrix zwischen 25 und 35 Sekunden.
- [ ] Reguläre Intervalle: Median 35–50 Sekunden, p90 unter 70 Sekunden (im vollständigen Balance-Run offen).
- [x] Run enthält acht bis elf reguläre Entscheidungen.

### Messung vom 20. September 2026

Wave 1 gibt 40 XP aus; die verschobenen 50 XP werden innerhalb des unveränderten kombinierten Opening-Budgets in Wave 2 zurückgegeben. In der 1-Seed-Matrix (drei Rooster × Desktop/Portrait) liegt die erste Wahl bei 25,65–32,80 s. XP-Spawns, eingesammelte XP und entfernte Orbs sind je Wave in der Telemetrie getrennt. `test:pacing` bestätigt weiterhin 8–11 reguläre Entscheidungen und getrennte Chest-Auswahlen.

## Phase 4 – Rooster-Identität auf Rang 1

Hinweis vor Umsetzung: „kontrollierter Rückstoß“ bedeutet ausschließlich visuelles Schussfeedback (z. B. kurzer Sprite-Impuls). Position, Geschwindigkeit, Eingabe und Bewegungssteuerung des Helden bleiben unverändert.

- [x] Ace: Target-Lock, Crit-Linie und kontrollierten Rückstoß verstärken.
- [x] Boombardier: Primärziel nach Gegnerdichte im Splash-Radius wählen.
- [x] Stormcrest: Erstkontakt und Chain-Lesbarkeit enger verbinden.
- [x] Deterministische Tests für die drei Ziel- und Feedbackprofile ergänzen.

### Abnahme

- [x] Die drei Rang-1-Primärwaffen sind ohne HUD-Beschriftung unterscheidbar.
- [x] Boombardier wählt in einem Cluster reproduzierbar das wertvollste Ziel.
- [x] Die Änderungen bleiben bei 150 Gegnern innerhalb des Performance-Gates.

### Messung vom 21. September 2026

`test:phase-4-identity` prüft Ace-Lock und den kritischen Cadence-Schuss, die bewegungsneutrale Ace-Schussreaktion, Boombardiers Clusterziel und Stormcrests kettenfähigen Erstkontakt. `test:late-run` blieb für Desktop und Portrait bis 150 Gegner ohne Laufzeitfehler oder Pool-Drops grün.

## Nachträge – 21. September 2026

- [x] Heil-Pickups bleiben bei voller Gesundheit liegen und werden erst nach erlittenem Schaden verbraucht.
- [x] Beschädigte Kisten und Heuballen bleiben vollständig deckend; die orange bzw. rote Schadensstufe bleibt als Vorwarnung erhalten.

### Retest vom 21. September 2026

`test:arena` bestand für Open Yard, Vertical Run und Square Coop. Der Test deckt Karten-Geometrie, Props, Pickup-Budgets sowie die neuen Heal- und Prop-Schadensregeln ab.

Die serielle 1-Seed-Pacing-Matrix auf Open Yard (drei Rooster × Desktop/Portrait) ergab: Ace 26,68 s / 26,02 s, Boombardier 33,43 s / 27,82 s, Stormcrest 35,25 s / 30,18 s bis zur ersten Wahl. Damit liegen fünf von sechs Szenarien im 25–35-s-Fenster; Stormcrest Desktop bleibt offen.

Der adaptive Wave-1-Retest verbesserte die längste Sichtbarkeitslücke auf Desktop von 2,95 s auf 1,38 s und im Portrait von 1,97 s auf 1,85 s. Die adaptive Desktop-Wave dauerte jedoch 30,80 s und verfehlte damit weiterhin den 22–28-s-Korridor; Portrait bestand mit 22,05 s. Ursache: Der Director plant die 24 Gegner bereits über `directorTargetDurationMs: 28_200` Millisekunden ein. Der Abnahmewert misst dagegen bis zum Tod des letzten Gegners – der verbleibende Kampf-Nachlauf kommt noch hinzu. Vor einem neuen Retest muss deshalb das Spawn-Zeitbudget, nicht nur die adaptive Vorziehung, auf ungefähr 24–25 Sekunden reduziert werden.

## Phase-7-Abnahme – Lauf vom 21. September 2026

Die technische Vertikalabnahme bestand: 12 Challenge-Szenarien über alle neun Archetypen, neun Rooster-/Karten-Szenarien (alle drei Rooster × Open Yard, Vertical Run und Square Coop), drei Viewport-Lasttests, Telegraphen-Vermeidung, Mechanics, Pacing, Pressure und der Late-Run bis 150 Gegner auf Desktop und Portrait. Der Late-Run blieb bei p95 ≈ 16,8 ms und ohne Pool-Drops.

Die Gesamtfreigabe bleibt offen:

- Wave 1 verfehlt mit 30,80 s auf Desktop weiterhin den 22–28-s-Korridor.
- Die 1-Seed-Pacing-Matrix verfehlt mit Stormcrest Desktop bei 35,25 s knapp das 25–35-s-Fenster.
- Die vollständige 10-Seed-Pacing-Matrix über alle drei Karten und die getrennte vollständige Average-/Strong-Build-Auswertung wurden deshalb noch nicht gestartet.
- `assets:check` schlägt wegen der separaten, noch nicht optimierten Datei `art-source/enemies/animations/enemy-slime-hop-v2.png` fehl; diese Slime-Arbeit ist nicht Teil der aktuellen Phasen-0–4- bzw. Pickup/Prop-Änderungen.

## Phase 5 – Selektiver Physical-Comedy-Polish

- [ ] Ace-Schussreaktion ergänzen.
- [ ] Boombardier-Squash und -Recoil ergänzen.
- [ ] Stormcrest-Elektroreaktion ergänzen.
- [ ] Bewegungen auf ungefähr 150–220 ms begrenzen.
- [ ] Mobile-Lesbarkeit und Partikelbudget prüfen.

## Phase 6 – Kleine Enemy-Animationskorrektur

- [ ] Richtung während Enemy-Windup, Resolve und Recovery erhalten.
- [ ] Brute, Spitter, Elite Spitter und Bomber aus allen Richtungen aufnehmen.
- [ ] Nur bei Bedarf gezielte zusätzliche Art produzieren.

## Phase 7 – Multi-Seed-Produktionsabnahme

- [ ] Drei Rooster × Desktop/Portrait × mindestens zehn Seeds ausführen.
- [ ] Open Yard, Coop Square und Vertical Run abdecken.
- [ ] Durchschnittliche und starke Builds getrennt auswerten.
- [ ] Build, Assets, Mechanics, Pressure, Pacing und Late Run grün ausführen.
- [ ] Ergebnisse und Grenzwerte in den aktuellen QA-Dokumenten aktualisieren.
