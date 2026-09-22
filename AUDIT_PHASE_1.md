# Phase 1 Audit — Phaser Survivor Game Foundation

Stand: 22. September 2026  
Audit-Basis Original: [`emfau88/RoosterRage`](https://github.com/emfau88/RoosterRage) auf `master`, Commit [`5e9fc5879ff322d73c5b8267aa3b0e5cd14a5419`](https://github.com/emfau88/RoosterRage/commit/5e9fc5879ff322d73c5b8267aa3b0e5cd14a5419)  
Ziel: [`emfau88/codester-survivor-framework`](https://github.com/emfau88/codester-survivor-framework), zum Auditzeitpunkt leer

## 1. Executive Summary

Rooster Rage ist technisch keine kleine Demo, sondern ein weit entwickelter, getesteter Vertical Slice mit einer belastbaren Survivor-/Bullet-Heaven-Basis. Der aktuelle Stand besitzt bereits die wertvollsten, erfahrungsgemäß schwierigen Teile eines kommerziellen Framework-Produkts: einen vollständigen Run-Loop, mehrere Angriffsarten, Upgrade- und EVO-Pfade, datengetriebene Waves, adaptive Spawn-Steuerung, Bossphasen, Meta-Progression, defensives Local-Storage-Verhalten, responsive Desktop-/Mobile-Layouts, Objektpools, Telemetrie und eine breite Browser-Regression-Suite.

Der Code ist aber noch ein Spiel mit modularisierten Systemen, nicht bereits ein neutralisiertes Framework. Vor allem Gegner, aktive Waffen, Asset-Registrierung, Teile der Charakterlogik, Bossdefinitionen, Meta-Roster und UI-Texte sind an Rooster-Rage-IDs und konkrete Content-Klassen gekoppelt. Ein Käufer könnte das Spiel heute reskinnen und erweitern, müsste dafür aber zu viele Core-Dateien kennen und synchron ändern.

Das größte unmittelbare Verkaufshemmnis ist nicht fehlende Funktionalität, sondern die Kombination aus:

1. unvollständiger kommerzieller Provenienz-/Lizenzkette für sämtliche enthaltenen Assets,
2. fehlenden stabilen Registries und dokumentierten Extension Points,
3. fehlender Trennung zwischen Framework, Beispielspiel, Produktionsquellen und internen QA-Artefakten,
4. fehlender Käuferdokumentation und Produktlizenz,
5. zu stark Rooster-Rage-spezifischen Tests und Bezeichnern.

Empfehlung: kein Rewrite. Der bestehende Vertical Slice bleibt der Kern und das Beispielspiel. Produktisierung sollte über dünne Registries, Konfigurationsgrenzen, Packaging-Profile und Dokumentation erfolgen.

## 2. Verifizierter Repository-Stand

### Umfang

- 115 Commits auf `master` laut GitHub-Commit-Paginierung.
- 1.156 versionierte Dateien (1.311 Tree-Einträge inklusive Verzeichnissen).
- Rund 477,6 MB unkomprimierter Blob-Inhalt; GitHub weist rund 516 MB Repository-Größe aus.
- Größte Bereiche:
  - `art-source/`: 468 Dateien, rund 360,2 MB
  - `docs/`: 240 Dateien, rund 78,2 MB
  - `src/`: 494 Dateien, rund 36,0 MB
  - `tests/`: 37 Dateien, rund 0,43 MB
  - `scripts/`: 49 Dateien, rund 0,24 MB
- Im geprüften Source-/Test-/Script-Subset: 156 Textdateien und rund 37.974 Zeilen JavaScript, CSS, JSON, MJS und Python.

### Technologie und Build

- Phaser `3.90.0`
- Vite `8.2.1` aus dem Lockfile
- Vanilla JavaScript/CSS, ES Modules
- Playwright `1.62.1`
- Node.js 24 als dokumentierte und CI-verwendete Laufzeit
- Buildprofile für Standard, Standalone, GitHub Pages und Release
- Release-Paket-Gate mit relativem Assetpfad, Iframe-Test, blockiertem Local Storage, WebGL-Prüfung und Größenlimit
- GitHub Pages Deployment über GitHub Actions

Der letzte Workflow auf dem geprüften Commit war erfolgreich: [GitHub Actions Run 35619560536](https://github.com/emfau88/RoosterRage/actions/runs/35619560536). Verifiziert wurden dort Asset-Manifest, Production Build/Gate, Smoke, Mechanics, datensparsame Product Analytics, Pages-Build/Release-Gate und Deployment.

Wichtig: Viele zusätzliche vorhandene Gates werden derzeit nicht im Pages-Workflow ausgeführt. Angaben zu Balance-, Soak-, Boss-Matrix- oder Acceptance-Ergebnissen sind im Repository dokumentiert und durch Testcode gestützt, wurden in diesem Audit aber nicht als vollständiger lokaler Full-Suite-Lauf wiederholt. Die Binärassets wurden für den Source-Audit bewusst nicht in einen zweiten Voll-Clone geladen; der erfolgreiche CI-Lauf betrifft jedoch exakt den geprüften Commit mit vollständigem Repository.

## 3. Ist-Architektur

### Bootstrap und Orchestrierung

`src/main.js` erstellt eine Phaser-Konfiguration mit Arcade Physics und installiert die Display-Resolution-Logik. `GameScene` ist die Composition Root und verbindet die Systeme. Die Aufteilung ist grundsätzlich sinnvoll; `GameScene` enthält aber noch mehrere content-spezifische Delegationsmethoden und Arena-/Rooster-Sonderfälle.

### Systemschichten

| Bereich | Aktuelle Implementierung | Einschätzung |
| --- | --- | --- |
| Run/Scene | `GameScene`, `RunStateSystem`, `GamePauseSystem` | Stabiler Loop, klare Zustände; Composition und Content noch vermischt |
| Combat | `CombatSystem`, `CollisionSystem`, `ProjectileLifecycleSystem`, Projektil-Entities | Reif und funktional; Primärwaffen und Feedback enthalten Content-ID-Branches |
| Abilities | `ActiveAbilitySystem` plus einzelne Ability-Klassen | Gute Klassenaufteilung; Registrierung und Dispatch hart verdrahtet |
| Enemies | generische `Enemy`-Entity, `EnemyAttackSystem`, Definitionen in `WaveSystem` | Runtime ist flexibel; Definitionen gehören aus `WaveSystem` in eine Registry |
| Waves | `waveDefinitions.js`, `WaveSystem`, `SpawnDirector` | Sehr guter Kandidat zum nahezu unveränderten Framework-Core |
| Arenen | `arenaDefinitions.js`, `ArenaSystem`, Renderer/Loader | Überwiegend datengetrieben; einige Asset- und Arena-Sonderfälle verbleiben |
| Progression | `UpgradeSystem`, `LoadoutSystem`, 45 Upgrade-Definitionen, 11 EVOs | Inhaltlich stark; Definitionen enthalten ausführbaren Code und Scene-Aufrufe |
| Meta | `MetaProgressionSystem`, Challenges, Talente, Mastery, Cosmetics, History | Funktional vollständig; Roster/Cosmetics/IDs teils im System hardcodiert |
| Save | `SafeStorage`, Meta v2 und Migration von v1 | Defensiv und portal-tauglich; Namespaces/Schema sollten produktkonfigurierbar werden |
| UI | `HUD.js`, umfangreiche responsive CSS-Datei | Hoher Produktionswert; sehr groß, gebrandet und schwer isoliert erweiterbar |
| Audio | `AudioSystem`, Event-Mapping, Voice Limits, Persistenz | Reif; Eventnamen und Content-Mapping benötigen Registry/Example-Schicht |
| Performance | Objektpools, FX-/Audio-/Projectile-Limits, XP-Bundling, Mobile Caps, Telemetrie | Klare Framework-Stärke |
| QA | Test API, 35 Testdateien, Browser-/Viewport-/Mechanics-Gates | Außergewöhnlich stark; viele Assertions sind auf exakt drei Rooster und konkreten Content fixiert |

### Aktuelle Daten-/Config-Struktur

Bereits gut datengetrieben:

- `roosterDefinitions.js`: Stats, Primärwerte, passive Beschreibung, Archetypen, Affinitäten, Visuals
- `waveDefinitions.js`: zehn Waves, Komposition, XP-Budgets, Druckkurven, Desktop-/Mobile-Caps
- `arenaDefinitions.js`: Bounds, Streaming, Obstacles, Weapon Ratings
- `challengeDefinitions.js`: Unlocks und Modifikatoren
- `metaProgressionDefinitions.js`: Currency-/Talent-/Mastery-Werte
- `upgradeDefinitions.js`: Katalog, Ränge, Bedingungen, Rezepte
- Präsentations-, Visual- und Combat-Feedback-Profile

Noch nicht ausreichend datengetrieben:

- Enemy-Stats und Bosskonfiguration liegen als `make...()`-Methoden in `WaveSystem`.
- Enemy-Kind-Registry ist ein lokales Mapping in `WaveSystem`.
- Active Abilities werden explizit importiert, instanziiert, aktualisiert, evolved und abgefragt.
- Asset-Imports und Phaser-Keys werden einzeln in `AssetLoader`/`AnimationSetup` gepflegt.
- Primärangriffs-Zielwahl und einige Treffer-/Feedbackregeln verzweigen nach `roosterId` oder Source-ID.
- Meta-Roster, Unlocks, Cosmetics und Extra-Enemy-Lexikon sind im Systemmodul verankert.
- HUD und CSS enthalten sehr viele Rooster-/Henhouse-/Kernel-Begriffe.

## 4. Erweiterbarkeits-Audit

### Neuer Character

Heute bereits gut: Basisdefinition, Stats, Primärwerte, Affinitäten, Archetypen und Visual-Metadaten liegen in einer Character-Liste.

Noch erforderliche Core-/Querschnittsänderungen:

- Asset-Loader und Animation-Setup
- Player-Animationsannahmen und ggf. Spiegelrichtung
- Combat-Zielwahl/Primärmechanik
- Primärwaffen-Rank-Upgrades und EVO
- Audio-Key
- Meta-Roster/Unlock/Mastery/Cosmetics
- feste UI-/Testannahmen über drei Rooster

Urteil: **REFACTOR**. Eine Definition allein reicht noch nicht.

### Neuer Enemy

Die `Enemy`-Entity kann viele datenförmige Attribute aufnehmen. `EnemyAttackSystem` unterstützt wiederverwendbare Ability-Kinds wie Shoot, Fan, Summon, Dash und Slam sowie Aura-Arten. Das ist eine gute Basis.

Heute müssen aber `WaveSystem`, Asset Loader, Animation Setup, Lexikon/Meta und Tests geändert werden. Boss und Elites haben zusätzliche Spezialpfade.

Urteil: **REFACTOR**. Enemy-Definitionen und Factory gehören in eine Registry; der Attack Executor kann weitgehend bleiben.

### Neue Weapon / Ability / EVO

Passive Stat-Upgrades sind relativ leicht ergänzbar. Eine neue aktive Waffe benötigt dagegen Definition, Klasse, Imports, Instanziierung, Update, Unlock, Evolution Dispatch, Cooldown Snapshot, Assets, Audio, VFX/Feedback, Test-API und Regressionen.

Urteil: **REFACTOR**. Benötigt ein Ability-Plugin-/Registry-Protokoll; kein generischer Alles-Editor.

### Neue Wave

Mit vorhandenen Enemy-Kinds kann eine Wave heute nahezu vollständig in `waveDefinitions.js` ergänzt werden. Der Code validiert die definierte Anzahl und verteilt XP-Budgets.

Urteil: **READY**, mit kleiner **CLEANUP** für Schema-/Fehlermeldungen und Käuferdokumentation.

### Neue Arena

Definitionen sind vorhanden, aber Rendering, Asset Keys, Hub-Poster, Streaming-Sonderfälle und einzelne Scene-Branches können weitere Änderungen erfordern.

Urteil: **CLEANUP** bis **REFACTOR**, abhängig davon, ob nur eine vorhandene Topologie neu befüllt oder eine neue Topologie eingeführt wird.

### Neuer Boss

Bossphasen und Sequenzschritte sind bereits datenähnlich modelliert. Die konkrete Bossdefinition sitzt jedoch in `WaveSystem`; Übergänge, Audio und visuelle Behandlung haben Boss-Sonderpfade.

Urteil: **REFACTOR**, aber kleiner als ein Neubau: Definition extrahieren, Step-Registry dokumentieren, Hooks statt Namensannahmen.

## 5. Tests und Qualitätsbelege

Vorhanden sind 35 `.mjs`-Testdateien mit rund 8.903 Zeilen. Die projektinternen Runner enthalten 716 direkte `assert(...)`-Aufrufe; Node-Test-Dateien verwenden zusätzlich `node:test`/`node:assert`. Die Suiten erzeugen an vielen Stellen Screenshots und prüfen Browserfehler.

Abgedeckte Bereiche:

- Boot, Combat, Restart und fehlende Assets
- Desktop, Portrait Mobile, Landscape Mobile und Rotation
- Touch/Joystick, Fullscreen, Settings und Pause/Resume
- Responsive Menüs, HUD und Run Report
- XP-Ökonomie, Multi-Level-Up, Upgrade-Cap, Chests und Pickups
- Waffenränge, Loadout-Slots, EVO-Rezepte und EVO-Laufzeitverhalten
- Wave-Komposition, Rollen, Adaptive Spawns und Targeting
- Arenen, Obstacles, Streaming und sichere Spawnpunkte
- Elites, Auras, Telegraphs, Projectiles und Bossphasen
- Meta-Progression, Mastery, Unlocks, Talente, Cosmetics und Run History
- Storage-Ausfall und Production-Iframe
- Pooling, hohe Objektzahlen, Frame-p95 und lange Soak-Szenarien
- Audio-Einstellungen und Product-Analytics-Consent
- Charakter-Sheet-/Pose-Invarianten

Framework-relevant und möglichst zu behalten:

- Run-State-/Pause-/Storage-Gates
- Input-/Viewport-/Responsive-Gates
- Pool-/Performance-/XP-Erhaltungs-Gates
- Wave-/Spawn-/Targeting-/Boss-Step-Gates
- Upgrade-/Loadout-/Evolution-Vertragsprüfungen
- Release-/Iframe-/Asset-Failure-Gates

Zu generalisieren:

- globale Test-API `__ROOSTER_TEST__`
- feste Erwartung von genau drei Roostern, neun Archetypen, zehn Waves oder bestimmten IDs
- Rooster-/Egg-spezifische Dateinamen und Assertions
- Release-Gate, das explizit frühere Rooster-Assetgenerationen verbietet
- Hilfsfunktion, die Serverbereitschaft anhand des Titels `Rooster Rage` erkennt

Risiko: Der normale Pages-CI-Workflow führt nur einen wertvollen, aber begrenzten Teil der vorhandenen Suite aus. Für das Verkaufsprodukt sollte es mindestens ein schnelles PR-Gate und ein vollständiges Release-Gate geben.

## 6. Build, Deployment, Mobile und Performance

### READY

- Vite-Build mit getrennten Output-Verzeichnissen
- portable relative Assetpfade für das Release
- eigener Pages-Prefix
- Ausschluss von Marketingmaterial im Game-only-Paket
- Production-Test ohne DEV-Test-API
- Iframe- und blockierter-Storage-Test
- Responsive Renderer mit Render-Scale- und Pixelbudget
- Desktop-/Touch-Input und Fokus-Pause
- Desktop-/Mobile-Enemy-Caps und XP-Orb-Caps
- Object Pools und Telemetrie für Drops/Peaks/Framezeiten

### CLEANUP

- `/RoosterRage/`, Paketname `rooster-arena`, HTML-Titel und Storage Keys neutralisieren/konfigurieren
- GitHub-Pages-Workflow auf Zielrepo/Demo-Pfad anpassen
- Marketplace-ZIP statt nur Browser-Dist definieren
- Node-/Browser-Supportmatrix dokumentieren
- CI in Fast/Full/Release gliedern
- echte Geräteabnahme auf aktuellem iOS/Android als Release-Kriterium festlegen

## 7. Save- und Meta-System

Das Save-System ist besser als bei vielen Templates:

- versionierter Meta-Key (`v2`)
- Migration von `v1`
- Sanitizing und Begrenzung von Zahlen/Listen/Rängen
- Graceful Fallback auf Session-Memory, wenn Local Storage nicht verfügbar ist
- Fortschritt für Runs, Siege, Kills, Boss, Mastery, Talente, Cosmetics, Challenge-Auswahl, Bestwerte und History

Offene Produktisierung:

- Storage-Namespace in Product Config verschieben
- Roster/Unlock/Cosmetics aus `MetaProgressionSystem` extrahieren
- Migration-API für spätere Käuferänderungen dokumentieren
- optionaler Save Export/Import als Support- und Debug-Werkzeug
- Versionierung und Backward-Compatibility-Vertrag dokumentieren

Urteil: **CLEANUP**, kein Neuaufbau.

## 8. Asset-Provenienz- und Lizenzmatrix

Dies ist ein technischer Lizenz-Audit, keine Rechtsberatung. `AUDIO_LICENSES.md` ist eine gute Grundlage, aber eine verkaufsfähige Source-Distribution benötigt beweisbare Akten und klare Ausschlüsse.

| Asset/Ordner | Herkunft laut Repository | Bekannte Lizenz/Rechte | Redistribution im Source-Produkt | Risiko | Vorgeschlagene Aktion |
| --- | --- | --- | --- | --- | --- |
| `src/assets/audio/**` externe Quellen | Freesound/OpenGameArt/Kenney, bearbeitete Derivate | in `AUDIO_LICENSES.md` jeweils als CC0 dokumentiert | grundsätzlich ja, sofern Quellenstatus zum Downloadzeitpunkt belegbar ist | niedrig–mittel | Quellen-URL, Originaldateiname, Hash, Abrufdatum und lokale Lizenzkopie pro Source archivieren; `THIRD_PARTY_NOTICES.md` erzeugen |
| `laser.wav`, `enemy-hit.wav`, `enemy-pop.wav` und Derivate | als „project-owned legacy masters“ bezeichnet | keine separate Eigentumsakte im Repo | unklar, bis Eigentum bestätigt ist | mittel | kurze Owner-Erklärung und Ursprungsdateien/Erstellungsnachweis in interner Provenienzakte ergänzen |
| Character Runtime/Source | Built-in ImageGen plus lokale deterministische Verarbeitung; Prompts und Produktionsnotizen vorhanden | generierter Content, aber keine dem Repo beigefügte Rechte-/Account-Dokumentation | wahrscheinlich nutzbar, aber für Template-Weitergabe gesondert zu bestätigen | mittel | pro Assetgruppe Generator, Datum, Account/Terms-Basis, Referenzbilder und Bearbeitung dokumentieren; Runtime behalten, Referenzbilder separat prüfen |
| Enemy Art | bestehende Sheets als Stil-/Identitätsreferenz, weitere Sheets per ImageGen/Chroma-Key | wie oben | wie oben | mittel | Provenienzmanifest je finalem Runtime-Asset und Source-Parent erstellen |
| Maps, Props, Projectiles, Pickups, FX, UI/EVO Icons | Built-in ImageGen und lokale Optimierung laut Produktionsdokumenten | wie oben | wie oben | mittel | Gruppenmanifest aus vorhandenen Produktionsdocs ableiten; finale Runtime-Dateien den erlaubten Parents zuordnen |
| `art-source/**/references/**`, Chat-Referenzen, Turnarounds | Bilder aus geteilten Chats bzw. Referenzketten | nicht für jede Datei eindeutig | nicht in Verkaufs-ZIP aufnehmen, solange nicht eindeutig geklärt | hoch | standardmäßig **EXCLUDE**; nur nach Herkunfts- und Weitergabebestätigung einbeziehen |
| `public/marketing/rooster-rage-key-art-master.png` | als originale, textfreie Marketingillustration bezeichnet; zugleich Stilreferenz vieler Assets | keine separate Lizenz-/Generierungsakte im Repo | als Produktmarketing plausibel; Source-Weitergabe nicht automatisch nötig | mittel | Herkunft/Generator/Referenzen dokumentieren; im Framework-ZIP nur falls als Demoasset ausdrücklich lizenziert |
| Runtime-WebP/MP3-Derivate | aus den oben genannten Quellen erzeugt | Rechte folgen den Sources | nur so sauber wie Parent-Provenienz | mittel | maschinenlesbares `ASSET_PROVENANCE.json` mit Parent, Hash, Lizenz und Package-Flag |
| Marketing-Screenshots und Gameplay-Video | echter Build-Inhalt | Rechte folgen allen sicht-/hörbaren Assets | nicht nötig für Käufer-Source; für Produktseite nutzbar, sobald Parents sauber sind | mittel | aus Standard-ZIP ausschließen; als internes/store-spezifisches Material behandeln |
| `docs/qa/**` | interne Screenshots/GIFs/Metriken | gemischte Ableitung aus Build und Referenzen | für Käufer unnötig | mittel | aus Standard-ZIP entfernen; intern archivieren |
| Systemfonts | Arial/Helvetica/Inter-Fallback ohne eingebettete Fontdatei | Betriebssystem-/Browserfonts | keine Fontdatei wird verteilt | niedrig | unverändert lassen; „Inter“ ist nur Fallbackname, nicht eingebettet |
| Phaser/Vite/Playwright und transitive Pakete | npm/Lockfile | überwiegend MIT/Apache-2.0/ISC/BSD; Lightning CSS MPL-2.0 | unter jeweiligen Bedingungen | niedrig–mittel | Third-party notices und Lizenztexte automatisiert aus Lockfile erzeugen; Runtime- und Dev-Abhängigkeiten trennen |

Kritischer Befund: Im Root des Originals existiert keine allgemeine `LICENSE`-Datei; GitHub meldet `NOASSERTION`. Das ist für das eigene Spiel nicht zwingend ein Laufzeitproblem, aber für ein verkauftes Source-Produkt ein Blocker. Es muss eine klare Käuferlizenz mit erlaubten Projekten, Seat-/Studio-Umfang, Redistribution-Verbot des Frameworks selbst, Update-/Supportumfang und Third-party-Ausnahmen geben.

## 9. Verkaufsreife-Klassifizierung

| Bereich | Status | Begründung |
| --- | --- | --- |
| Phaser/Vite-Bootstrap | CLEANUP | stabil, aber Produktname/Pfade/Config gebrandet |
| Run-State/Pause/Ende | READY | klare, getestete Zustände |
| Combat/Projectile Lifecycle | CLEANUP | reif; Content-IDs und Primärklassen-Branches extrahieren |
| Object Pools/Performance | READY | unmittelbarer Framework-Wert |
| Wave Definitions/Spawn Director/XP Budgets | READY | bereits stark datengetrieben |
| Characters | REFACTOR | Definition vorhanden, Erweiterung benötigt viele Core-Edits |
| Enemies/Elites | REFACTOR | Factory/Definitionen in `WaveSystem`, Assets separat hardcodiert |
| Boss | REFACTOR | gute datenähnliche Sequenzen, aber Definition und Hooks nicht getrennt |
| Upgrades/Loadout/EVO | REFACTOR | starke Systeme, aktive Inhalte noch registrierungsintensiv |
| Arenen/Streaming | CLEANUP | gute Definitionen, einige Renderer-/Asset-/UI-Sonderfälle |
| Meta/Save | CLEANUP | robust, aber Roster/IDs/Namespace hardcodiert |
| Desktop/Mobile/Input | READY | funktional und regressionsgeprüft |
| HUD/Menüs | CLEANUP | produktionsreif, aber monolithisch und stark gebrandet |
| Audio-System | READY | System reif; Assetnachweise und Event-Registry ergänzen |
| Analytics | CLEANUP | opt-in und datensparsam; als optionales Example-Modul markieren |
| Tests/Test API | CLEANUP | sehr wertvoll; Contracts und Example-spezifische Tests trennen |
| Build/Release/Pages | CLEANUP | solide; Marketplace- und Zielrepo-Profile fehlen |
| Käuferdokumentation | REPLACE | vorhandene Docs sind Produktionshistorie, keine Framework-Anleitung |
| Asset-Lizenzkette | REFACTOR | viel Provenienz vorhanden, aber keine vollständige redistributable Akte |
| Raw Art/QA/alte Preview-Generationen im Käuferpaket | REMOVE | intern wertvoll, aber groß, riskant und support-unfreundlich |

`REMOVE` bedeutet hier „aus dem Verkaufs-ZIP“, nicht „aus dem unveränderten Original-Repository löschen“.

## 10. Konkrete Framework-Gaps

1. Zentrale `game.config`/Product Manifest für Name, Storage Namespace, Default Arena, Roster, Theme, Limits und Feature Flags.
2. Character Registry mit Definition, Asset Manifest, Primary Strategy, Passive Hook und Upgrade Pool.
3. Enemy Registry mit Definition, Renderer/Animation Descriptor und wiederverwendbarer Behavior-/Ability-Kind-Zuordnung.
4. Ability Registry mit Lifecycle (`create`, `update`, `unlock`, `evolve`, `destroy`, `cooldownState`) statt manueller Verkabelung.
5. Evolution Recipes als eigener Katalog; Runtime Handler über Registries auflösen.
6. Asset Manifest/Loader, der neue Content ohne Editieren langer Importlisten registrierbar macht.
7. Boss Definition außerhalb `WaveSystem`; dokumentierter Katalog erlaubter Sequenzschritte.
8. Meta-Roster, Cosmetics und Unlocks in Daten verschieben.
9. Framework Contracts/Validation: Duplicate IDs, fehlende Assets, ungültige Rezepte, Wave Counts und unbekannte Handler beim Boot klar melden.
10. `framework/` versus `example/rooster-rage/` oder eine gleichwertige, weniger invasive Grenze.
11. Käuferorientierte Docs und Change Policy.
12. Standard-/Extended-Lizenz, Third-party Notices und vollständiges Asset-Provenienzmanifest.
13. Marketplace Packaging, das Raw Sources, Chat-Referenzen, QA-Captures und Marketing-Video standardmäßig ausschließt.
14. CI-Matrix mit Fast PR Gate, Full Regression und Release Package Gate.
15. Frischer Beispiel-Extension-Test: ein vierter Character, ein neuer Enemy und eine neue Ability nur über dokumentierte Registries.

## 11. Empfohlener Produktisierungsplan

### Phase A — Safe Import und unveränderte Baseline

Ziel: Originalgeschichte erhalten, Zielrepo als alleinige Arbeitsbasis etablieren.

Arbeit:

- geprüften Original-Commit in das Zielrepo importieren, ohne Original-Remote zu verändern
- Original als read-only/upstream Referenz dokumentieren
- Baseline-Tags und Branchschutz
- vollständigen Clean-Install-/Build-/Testbericht erzeugen
- Package-Inventar und Hashes festhalten

Acceptance Criteria:

- Originalrepo unverändert
- Zielrepo enthält reproduzierbar denselben spielbaren Stand
- `npm ci`, Standard-/Release-Build und definierte Baseline-Suite grün
- Demo verhält sich visuell und mechanisch wie das Original
- Audit-Commit und Asset-Hashes dokumentiert

Aufwand: **klein**, ca. 8–16 Stunden.

### Phase B — Lizenz- und Packaging-Grenze

Ziel: vor Refactors klären, was überhaupt verkauft werden darf und soll.

Arbeit:

- vollständiges `ASSET_PROVENANCE`-Inventar
- Audio-Quellenbelege lokal archivieren
- ImageGen-/Owner-Attestations ergänzen
- Referenz-/Chatbilder, Raw Art, QA und Marketing vom Käuferpaket trennen
- Third-party Notices und Produktlizenzentwurf
- reproduzierbares Source-ZIP-Allowlist-Skript

Acceptance Criteria:

- jede Datei im Verkaufs-ZIP hat `origin`, `license/rights`, `redistributable`, `risk`, `action`
- keine Datei mit `unknown`/`high risk` im Verkaufs-ZIP
- Third-party-Lizenztexte liegen bei
- Standard-Paket enthält keine internen Referenzbilder oder unnötigen 360-MB-Art-Source-Bestand
- Runtime-Demo bleibt vollständig

Aufwand: **mittel**, ca. 16–32 Stunden plus ggf. externe Rechtsprüfung oder Asset-Ersatz.

### Phase C — Product Config und Registries

Ziel: minimale, gezielte Extension Architecture ohne Rewrite.

Arbeit:

- Product/Game Manifest
- Character-, Enemy-, Ability-, Evolution- und Asset-Registries
- Bossdefinition extrahieren
- Meta-Roster/Unlock/Cosmetics datengetrieben machen
- Bootzeit-Validation und klare Fehler
- bestehende Inhalte unverändert über die Registries registrieren

Acceptance Criteria:

- vierter Character ohne Änderung bestehender Character-/Combat-Branches registrierbar
- neuer Enemy ohne Edit an `WaveSystem` registrierbar
- neue aktive Ability ohne Edit an zentralen Unlock/Evolve/Cooldown-Switches registrierbar
- neues EVO-Rezept referenziert registrierte Base/Passive/Handler
- ungültige IDs/Assets erzeugen verständliche Boot-/Buildfehler
- bestehende Mechanik und Balance bleiben regression-grün

Aufwand: **groß**, ca. 40–72 Stunden.

### Phase D — Framework/Example-Trennung und Branding

Ziel: Rooster Rage als enthaltenes Beispiel, nicht als Core-Identität.

Arbeit:

- stabile Grenze zwischen Core, Game Systems, Config und Example Content
- Branding, Texte, Storage Keys, Audio-/Asset-Namen und Analytics konfigurierbar
- Rooster-Begriffe aus Core-APIs entfernen, nicht zwanghaft aus Beispielcontent
- interne Labs/alte Preview-Seiten aus Produktpfad entfernen

Acceptance Criteria:

- Core kann mit einem neutralen Test-Manifest booten
- Beispielspiel bleibt vollständig Rooster Rage und vollständig spielbar
- Core enthält keine fachlich unnötigen Rooster-/Egg-/Henhouse-Annahmen
- Reskin benötigt primär Example-/Config-/Asset-Dateien
- keine große Datei-/Ordnerbewegung ohne Käufernutzen

Aufwand: **mittel–groß**, ca. 24–44 Stunden.

### Phase E — Test-Suite produktisieren

Ziel: Regressionen als Käufernutzen verständlich und wartbar machen.

Arbeit:

- Framework Contract Tests von Example Content Tests trennen
- Test-API neutral benennen
- feste Content-Anzahlen durch Registry-basierte Erwartungen ersetzen, wo sinnvoll
- `test:fast`, `test:full`, `test:release` definieren
- CI-Workflow und Testdokumentation

Acceptance Criteria:

- PR-Gate in vertretbarer Zeit
- Full Suite deckt Desktop, Portrait, Landscape, Combat, Save, Boss, Performance ab
- Example-spezifische Tests bleiben erhalten
- Käufer kann anhand einer Matrix erkennen, welcher Test nach welcher Änderung nötig ist
- Release nur bei grünem Package-/License-/Build-Gate

Aufwand: **mittel**, ca. 20–36 Stunden.

### Phase F — Käuferdokumentation und AI Development Guide

Ziel: typische Erweiterungen ohne Support-Ticket ermöglichen.

Dokumente:

- `README.md`
- `QUICK_START.md`
- `ARCHITECTURE.md`
- `ADD_CHARACTER.md`
- `ADD_ENEMY.md`
- `WEAPONS_AND_EVOLUTIONS.md`
- `WAVES_AND_BOSSES.md`
- `META_PROGRESSION.md`
- `MOBILE_AND_DESKTOP.md`
- `RESKIN_GUIDE.md`
- `DEPLOYMENT.md`
- `AI_DEVELOPMENT_GUIDE.md`
- `LICENSE.md`, `THIRD_PARTY_NOTICES.md`, `CHANGELOG.md`

Acceptance Criteria:

- frischer Entwickler kann installieren, bauen und die Demo starten
- Character-/Enemy-/Wave-/Weapon-Tutorials funktionieren auf Clean Checkout
- AI Guide nennt Invarianten, Extension Points, gekoppelte Systeme und Testmatrix
- keine Doku verweist auf interne lokale Pfade oder nicht mitgelieferte Quellen
- Supportgrenzen und Updatepolitik sind klar

Aufwand: **mittel–groß**, ca. 28–48 Stunden.

### Phase G — Demo, Marketplace-Paket und Release QA

Ziel: verkaufbares, prüfbares Produktartefakt.

Arbeit:

- öffentliche Demo aus demselben Source-Tree
- reproduzierbares Source-/Docs-/Demo-Paket
- Marketplace-README, Changelog, Lizenzwahl und Versionsnummer
- Clean-machine-Test, Windows/macOS/Linux-Dokumentation
- reale Desktop-/Mobile-Geräteabnahme
- Verkaufsseiten-Beweise und Screenshots aus dem finalen Paket

Acceptance Criteria:

- Demo und Verkaufs-Source verwenden denselben Framework-Code
- Clean Install/Build/Test aus dem entpackten Käufer-ZIP
- keine Secrets, lokale Pfade, Raw References oder nicht lizenzierte Assets
- Desktop, Portrait Mobile und Landscape Mobile funktionsfähig
- vollständiger Run inklusive EVO, Elite, Boss, Ende und Meta-Save
- ZIP-Größe und Plattformlimits dokumentiert
- Versions-/Updatepfad getestet

Aufwand: **mittel–groß**, ca. 28–48 Stunden.

## 12. Gesamtaufwand

Ohne ungeplante Asset-Neuproduktion: **ca. 164–296 Stunden** brutto über alle Phasen. Durch Überlappung und Nutzung der vorhandenen Systeme ist ein realistischer Zielkorridor **etwa 150–240 Stunden**, also ungefähr vier bis sieben Vollzeitwochen für eine erfahrene Person.

Zusätzliche mögliche Aufwände:

- 20–60 Stunden, falls visuelle Assets wegen unklarer Provenienz ersetzt werden müssen
- externe Rechtsprüfung für Produktlizenz/Assetweitergabe
- 8–16 Stunden echte Geräte-QA und Korrekturschleife

Eine erste seriöse 79–99-USD-Version muss nicht jeden denkbaren Plugin-Punkt besitzen. Sie braucht jedoch mindestens die Phasen A bis F sowie einen sauberen Release-Teil von G. Charakter-, Enemy- und Ability-Extension Paths, Lizenzsauberkeit, Dokumentation und reproduzierbare QA sind für dieses Preisniveau nicht optional.

## 13. Größte Risiken in Prioritätsreihenfolge

1. **Asset-Weitergaberechte:** Nutzung in einem fertigen Spiel ist nicht automatisch identisch mit Weitergabe in einem Source-/Template-Produkt.
2. **Über-Refactor:** Die funktionierende Balance und die breite Regression-Suite können durch unnötige Architekturästhetik beschädigt werden.
3. **Scheinbare Datengetriebenheit:** Definitionen existieren, aber wichtige Registrierungen sind über mehrere Core-Dateien verteilt.
4. **Testillusion:** Viele Tests existieren, aber nicht alle laufen im normalen CI und viele sind an Beispielcontent gekoppelt.
5. **Paketgröße und interne Artefakte:** Rund 360 MB Raw Art und 78 MB Docs/QA gehören nicht ungefiltert in ein Standardprodukt.
6. **Supportlast:** Ohne task-basierte Doku führen neue Characters/Weapons regelmäßig zu Fragen über Loader, Animation, Meta und Tests.
7. **Lizenz-/Produktversprechen:** Keine Root-Lizenz und noch keine klare Standard-/Studio-Regelung.
8. **Brand/Core-Vermischung:** Blindes Suchen-und-Ersetzen wäre riskant; Branding muss über Config und Example-Grenzen gelöst werden.

## 14. Produktbezeichnung

Empfohlene Produktbezeichnung:

**Phaser Survivor Framework — Complete Bullet Heaven Game Foundation**

Begründung:

- `Phaser Survivor Framework` ist für Suche und sofortiges Verständnis stark.
- `Complete ... Game Foundation` beschreibt den tatsächlichen Wert besser als ein reines Code-Framework: vollständiges Beispielspiel, Progression, Boss, Saves, responsive UI, Tests und Release-Pipeline.
- Nur `Framework` wäre im aktuellen Zustand etwas zu weitgehend, solange Character/Enemy/Ability noch keine stabilen Registries besitzen.
- `Template` sollte nicht die Hauptbezeichnung sein; es signalisiert ein deutlich kleineres und preisgünstigeres Produkt.

Kurzform für Marktplätze nach Abschluss der Produktisierung:

> **Phaser Survivor Framework**  
> A complete, tested bullet-heaven game foundation with a production-quality example game.

## 15. Go/No-Go für den nächsten Schritt

**Go für Produktisierung**, aber nicht für sofortigen Verkauf.

Der technische Vermögenswert ist real und rechtfertigt den angestrebten Preisbereich nach Produktisierung. Der nächste sinnvolle Schritt ist Phase A, unmittelbar gefolgt von Phase B. Erst wenn die Asset-Allowlist feststeht, sollten Registries und Example-Grenzen umgesetzt werden; andernfalls wird möglicherweise Content refaktoriert, der später gar nicht in das Verkaufsprodukt darf.

Keine Empfehlung für:

- kompletten Rewrite,
- Engine-Wechsel,
- TypeScript-Migration nur aus Stilgründen,
- Entfernung des vollständigen Beispielspiels,
- pauschalen Austausch hochwertiger Assets,
- monatelange generische Plugin-Architektur.

Empfohlen wird eine konservative Extraktion: bestehendes Verhalten unverändert registrieren, durch Contract Tests absichern und nur dort abstrahieren, wo Käufer tatsächlich Character, Enemy, Weapon, Wave, Boss, Arena, Meta oder Branding erweitern müssen.
