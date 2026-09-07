# Allgemeiner Release-Härtungsplan

Stand: 6. September 2026. Dieser Plan behebt die im Portal-Audit bestätigten, **portalunabhängigen** Fehler. Er verändert weder Balance, Kernloop, Monetarisierung noch Plattform-SDKs. CrazyGames, GamePix und Kongregate bleiben eine spätere, schmale Integrationsstufe auf derselben stabilen Spielbasis.

## Zielzustand

Rooster Rage soll als eigenständiges HTML5-Spiel, in einem iframe und unter einem beliebigen Unterpfad zuverlässig laufen. Das Spiel darf nicht im Menü weiterkämpfen, darf bei nicht verfügbarem Browserspeicher nicht abstürzen und muss bei kleinen Fensterhöhen bedienbar bleiben.

Der Abschluss ist erreicht, wenn alle folgenden Aussagen wahr sind:

- Ein Upgrade, Einstellungen, Fokusverlust oder eine spätere Host-Pause halten dieselbe Kampfsimulation an.
- Ein pausierter Run nimmt weder Schaden noch heilt er nachträglich; vorbereitete Angriffe, Abklingzeiten und Vorwarnungen warten mit.
- Alle überlagernden Bildschirme sind bei 907 × 510, 821 × 462, 390 × 844, 320 × 568 und 800 × 450 bedienbar; die primäre Aktion ist erreichbar.
- Das Spiel startet ohne `localStorage`, bleibt für die Sitzung spielbar und informiert nur dann über nicht dauerhaften Fortschritt, wenn das relevant ist.
- Ein Standalone-Build lädt aus einem beliebigen Unterpfad; GitHub Pages bleibt funktionsfähig.
- Der ausgelieferte Produktionsbuild wird zusätzlich zur bisherigen Dev-/Canvas-Suite in WebGL und als echter Produktionsbuild geprüft.

## Leitentscheidungen

| Entscheidung | Begründung |
| --- | --- |
| Eine zentrale Pauseninstanz statt mehrerer `physics.pause()`-Aufrufe | Verhindert unterschiedliche Zustände für Physik, Timer, Effekte und Eingaben. |
| Pausen über Gründe verwalten, etwa `upgrade`, `settings`, `focus` | Ein Bildschirm kann nicht versehentlich einen anderen Pausengrund aufheben. |
| Ein neutraler Speicherzugriff mit Arbeitsspeicher-Fallback | Das Spiel bleibt in restriktiven Browsern und eingebetteten Kontexten spielbar. |
| Eigene Standalone-, Pages- und später Portalbuilds | Ein Hostingpfad oder eine Portalregel verändert nicht den allgemeinen Spielcode. |
| Produktionsprüfungen als Black-Box, tiefe Mechanikprüfungen separat | Der öffentliche Build bleibt ohne Test-API; WebGL wird trotzdem belastbar geprüft. |

## Phase 0 – Sicherheitsnetz und Baseline

**Umfang**

1. Einen Arbeitsbranch `codex/general-release-hardening` anlegen.
2. Den Auditbericht als Ausgangspunkt beibehalten und die reproduzierten Szenarien in dauerhafte Tests überführen.
3. Vor jeder größeren Phase die bestehenden Gates ausführen: `test:production`, `test:smoke`, `test:mechanics`, `test:audio`, `test:foundation`, `test:boss`, `test:meta`, `test:pressure` und `test:product`.
4. Den Pacing-Gate als Messsignal behandeln: Er war einmal 0,38 Sekunden außerhalb seines Korridors und einmal innerhalb. Vorläufig keine Balanceänderung allein deswegen.

**Ergebnis**

Eine reproduzierbare Ausgangslage und kein unbeabsichtigter Verlust der bereits funktionierenden Mechanik.

## Phase 1 – Gemeinsame Spielpause

**Status: erledigt am 6. September 2026.** `GamePauseSystem` verwaltet die Gründe `hub`, `upgrade`, `settings`, `focus` und `ended`; `tests/pause-runner.mjs` sichert den Elite-Stomp, Regeneration, Einstellungen und Fokusverlust ab.

**Betroffene Stellen**

- [GameScene.js](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/scenes/GameScene.js)
- [RunStateSystem.js](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/systems/RunStateSystem.js)
- [EnemyAttackSystem.js](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/systems/EnemyAttackSystem.js)
- [Player.js](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/entities/Player.js)
- [PlayerInputSystem.js](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/systems/PlayerInputSystem.js)

**Umsetzung**

1. `GamePauseSystem` einführen. Es verwaltet eine Menge aktiver Pausengründe und veröffentlicht einen einzigen Wahrheitswert `isPaused`.
2. Die Instanz hält beim ersten Pausengrund gleichzeitig an:
   - Arcade-Physik,
   - die Phaser-Szenenuhr und damit `delayedCall`-Angriffe,
   - Kampftweens und zeitliche Kampfeffekte,
   - Spieler- und Touch-Eingaben.
3. Sie setzt beim Pausieren alle Bewegungseingaben und den virtuellen Joystick auf null. Beim letzten entfernten Pausengrund setzt sie nur die von ihr angehaltenen Systeme fort.
4. `RunStateSystem` nutzt die Pausengründe `hub`, `upgrade` und `ended`; `GameScene.openSettings()` nutzt `settings`. Direkte Aufrufe von `physics.pause()` oder `physics.resume()` außerhalb der Pauseninstanz werden entfernt.
5. `visibilitychange` und `window.blur` verwenden den Grund `focus`. Bei Rückkehr bleibt der Run pausiert und zeigt einen klaren Fortsetzen-Zustand, damit kein Spieler überraschend in laufenden Kampf zurückkehrt.
6. Regeneration, Cooldowns, Vorwarnungen und Wave-Timer an dieselbe Simulationszeit koppeln. Es darf keine nachträgliche Heilung oder abgelaufene Vorwarnung beim Fortsetzen geben.
7. Der Endzustand ist terminal: Er darf nicht durch Fokus- oder Einstellungen-Pausen wieder aktiviert werden.

**Akzeptanztests**

- Einen Elite-Stomp starten, Upgrade-Auswahl öffnen, 1,6 Sekunden warten: HP, verbleibende Vorwarnung und Gegnerzustand bleiben unverändert.
- Auswahl schließen: Der Angriff löst erst nach seiner noch offenen Vorwarnzeit aus.
- Regeneration aktivieren, drei Sekunden Einstellungen öffnen, fortsetzen: HP springt nicht nach oben.
- Während aktiver Touch-Steuerung Fokus verlieren: Figur bleibt stehen; nach Fortsetzen muss neu gedrückt/gezogen werden.
- Zwei überlappende Gründe (`upgrade` plus `focus`) öffnen und einzeln schließen: Erst nach dem letzten Grund läuft die Simulation weiter.

**Risiko und Gegenmaßnahme**

Das Pausieren einer gesamten Szenenuhr kann auch gewünschte UI- oder Endscreen-Verzögerungen anhalten. Deshalb gehören Menüs zum DOM/HUD und der Endscreen nutzt keinen wieder zu öffnenden Kampfpausepfad. Alle `delayedCall`-Verwendungen werden bei der Implementierung gezielt geprüft.

## Phase 2 – Responsive Menüs und eindeutige Fortsetzung

**Status: erledigt am 6. September 2026.** Die bestehenden Standardansichten bleiben erhalten. Nur kurze Landscape-Fenster erhalten kompakte, mehrspaltige Settings- und Upgrade-Layouts; bei sehr kurzen Telefonen scrollt ausschließlich der Einstellungsinhalt innerhalb seines Panels, während „Continue“ fest erreichbar bleibt. Der Hub, Settings, Upgrade-Auswahl und die Rückkehr-Bestätigung werden an den definierten Grenzgrößen automatisch geprüft.

**Betroffene Stellen**

- [styles.css](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/styles.css)
- [HUD.js](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/ui/HUD.js)

**Umsetzung**

1. Das Overlay erhält in jeder Desktop- und Mobilgröße eine begrenzte Höhe relativ zu `100dvh`, vertikales Scrolling und sichere Ränder für Browserleisten beziehungsweise Notches.
2. Jedes Panel erhält eine eigene maximale Höhe und internen Scrollbereich. Seine primäre Aktion bleibt sichtbar oder ist als Fußzeile fest am Panel verankert.
3. Das Settings-Panel bekommt einen immer erreichbaren „Continue“-Button und Escape schließt es, sofern keine Bestätigungsabfrage offen ist.
4. Der Hub nutzt bei geringer Höhe unabhängig von der Breite ein kompaktes Layout. Die „Start Run“-Aktion bleibt sichtbar; die Karten-/Arenavorschau darf dafür schrumpfen.
5. Upgrade-, Rückkehr-, End- und Hub-Bildschirm erhalten denselben Viewporttest. Es darf keine horizontale Überläufe und keine unsichtbaren Fokusziele geben.
6. Fokus und Tastaturbedienung prüfen: Ein geöffnetes Panel hat den Tastaturfokus, Tab bleibt darin und Escape folgt einer klaren Regel.

**Akzeptanztests**

Für 907 × 510, 821 × 462, 390 × 844, 320 × 568 und 800 × 450:

- Start Run ist ohne versteckte Aktion erreichbar.
- Settings öffnen, alle Regler bedienen, Continue per Maus, Touch und Escape erreichen.
- Upgrade wählen, Rückkehr bestätigen/abbrechen, Endscreen erneut starten.
- Dokumentbreite ist nicht größer als die Viewportbreite.

## Phase 3 – Robuste lokale Speicherung

**Status: erledigt am 7. September 2026.** `SafeStorage` fängt bereits den Zugriff auf blockiertes `localStorage` ab und hält Werte ersatzweise im Sitzungsspeicher. Der Release-Gate startet das vollständige Spiel zusätzlich mit einem absichtlich ausgelösten `SecurityError`.

**Betroffene Stellen**

- [MetaProgressionSystem.js](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/systems/MetaProgressionSystem.js)
- [ProductAnalyticsSystem.js](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/systems/ProductAnalyticsSystem.js)
- [AudioSystem.js](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/systems/AudioSystem.js)
- [EffectSettingsSystem.js](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/systems/EffectSettingsSystem.js)

**Umsetzung**

1. Ein kleines `SafeStorage`-Modul einführen. Es fängt sowohl den Zugriff auf `globalThis.localStorage` als auch `getItem`, `setItem` und `removeItem` ab.
2. Wenn dauerhafter Speicher nicht verfügbar ist, fällt es auf einen `Map`-basierten Sitzungsspeicher zurück. Die API bleibt `getItem`, `setItem`, `removeItem`.
3. Das Modul liefert `persistent: boolean` zurück. Das Spiel kann den Zustand im Settings-/Hubbereich transparent, aber nicht störend anzeigen.
4. Meta-Fortschritt, Audio, Effekte und Analyse-Einwilligung verwenden ausschließlich dieses Modul. Direkte `localStorage`-Zugriffe verschwinden aus diesen Systemen.
5. Fehlerhafte oder alte gespeicherte Daten bleiben über die bestehenden Sanitizer ungefährlich; die Fallback-Session darf keinen Schreibfehler nach außen werfen.

**Akzeptanztests**

- `localStorage`-Getter wirft `SecurityError`: Laden bis Hub und Start eines Runs funktionieren.
- `getItem`/`setItem` werfen einzeln: keine Browserfehler; Einstellungen gelten bis zum Reload.
- Normaler Speicher: Meta-, Audio- und Effektwerte überleben einen Reload.
- Ungültiges JSON und alte Metadaten erzeugen einen sicheren Standardzustand.

## Phase 4 – Portable, schlanke Builds

**Status: erledigt am 7. September 2026.** Standalone-, Pages- und Release-Ausgaben besitzen getrennte Verzeichnisse und passende Basispfade. Release-Builds enthalten nur die finalen Rooster-Sheets und keine Store-Grafik; das Paket sank von 27,27 MiB auf 17,26 MiB und hat ein automatisches 19-MiB-Budget.

**Betroffene Stellen**

- [vite.config.js](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/vite.config.js)
- [package.json](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/package.json)
- [AssetLoader.js](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/systems/assets/AssetLoader.js)
- [aceVisual.js](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/config/aceVisual.js)
- [deploy-pages.yml](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/.github/workflows/deploy-pages.yml)

**Umsetzung**

1. Drei klar benannte Buildziele einführen:
   - `build:standalone` mit relativer Basis `./`,
   - `build:pages` mit `/RoosterRage/`,
   - `build:release` als dokumentierter Standard für lokale Verteilung.
2. Die jeweiligen Ausgaben in getrennte Verzeichnisse schreiben. Ein Build überschreibt keinen anderen.
3. Einen Unterpfad-Test gegen `build:standalone` hinzufügen: HTML, JavaScript, Audio und Bilder dürfen aus `/nested/game/` ohne 404 laden.
4. Für Release-Builds nur die finalen Rooster-Sheets importieren. Legacy-, Next- und Gameplay-Versionen bleiben als Quell- beziehungsweise Entwicklungsartefakte im Repository, dürfen aber nicht über statische Imports im Releasebundle landen.
5. Marketing- und Open-Graph-Dateien vom eigentlichen Spielepaket trennen, soweit der jeweilige Build sie nicht braucht.
6. Nach der Bereinigung eine Buildbudget-Prüfung einführen: Dateizahl, Gesamtgröße, größte Dateien, initial geladene Bytes und erwartete Texturfläche ausgeben. Ein Budget wird erst nach einer Messung auf repräsentativer Hardware verbindlich festgesetzt.

**Akzeptanztests**

- Standalone-Build in einem beliebigen Unterpfad laden und spielen.
- Pages-Build auf dem bestehenden Pfad laden.
- Release-Build enthält keine ungenutzten Character-Generationen.
- Größe und Dateizahl werden als CI-Artefakt protokolliert und gegenüber der Baseline verglichen.

## Phase 5 – Produktionsrenderer und Regressionstests

**Status des praktisch relevanten Release-Gates: erledigt am 7. September 2026.** Der echte Build läuft ohne Test-API per WebGL aus einem Unterpfad in einem sandboxed iframe. Der Gate startet einen Run, prüft Settings/Escape, blockierten Speicher und jede fehlgeschlagene Netzwerkanfrage. Die langen Mechanik- und Balance-Suiten bleiben als separate bestehende Gates erhalten.

**Betroffene Stellen**

- [main.js](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/main.js)
- [production-gate.mjs](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/tests/production-gate.mjs)
- [rooster-smoke.mjs](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/tests/rooster-smoke.mjs)
- [mechanics-runner.mjs](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/tests/mechanics-runner.mjs)

**Umsetzung**

1. Die tiefe Dev-Test-Suite zusätzlich mit WebGL/AUTO laufen lassen. Die Test-API bleibt dabei ausschließlich für Test-/Entwicklungsmodi verfügbar.
2. Den echten Produktionsbuild als Black-Box prüfen: Laden, Hub, Start Run, Einstellungen, Escape/Fortsetzen, Upgrade-Overlay, Verlust oder Sieg und Neustart.
3. Einen Produktions-iframe-Test bei 907 × 510 ergänzen. Er prüft Fokusverlust, pausierte Simulation und erreichbare Einstellungen.
4. Die in Phase 1 bis 4 neu gefundenen Fehler jeweils als Regressionstest anlegen, nicht nur als manuelle Prüfanleitung.
5. Die bisherigen langen Mechanik-, Boss-, Pressure- und Pacingtests beibehalten. Der Pacing-Gate erhält bei weiteren Grenzwertverletzungen mehrere kontrollierte Wiederholungen und einen klar ausgewiesenen Median statt einer isolierten Messung.

**Akzeptanztests**

- Öffentlicher Produktionsbuild enthält keine Test-API.
- WebGL-Tests melden keine Browserfehler und erfüllen die bestehenden Frame-/Pool-Grenzen.
- Alle neuen Fehlerfälle schlagen vor dem Fix fehl und bestehen danach stabil.

## Phase 6 – Erstspieler- und Gerätevalidierung

**Umsetzung**

1. Auf mindestens einem Android- und iOS-Gerät je Portrait und Landscape prüfen.
2. Desktop in Chrome, Edge und Safari testen; zusätzlich ein Gerät mit niedrigerem Speicherbudget, idealerweise Chromebook oder vergleichbar.
3. Mit fünf bis zehn Erstspielern beobachten: Zeit bis Bewegung, erste Upgradewahl, erste Niederlage, freiwilliger zweiter Run und Verwirrung über Steuerung oder Menüs.
4. Eine kurze kontextabhängige Steuerungshilfe ergänzen, wenn die Erstspieltests die aktuelle Lücke bestätigen. Sie nennt Desktop- und Touchsteuerung, automatische Angriffe und verschwindet nach der ersten Bewegung.
5. „Training“ und „Talents“ sowie Wellentexte nur nach diesen Beobachtungen vereinheitlichen; dies ist keine Voraussetzung für die technischen Fixes.

**Akzeptanztests**

- Kein getestetes Gerät zeigt einen festhängenden Lauf, ausgefallene Steuerung, unsichtbare Hauptaktion oder fehlenden Ton nach Rückkehr.
- Die wichtigsten Erstspielerprobleme sind protokolliert und mit einer begründeten Entscheidung versehen.

## Reihenfolge und Definition of Done

1. Phase 0 abschließen und Baseline sichern.
2. Phase 1 und 2 gemeinsam implementieren, weil beide den Menü-/Pausezustand berühren.
3. Phase 3 in einem separaten, kleinen Change umsetzen und testen.
4. Phase 4 vor dem nächsten öffentlichen Testbuild abschließen.
5. Phase 5 als verpflichtende CI-Erweiterung umsetzen.
6. Phase 6 vor öffentlicher Einreichung abschließen.

Die allgemeine Härtung ist fertig, wenn alle Phasen bis 5 bestanden sind und Phase 6 keine P1-/P2-Probleme mehr findet. Erst dann beginnt die separate Portalstufe.

## Bewusst außerhalb dieses Plans

- CrazyGames-SDK, Werbeereignisse, Data-Modul und Ausblenden des Vollbildknopfs
- GamePix-SDK, dessen Pause-/Speicheradapter und Toolkit-Validierung
- Kongregate-API, Kreds, Statistiken und Einreichungsangaben
- Plattform-spezifische Cover, Videos, Vertrags- und Steuerangaben

Danach kann ein sehr kleiner `HostBridge`-Vertrag eingeführt werden: `pause`, `resume`, `gameplayStarted`, `gameplayStopped`, `load` und `save`. Der Standalone-Adapter bleibt eine No-op-Implementierung; jeder spätere Portaladapter übersetzt nur diese Ereignisse in das eigene SDK. Die Spielmechanik, Pause und Speicherung aus diesem Plan werden nicht noch einmal verändert.
