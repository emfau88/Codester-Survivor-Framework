# Rooster Rage: Portal- und Qualitätsaudit

Stand: 6. September 2026. Geprüfter Commit: `a605662` (Arbeitsbaum zu Beginn sauber). Bewertung des lokalen Projekts; keine Einreichung und keine Änderungen am Spielcode. Der Produktionsbuild wurde frisch erstellt.

**Urteil: Das Spiel ist grundsätzlich für HTML5-Portale geeignet, aber der aktuelle Stand sollte vor einer öffentlichen Einreichung noch korrigiert werden.** Es gibt reproduzierbare Bedienungs- und Mechanikfehler. Ein neues Grafiksystem oder zusätzliche Spielinhalte sind nicht die dringendsten Arbeiten.

## Portalentscheidung

| Portal | Einschätzung | Vor Einreichung |
| --- | --- | --- |
| CrazyGames Basic Launch | Realistisches Ziel nach Fehlerbehebung | Relative Build-Pfade, eigene Vollbildknöpfe ausblenden, kleine iframe-Größen korrigieren, Einreichungsmedien vorbereiten. SDK für Basic optional. |
| CrazyGames Full Launch | Noch nicht vorbereitet | Zusätzlich Gameplay-Start/Stop integrieren und Fortschrittsspeicherung über die Plattform planen. |
| GamePix | Engine/Format passen, Integration fehlt | Eigenen GamePix-Build mit aktuellem SDK und passenden Lade-, Pause-, Audio- und Speicherübergängen erstellen; mit deren Toolkit prüfen. |
| Kongregate | Grundsätzlich möglich, auch wieder neue Einreichungen | Entwicklerfreigabe und Spielreview, englische Beschreibung/Steuerung, Altersangabe und AI-Deklaration vorbereiten. |

CrazyGames fordert relative Pfade. Basic erlaubt höchstens 250 MB insgesamt und 1.500 Dateien; ohne SDK zählt die gesamte Paketgröße gegen das 50-MB-Startlimit beziehungsweise das 20-MB-Limit für die mobile Homepage. Bei SDK-Integration wird bis zum ersten Gameplay-Start gemessen. [Technische Anforderungen](https://docs.crazygames.com/requirements/technical/).

Eigene Vollbildknöpfe sind bei CrazyGames untersagt. 907 × 510 und 821 × 462 gehören ausdrücklich zu den relevanten Desktopgrößen. Für Full Launch sollen neue Nutzer sofort oder mit höchstens einem Klick ins Spiel gelangen. [Gameplay-Anforderungen](https://docs.crazygames.com/requirements/gameplay/).

GamePix nennt SDK-Integration und Toolkit-Validierung als Schritte vor dem Upload. Die öffentlich auffindbare ältere API-Dokumentation ist keine ausreichende Grundlage, um hier eine aktuelle SDK-Version oder konkrete heutige Größenlimits zu garantieren. [Aktuelles Entwicklerprogramm](https://partners.gamepix.com/developers).

Kongregates Anleitung vom 11. Mai 2026 beschreibt HTML5/WebGL und iframe-Veröffentlichung sowie die Entwickler- und Spielprüfung. Die alte Aussage „Kongregate nimmt keine neuen Spiele an“ ist damit überholt. API-Integration ist abhängig von den genutzten Plattformfunktionen; ein fehlendes SDK allein ist für dieses kontolose Spiel kein belegter pauschaler Upload-Blocker. [Aktuelle Einreichungsanleitung](https://blog.kongregate.com/hc/en-us/articles/44395849259661-SUBMISSION-How-do-I-submit-a-game-to-Kongregate-It-s-Easy).

## Priorisierte Befunde

P1 = vor Veröffentlichung beheben. P2 = vor breiter Vermarktung verbessern beziehungsweise belastbar prüfen. „Bestätigt“ bedeutet im aktuellen Code oder lokalen Browser reproduziert; Empfehlungen sind keine nachgewiesenen Balancefehler.

### 1. P1, bestätigt: Einstellungen können den Lauf in kleinen Desktopfenstern blockieren

**Reproduktion:** Spiel bei 960 × 540 starten, Pause/Einstellungen öffnen. Das Panel ist etwa 903 px hoch; „Continue“ liegt bei y=657–702 und damit außerhalb des Fensters. Ein normaler Playwright-Klick scheitert nach wiederholtem Scrollversuch. Im echten Produktions-iframe mit 907 × 510 bleibt die Schaltfläche auch nach einem Mausrad-Scroll von 1.400 px unerreichbar. Der Lauf kann über die normale Mausbedienung nicht fortgesetzt werden.

**Ursache:** Das zentrierte Desktop-Overlay begrenzt die Panelhöhe nicht und bietet hier keinen vertikalen Scrollbereich. Die mobilen Regeln lösen diesen speziellen Desktopfall nicht.

**Maßnahme:** Panelhöhe am verfügbaren Viewport begrenzen; Inhalt scrollbar machen und Fortsetzen dauerhaft erreichbar halten. Escape als zusätzlicher Ausweg ist sinnvoll. Hub-, Upgrade- und Endbildschirme ebenfalls in kleinen Frames prüfen.

Belege: [CSS](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/styles.css:512), [Settings-Panel](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/styles.css:1218), [Screenshot im Produktions-iframe](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/test-results/portal-audit-2026-09-06/production-iframe-settings.png).

### 2. P1, bestätigt: Kampfschaden während der Upgrade-Auswahl

**Reproduktion:** Den regulären Elite-Brute-Stomp starten, innerhalb seiner 620-ms-Vorwarnung die reguläre Upgrade-Auswahl öffnen. Nach 1,6 Sekunden bleibt die Auswahl offen, aber die Testfigur hat statt 1.000 nur noch 979 HP. Die erhöhte Test-HP dient nur der isolierten Beobachtung; Schaden und Angriff stammen aus der normalen Implementierung.

**Ursache:** `physics.pause()` und die Rückkehr aus `GameScene.update()` pausieren nicht die Phaser-Szenenuhr. Der vorbereitete `delayedCall` führt den Stomp samt direktem `player.damage()` weiterhin aus. Der Spieler kann während der Auswahl nicht ausweichen.

**Maßnahme:** Einen gemeinsamen Pausenzustand für Kampfuhr, Timer, Physik und Eingaben einführen. Bereits vorbereitete Angriffe nach Fortsetzen mit verbleibender Vorwarnzeit weiterführen. Das betrifft auch Einstellungen und spätere Portal-/Werbepausen.

Belege: [Upgrade-Pause](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/systems/RunStateSystem.js:110), [Angriffstimer](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/systems/EnemyAttackSystem.js:92), [Schaden ohne Menüschutz](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/entities/Player.js:80).

### 3. P1, bestätigt: Gesperrter Browser-Speicher verhindert den Start

**Reproduktion:** Im frischen Produktionsbrowser den `localStorage`-Getter mit einem `SecurityError` verweigern, wie es eingeschränkter Dokumentzugriff tun kann. Ergebnis: uncaught „Access is denied for this document“, Ladezustand bleibt `loaded`, kein Startknopf. Das ist ein gezielter Fehlerfall, keine Behauptung, dass jeder Privatmodus so reagiert.

**Ursache:** `globalThis.localStorage` wird schon als Defaultargument des Konstruktors ausgewertet, bevor die späteren `try/catch`-Blöcke um `getItem`/`setItem` greifen. Dasselbe Muster existiert zusätzlich in ProductAnalytics.

**Maßnahme:** Bereits den Zugriff auf das Storage-Objekt abfangen, einen Sitzungsspeicher als Fallback bereitstellen und fehlende dauerhafte Speicherung verständlich kennzeichnen. Anschließend echte iframe-/Privacy-Einstellungen testen.

Belege: [Meta-Konstruktor](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/systems/MetaProgressionSystem.js:168), [Analytics-Konstruktor](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/systems/ProductAnalyticsSystem.js:48).

### 4. P1 für Portalpakete, bestätigt: Absolute Build-Pfade

`npm run build` erzeugt Verweise auf `/assets/...`; die Pages-Pipeline baut separat für `/RoosterRage/`. Beide Varianten sind an einen festen Hostingpfad gebunden. Ein Test mit Auslieferung unter `/nested/game/` und ausschließlich dort verfügbaren Dateien ergibt vier 404-Fehler und kein Spiel.

**Maßnahme:** Einen expliziten Portalbuild mit `base: './'` beziehungsweise `vite build --base=./` erstellen. Nur dessen Build-Ausgabe einreichen und unter einem beliebigen Unterpfad testen. Das ist keine Aussage, dass der bestehende GitHub-Pages-Link defekt sei.

Belege: [Vite-Konfiguration](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/vite.config.js:3), [Pages-Workflow](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/.github/workflows/deploy-pages.yml).

### 5. P2, bestätigt: Startknopf bei 907 × 510 zunächst unsichtbar

Im frischen Hub liegt „Start Run“ bei y=557–631, außerhalb des 510 px hohen Frames. Anders als bei den Einstellungen kann die Automatik ihn hier durch Scrollen erreichen. Der deutlich kleinere 821 × 462-Fall funktioniert besser, weil eine andere CSS-Regel greift: Die kritische Lücke liegt zwischen den Layoutvarianten.

**Maßnahme:** Die untere Startleiste auf allen Portalgrößen sichtbar halten, Map-Vorschau bei geringer Höhe stärker begrenzen und Scrollbarkeit erkennbar machen. Ein erster Besuch sollte nicht davon abhängen, dass Nutzer einen versteckten Startknopf suchen.

Belege: [Desktop-Media-Query](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/styles.css:6972), [907 × 510 vor Scrollen](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/test-results/portal-audit-2026-09-06/desktop-menu.png).

### 6. P2, bestätigt: Menüzeit erzeugt nachträgliche Heilung; iframe-Fokusverlust pausiert nicht

Mit 2 HP/s Regeneration, 50 HP und drei Sekunden geöffneten Einstellungen erhält die Figur unmittelbar nach Fortsetzen rund 6 HP, obwohl die Kampfsimulation pausiert war. Regeneration verwendet die unpausierte Szenenuhr. Abklingzeiten und zeitlich begrenzte Effekte sollten gemeinsam überprüft werden.

Im Produktions-iframe läuft der sichtbare Run-Timer nach einem Klick auf die umgebende Portalseite von 00:01 auf 00:04 weiter. Es erscheint keine Pause. Das ist bei einem Actionspiel mit Portalnavigation ein unnötiges Verlust- und Frustrationsrisiko; ein normaler Tabwechsel ist ein anderer Fall und wurde dadurch nicht pauschal bewertet.

**Maßnahme:** Regeneration an aktive Simulationszeit koppeln; iframe-Fokusverlust behandeln, Eingabevektoren zurücksetzen und explizites Fortsetzen anbieten. [Regeneration](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/entities/Player.js:122), [Eingabesystem](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/systems/PlayerInputSystem.js:20).

### 7. P2, bestätigt: Uploadpaket enthält vermeidbare Assetgenerationen

Gemessener frischer Build: **146 Dateien, 28.590.848 Bytes (28,59 MB dezimal)**. Davon entfallen **8.192.102 Bytes** auf 15 ältere Next-, Gameplay- und Legacy-Charakterdateien. Die URL-Auswahl hält mehrere Generationen im Produktionsbundle. Legacy-Walk-Sheets werden sogar zusätzlich zu den finalen Figuren geladen. Das Marketing-Masterbild beansprucht weitere 2,32 MB im Paket.

Ohne CrazyGames-SDK überschreitet damit das Gesamtpaket die 20-MB-Grenze für die mobile Homepage; ein Basic-Desktop-Upload scheitert dagegen nicht an der Dateigröße. Der lokale Standardstart lud circa 18,80 MB Ressourcen in 133 Requests. Diese Messung auf localhost ist kein Nachweis für reale Netzladezeit und keine offizielle SDK-Startmessung.

Die geladenen Texturquellen ergeben rechnerisch rund **189 MB RGBA-Bilddaten**. Das ist eine Größenabschätzung aus Pixelmaßen, keine gemessene RAM-/VRAM-Belegung. Sie zeigt aber, weshalb kleine WebP-Dateien allein keine Mobilfreigabe beweisen.

**Maßnahme:** Im Portalbuild nur freigegebene Charaktergenerationen zulassen, explizit benötigte Legacy-Abhängigkeiten auflösen, Marketingdateien separat ausliefern. Danach stufenweises Laden von Musik, Gegnern oder Arenen prüfen. Erst messen, dann weitere Kompression vornehmen. [AssetLoader](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/systems/assets/AssetLoader.js:1), [Visual-Konfiguration](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/config/aceVisual.js:1).

### 8. P2: Gameplay-Tests decken den Produktionsrenderer nicht ausreichend ab

`main.js` erzwingt im Entwicklungsmodus Canvas und verwendet in Produktion AUTO, im Audit tatsächlich WebGL. Die ausführlichen Tests nutzen den Devserver und die nur dort verfügbare Test-API. Der vorhandene Production-Gate prüft Startfehler und das Fehlen der Test-API, aber keinen vollständigen Run.

Im Audit wurden zusätzlich reale Produktionsstarts und erste Kampfsekunden in fünf Viewports sowie ein echtes iframe geprüft. Das ersetzt keine WebGL-Langzeitprüfung. Der Boss-Gate arbeitet zudem mit fest vergebenem Build und 999 HP: Er ist hilfreich für Abläufe und Tötungszeit, aber kein Beleg für menschliche Gewinnwahrscheinlichkeit.

**Maßnahme:** UI-gesteuerte Produktionsprüfungen für Start, Bewegung, Upgrade, Pause, Tod/Sieg und Neustart; mindestens ein vollständiger WebGL-Run pro Klasse und relevante mobile Hardware. [Rendererwahl](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/src/main.js:10), [Production-Gate](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/tests/production-gate.mjs:1), [Boss-Testaufbau](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/tests/boss-runner.mjs:32).

## Spielgefühl und Gestaltung

Die Hahnenklassen, Ei-Waffen, Evolutionen und Hofwelt geben dem Spiel eine erkennbare Identität. Die bestehende Progression, getrennte Audioregler und abschaltbare Effekte sind gute Voraussetzungen. Die geprüften aktuellen Screens zeigen keine fehlenden Haupttexturen. Ein Komplettaustausch der Assets ist aus diesem Audit nicht begründbar.

Folgende Verbesserungen würde ich nach den P1-Fehlern priorisieren:

1. **Steuerung direkt im ersten Run erklären.** In der Produktionsoberfläche fehlt eine konkrete WASD-/Pfeiltasten-/Touch-Anweisung; die README beschreibt sie. Ein kurzer Hinweis „WASD / arrows to move — attacks are automatic“, mobil „Drag left to move“, kann nach erster Bewegung verschwinden. Der Wellentext über „movement and auto-aim“ ersetzt das nicht.
2. **Den Hahnencharakter früher verkaufen.** Der Desktop-Erstbildschirm widmet sehr viel Fläche der leeren Bodenkarte. Eine größere ausgewählte Figur und ein sichtbarer Startknopf vermitteln das eigentliche Spiel besser. Locked Challenges, Archiv und Talente dürfen nach dem ersten Run stärker hervortreten.
3. **Lesbarkeit auf realer Spielgröße bewerten.** Im 390-px-Portrait bleiben für Waffenicons und Zahlen nur kleine Flächen. Bodenstruktur und herumliegende Details konkurrieren mit kleinen Projektilen. HUD-Kontrast, Gefahrensignale und Figurensilhouette gezielt in dichtem Kampf prüfen; Vergrößerungen im Character Lab reichen dafür nicht.
4. **Vorschautexte und Bezeichnungen vereinheitlichen.** Desktop zeigt „Training“, Mobile „Talents“. Wave-Untertexte wie „Fodder only“ oder „Mixed area control capped by an elite ranged threat“ lesen sich eher wie Designnotizen als wie Spielerhilfe. Kurze handlungsbezogene Texte sind verständlicher.
5. **Klassenfreischaltung mit neuen Spielern testen.** Boombardier erfordert 75 Gesamtkills, Stormcrest einen Sieg. Ob der erste Sieg zu spät für den dritten beworbenen Charakter kommt, ist offen. Ein Probelauf oder alternative Freischaltung wäre eine mögliche Verbesserung, keine bewiesene Notwendigkeit.
6. **Keinen neuen Content vor der Erstspielerprüfung stapeln.** Mit 5–10 neuen Spielern Zeit bis Bewegung, erstes Upgrade, erste Niederlage und freiwilligen zweiten Run beobachten. Automatische Bots ersetzen diese Rückmeldung nicht.

Der automatisierte Early-Pacing-Gate lag in einem frischen Gesamtlauf für Ace im Portraitformat mit 35,38 Sekunden knapp außerhalb seines eigenen Zielkorridors von 18–35 Sekunden. Die isolierte Wiederholung desselben Seeds bestand mit 33,20 Sekunden. Das ist kein stabil bestätigter Balancefehler, zeigt aber wenig zeitlichen Puffer. Für die Veröffentlichung sollte der erste Upgrade-Moment in echten Erstspieler-Runs beobachtet und möglichst robuster vor 35 Sekunden erreicht werden.

## Assets, Lizenzen und Einreichungsmedien

Das Audio-Lizenzverzeichnis ist ein guter Anfang. Vier Musikquellen wurden online gegengeprüft und nennen CC0: [Wacky Wobblings / Fupi](https://opengameart.org/content/wacky-wobblings), [Urban Boss Battle / MintoDog](https://opengameart.org/content/urban-boss-battle), [Oldschool Action Theme / Joth](https://opengameart.org/content/oldschool-action-theme), [Run-Loop / Nostromo](https://opengameart.org/content/music-loop-strong-downtempo-seamless). Die fehlenden Autorenangaben für Menü- und Siegmusik lassen sich damit ergänzen. Nicht jeder einzelne SFX-Download wurde in diesem Audit mit dem Original verglichen.

Für Bildassets existieren teilweise ImageGen-Quellen und Prompts. Ein vollständiges Herkunftsregister für sämtliche final ausgelieferten Bilder, Referenzen, Sounds und Bibliotheksnotices fehlt jedoch als geschlossenes Paket. Das ist eine Dokumentationslücke, kein Nachweis fremder oder unzulässiger Assets. Ein Manifest mit Quelldatei, Herkunft, Autor/Tool, Nutzungsnachweis und finalen Ableitungen würde die Einreichung absichern. Die konkrete AI-Nutzung sollte für Kongregate gemäß dessen Einreichungsformular beschrieben werden.

Die vorhandenen Marketingdateien sind noch kein vollständiges CrazyGames-Paket. Dessen Vorgaben nennen Cover in **1920 × 1080, 800 × 1200 und 800 × 800** sowie kurze Vorschauvideos in Quer- und Hochformat. Das vorhandene Store-Manifest nennt ein 1672 × 941-Master und ein 36-Sekunden-Reel mit 1280 × 720. Dafür passende Exporte erstellen, aktuelle Figuren verwenden und den Einstieg direkt mit Gameplay zeigen. [Cover-/Videoanforderungen](https://docs.crazygames.com/requirements/game-covers/).

Die lokale Meta-Speicherung ist kein allgemeines Portalverbot. Für CrazyGames Full sollte die passende Speicherintegration bewusst umgesetzt werden; der Data-Baustein unterstützt Gast- und angemeldete Nutzer. [Data-Dokumentation](https://docs.crazygames.com/sdk/data/).

## Durchgeführte Prüfungen und Grenzen

Bestanden: frischer Produktionsbuild mit Production-Gate, Smoke, Mechanics, Assets (132 manifestierte Dateien), Audio, Foundation, Boss, Meta/Challenges, Pressure und Product/Analytics. Der Early-Pacing-Gate verfehlte im Gesamtlauf einen Grenzwert um 0,38 Sekunden und bestand in der isolierten Wiederholung. `npm audit --omit=dev` meldet null bekannte Schwachstellen für die geprüften Produktionsabhängigkeiten; dies ist kein allgemeiner Sicherheitsnachweis.

Zusätzliche Auditprüfungen: Produktionsstart und erste Kampfsekunden bei 907 × 510, 821 × 462, 390 × 844, 320 × 568 und 800 × 450; echtes 907 × 510-iframe; blockierter Storage-Getter; Unterpfadauslieferung; Settings-Timer; Stomp während Upgrade-Auswahl; Regeneration nach Pause; Assetgrößen und Texturflächen. Für isolierte Timerprüfungen wurde die Dev-Szene nur im Browser instrumentiert, ohne Spielquellen zu ändern.

Nicht abschließend geprüft: reale iPhones/Androidgeräte, Safari und Firefox (lokale Playwright-Binaries fehlen), schwache Chromebooks, reale Mobilfunknetze, 144-/165-Hz-Monitore, vollständige menschliche Runs jeder Klasse und tatsächliche Portal-SDK-/Werbeabläufe. Vorhandene historische Reports wurden nicht als frisch bestandene Vollabnahme ausgegeben.

Rohdaten und reproduzierbare Auditskripte liegen lokal in [Audit-Report JSON](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/test-results/portal-audit-2026-09-06/report.json), [zusätzlichem Report](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/test-results/portal-audit-2026-09-06/extra-report.json), [Auditskript](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/test-results/portal-audit-2026-09-06.mjs) und [Zusatzskript](C:/Users/madde/Documents/ChatGPT/Rooster/RoosterRage/test-results/portal-audit-extra-2026-09-06.mjs). `test-results/` ist git-ignoriert. Das Hauptskript wurde nach einem entdeckten UI-Timeout mit `--followup` fortgesetzt; im JSON stehen deshalb teilweise wiederholte Befunde. Die letzte Messung pro Label ist maßgeblich.

## Empfohlene Reihenfolge

1. Einstellungen erreichbar machen; Kampftimer und Regeneration korrekt pausieren; Storage-Fallback reparieren.
2. Portalbuild mit relativen Pfaden, Plattformadapter und entfernbaren Vollbildknöpfen erstellen.
3. Startknopf in allen relevanten Frames sichtbar halten; kurze Steuerungshilfe hinzufügen.
4. Assetgenerationen und Marketingdateien aus dem Spielpaket bereinigen; Medien und Herkunftsregister fertigstellen.
5. Produktions-WebGL auf realen Geräten und mit neuen Spielern prüfen; anschließend gezielt einen Portalreview anstoßen.

Als ersten technischen Einreichungsschritt halte ich einen CrazyGames-Basic-Review nach diesen Korrekturen für sinnvoll. Kongregates Entwicklerbewerbung kann mit vorhandenem Gameplay-Link vorbereitet werden. Für GamePix sollte vorher ein eigener SDK-Build stehen. Eine Annahme oder Reichweite lässt sich aus dem technischen Audit nicht garantieren.

