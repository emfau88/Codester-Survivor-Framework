# Umsetzungsplan — Phaser Survivor Framework

Letzte Aktualisierung: 22. September 2026  
Status: **Plan erstellt — Phase A ist der nächste Arbeitsschritt**  
Technische Grundlage: [`AUDIT_PHASE_1.md`](./AUDIT_PHASE_1.md)

## Verwendung dieses Dokuments

Dieses Dokument ist die verbindliche Arbeitsliste für die Produktisierung. Es wird während der Umsetzung fortlaufend aktualisiert.

Regeln:

- `[ ]` offen
- `[x]` abgeschlossen und verifiziert
- `[-]` bewusst verworfen; die Begründung wird direkt am Punkt dokumentiert
- Ein Phasen-Checkbox wird erst abgehakt, wenn alle Acceptance Criteria der Phase erfüllt sind.
- Nach jeder Arbeitssitzung werden **Aktueller Fokus**, **Entscheidungen**, **Risiken** und **Änderungsprotokoll** aktualisiert.
- Refactors werden klein gehalten und durch bestehende Tests abgesichert.
- Das Originalrepository `RoosterRage` wird niemals als Arbeits- oder Push-Ziel verwendet.
- Neue Abstraktionen benötigen einen konkreten Käufernutzen: Erweiterbarkeit, Wartbarkeit, Lizenzsauberkeit, Dokumentation oder Packaging.
- Beispielcontent darf Rooster-Rage-spezifisch bleiben. Framework-Core darf keine unnötigen Rooster-/Egg-/Henhouse-Annahmen enthalten.

## Aktueller Fokus

- **Nächste Phase:** A — Safe Import und unveränderte Baseline
- **Nächster konkreter Schritt:** Audit und Umsetzungsplan auf der importierten Baseline committen und ausschließlich zum Zielremote pushen
- **Blocker:** keiner
- **Codeänderungen begonnen:** nein

## Zielzustand

Das Zielrepository liefert ein kommerziell verkaufbares:

> **Phaser Survivor Framework — Complete Bullet Heaven Game Foundation**

Das Paket enthält:

- einen stabilen Framework-Core,
- klar dokumentierte Content-Registries,
- das vollständige Rooster-Rage-Beispielspiel,
- Desktop-, Portrait- und Landscape-Unterstützung,
- Save-/Meta-Progression,
- eine verständliche Regression-Suite,
- eine direkt spielbare Demo aus demselben Code,
- eine rechtlich und technisch definierte Asset-Allowlist,
- Käuferdokumentation und AI Development Guide,
- ein reproduzierbares Marketplace-ZIP.

## Globale Definition of Done

Das Produkt gilt erst als verkaufsbereit, wenn alle folgenden Punkte erfüllt sind:

- [ ] Das Originalrepository wurde nicht verändert.
- [ ] Das Zielrepository besitzt eine nachvollziehbare, eigenständige Git-Historie.
- [ ] Clean Install, Build und Release-Paket funktionieren aus einem frischen Checkout.
- [ ] Das vollständige Beispielspiel bleibt spielbar.
- [ ] Ein Character kann über dokumentierte Extension Points ergänzt werden.
- [ ] Ein Enemy kann ohne Änderung an `WaveSystem` registriert werden.
- [ ] Eine aktive Ability kann ohne zentrale Unlock-/Evolve-Switches ergänzt werden.
- [ ] Waves mit vorhandenen Content-IDs bleiben rein datengetrieben.
- [ ] Bossphasen und Bosssequenzen sind als Definition konfigurierbar.
- [ ] Mobile Portrait, Mobile Landscape und Desktop sind regressionsgeprüft.
- [ ] Saves überleben reguläre Versionsupdates oder werden sauber migriert.
- [ ] Jede Datei im Verkaufs-ZIP besitzt eine geklärte Herkunft und Weitergabeberechtigung.
- [ ] Es gibt keine unbekannten oder hochriskanten Assets im Verkaufs-ZIP.
- [ ] Framework- und Example-spezifische Tests sind unterscheidbar.
- [ ] Käuferdokumentation wurde auf einem frischen Checkout praktisch validiert.
- [ ] Demo und Verkaufsprodukt verwenden denselben Framework-Code.
- [ ] Produktlizenz, Third-party Notices, Supportumfang und Updatepolitik sind enthalten.

---

# Phase 0 — Audit und Arbeitsgrundlage

Status: **abgeschlossen**

- [x] Originalrepository und leeres Zielrepository verifiziert.
- [x] Aktuellen Original-Commit festgehalten: `5e9fc5879ff322d73c5b8267aa3b0e5cd14a5419`.
- [x] Architektur, Systeme, Config, Tests, Build, Deployment, Saves und Mobile/Desktop untersucht.
- [x] Hardcodierte Character-, Enemy-, Ability-, Boss-, Asset- und Meta-Kopplungen identifiziert.
- [x] Vorläufige Asset-/Lizenzmatrix erstellt.
- [x] Verkaufsreife pro Bereich klassifiziert.
- [x] Aufwand und Risikoreihenfolge dokumentiert.
- [x] Auditbericht im Zielrepository erstellt.
- [x] Checkbox-basierten Umsetzungsplan erstellt.

Acceptance Criteria:

- [x] `AUDIT_PHASE_1.md` liegt im Zielrepository.
- [x] Original-Checkout ist unverändert.
- [x] Noch keine Spielcode- oder Assetänderung wurde durchgeführt.

---

# Phase A — Safe Import und Baseline

Ziel: Das vorhandene Spiel unverändert und mit Historie in das Zielrepository übernehmen, bevor Produktisierung beginnt.

Geschätzter Aufwand: **8–16 Stunden**

## A1 — Git-Sicherheitsgrenze

- [x] Aktuelle Remotes und Branches des Zielrepositories dokumentieren.
- [x] Originalrepository als `upstream` nur für Fetch eintragen.
- [x] Push-URL für `upstream` deaktivieren oder auf einen nicht pushbaren Wert setzen.
- [x] Original-`master` inklusive Historie in das Zielrepository fetchen.
- [x] Ziel-`main` vom geprüften Original-Commit erstellen.
- [x] Sicherstellen, dass `origin` ausschließlich auf `codester-survivor-framework` zeigt.
- [x] Sicherstellen, dass kein Command im Arbeitsablauf zum Original pushen kann.
- [ ] Audit- und Plan-Datei auf die importierte Historie übernehmen.

## A2 — Unveränderte technische Baseline

- [ ] `npm ci` auf frischem Checkout ausführen.
- [ ] `npm run assets:check` ausführen.
- [ ] `npm run build` ausführen.
- [ ] `npm run build:release` ausführen.
- [ ] `npm run test:production` ausführen.
- [ ] `npm run test:smoke` ausführen.
- [ ] `npm run test:mechanics` ausführen.
- [ ] `npm run test:product` ausführen.
- [ ] `npm run test:release` ausführen.
- [ ] Vorhandene Full-Suite-Kommandos inventarisieren und Laufzeiten protokollieren.
- [ ] Baseline-Screenshots für Desktop, Portrait und Landscape erzeugen.
- [ ] Testresultate und bekannte Warnungen in `docs/framework/BASELINE.md` dokumentieren.

## A3 — Baseline einfrieren

- [ ] Baseline-Tag definieren, z. B. `rooster-rage-baseline-2026-09-21`.
- [ ] Baseline-Tag im Zielrepository erstellen.
- [ ] Baseline-Commit und Tag zum Zielrepository pushen.
- [ ] Branchschutz-/PR-Regeln für `main` definieren.
- [ ] CI im Zielrepository zunächst unverändert zum Laufen bringen.
- [ ] Öffentliche Demo erst nach erfolgreicher Ziel-CI umschalten.

Acceptance Criteria:

- [ ] Originalrepository ist unverändert und technisch nicht als Push-Ziel verwendbar.
- [ ] Zielrepository enthält alle 115 Baseline-Commits.
- [ ] Der Ziel-`main` basiert nachweislich auf `5e9fc…`.
- [ ] Der vollständige bestehende Build läuft im Zielrepository.
- [ ] Baseline-Testset ist grün oder Abweichungen sind exakt dokumentiert.
- [ ] Demo sieht aus und spielt sich wie vor dem Import.

Abbruchbedingung:

- Bei funktionalen Abweichungen keine Produktisierung beginnen; zuerst Baseline wiederherstellen.

---

# Phase B — Asset-Lizenzierung und Packaging-Grenze

Ziel: Vor Architekturarbeiten verbindlich festlegen, welche Inhalte verkauft werden dürfen und welche intern bleiben.

Geschätzter Aufwand: **16–32 Stunden**, ohne Ersatzproduktion

## B1 — Maschinenlesbares Asset-Inventar

- [ ] Alle Runtime-Assets unter `src/assets/` inventarisieren.
- [ ] Alle Quellen unter `art-source/` inventarisieren.
- [ ] Marketing-, QA- und Referenzassets separat inventarisieren.
- [ ] Für jede Datei SHA-256, Größe, Typ und Parent/Derivative-Beziehung erfassen.
- [ ] `ASSET_PROVENANCE.json` oder gleichwertiges Format definieren.
- [ ] Pflichtfelder festlegen: `path`, `origin`, `creator/tool`, `source`, `license`, `redistributable`, `package`, `risk`, `notes`.
- [ ] Validierungsskript für fehlende oder doppelte Einträge hinzufügen.

## B2 — Audio-Nachweise

- [ ] Einträge aus `AUDIO_LICENSES.md` in das Provenienzformat übertragen.
- [ ] Original-URLs und Abrufdatum prüfen.
- [ ] Originaldateinamen und vorhandene Author-Metadaten sichern.
- [ ] Lizenznachweis oder lokale Lizenzkopie für jede externe Quelle archivieren.
- [ ] Eigentumsnachweis für `laser.wav`, `enemy-hit.wav` und `enemy-pop.wav` ergänzen.
- [ ] Audio-Derivate eindeutig ihren Quellen zuordnen.

## B3 — ImageGen- und Projekt-Assets

- [ ] Character-Assets ihren Produktionsnotizen und Prompts zuordnen.
- [ ] Enemy-Assets ihren Produktionsnotizen und Parent-Sheets zuordnen.
- [ ] Map-, Projectile-, Pickup-, FX- und UI-Assets zuordnen.
- [ ] Key-Art-Herkunft und Rechtebasis dokumentieren.
- [ ] Built-in-ImageGen-Nutzung, Erstellungsdatum und Account-/Terms-Basis festhalten.
- [ ] Referenzbilder aus Chats und unbekannter Herkunft als `exclude` markieren.
- [ ] Prüfen, ob Runtime-Derivate ohne mitgelieferte Raw References reproduzierbar sein müssen.

## B4 — Third-party Software

- [ ] Runtime- und Dev-Abhängigkeiten aus `package-lock.json` trennen.
- [ ] Phaser- und weitere Runtime-Lizenzen beilegen.
- [ ] Vite-/Playwright-/Buildtool-Lizenzen für Source-Paket dokumentieren.
- [ ] MPL-Abhängigkeiten und deren konkrete Distributionsform prüfen.
- [ ] `THIRD_PARTY_NOTICES.md` generieren.
- [ ] Automatisierten License-Report als Release-Gate hinzufügen.

## B5 — Verkaufs-ZIP-Allowlist

- [ ] Standardmäßig erlaubte Verzeichnisse definieren.
- [ ] `art-source/**/references/**` ausschließen.
- [ ] interne `docs/qa/**`-Captures ausschließen.
- [ ] alte Character-Generationen und Preview-Labs aus dem Käuferpaket ausschließen.
- [ ] Marketingvideo und Store-Screenshots aus dem Source-ZIP ausschließen.
- [ ] benötigte Runtime-Assets vollständig einschließen.
- [ ] optionales separates Source-Art-Paket bewerten.
- [ ] reproduzierbares Packaging-Skript erstellen.
- [ ] Packaging-Skript gegen Allowlist und Provenienzmanifest prüfen.

## B6 — Produktlizenz-Entscheidung

- [ ] Standard-/Indie-Lizenzumfang definieren.
- [ ] Extended-/Studio-Lizenzumfang definieren.
- [ ] Anzahl erlaubter Endprodukte und Team-/Seat-Regel festlegen.
- [ ] Weiterverkauf oder Redistribution des Frameworks selbst verbieten.
- [ ] Nutzung generierter Example-Assets in Käuferprojekten ausdrücklich regeln.
- [ ] Support-, Bugfix- und Updateumfang definieren.
- [ ] Haftungs-/Gewährleistungstext rechtlich prüfen lassen.
- [ ] Marketplace-Lizenzregeln mit eigener Lizenz abstimmen.

Acceptance Criteria:

- [ ] Jede Datei im Verkaufs-ZIP hat einen Provenienzeintrag.
- [ ] Kein `unknown`- oder `high risk`-Asset wird ausgeliefert.
- [ ] Alle externen Audioquellen besitzen nachvollziehbare CC0-Nachweise.
- [ ] ImageGen- und Projektassets besitzen eine dokumentierte Rechtebasis.
- [ ] Third-party Notices sind vollständig.
- [ ] Standard-ZIP enthält keine Raw References, QA-Captures oder Marketingvideos.
- [ ] Produktlizenz und Marketplace-Lizenz widersprechen sich nicht.

Entscheidungstor:

- [ ] **GO:** Runtime-Assetset darf vollständig verkauft werden.
- [ ] **CONDITIONAL GO:** Einzelne klar benannte Assets müssen ersetzt werden.
- [ ] **NO GO:** Rechtekette des Beispielspiels ist nicht ausreichend belegbar.

---

# Phase C — Sicherheitsnetz und Konfigurationsfundament

Ziel: Bestehendes Verhalten absichern und eine neutrale Product Config einführen, bevor Registries extrahiert werden.

Geschätzter Aufwand: **12–24 Stunden**

## C1 — Framework-Invarianten

- [ ] Unveränderliche Gameplay-Invarianten dokumentieren.
- [ ] Run-State-Übergänge dokumentieren.
- [ ] Save-/Migration-Invarianten dokumentieren.
- [ ] XP-Erhaltung und Pool-Limits dokumentieren.
- [ ] Mobile-/Desktop-Grenzwerte dokumentieren.
- [ ] Boss-Step- und EVO-Verträge dokumentieren.
- [ ] Für jede Invariante mindestens einen bestehenden Regressionstest zuordnen.

## C2 — Product Config

- [ ] Konfigurationsschema für Produktname, HTML-Titel und Version definieren.
- [ ] Storage-Namespace konfigurierbar machen.
- [ ] Default Arena, Default Challenge und Start-Content konfigurierbar machen.
- [ ] Feature Flags für Analytics, Meta, Cosmetics und Demo-Hilfen definieren.
- [ ] Renderer-/Performance-Defaults dokumentieren.
- [ ] Bestehende Rooster-Rage-Werte als Example Config übernehmen.
- [ ] Bestehende Save Keys migrationssicher weiter unterstützen.

## C3 — Registry-Grundtyp und Validation

- [ ] Gemeinsames ID-/Duplicate-Validation-Verhalten definieren.
- [ ] Fehlende Referenzen mit verständlichen Fehlermeldungen ablehnen.
- [ ] Registry-APIs bewusst klein halten.
- [ ] Registries vor Scene-Start validieren.
- [ ] DEV-Diagnosebericht über registrierten Content bereitstellen.
- [ ] Production-Build ohne Debug-/Testdaten sicherstellen.

Acceptance Criteria:

- [ ] Rooster Rage läuft ausschließlich über die neue Product Config ohne Verhaltensänderung.
- [ ] Alter Save-Stand wird weiterhin geladen.
- [ ] Doppelte IDs und fehlende Referenzen schlagen früh und verständlich fehl.
- [ ] Bestehende Baseline-Tests bleiben grün.

---

# Phase D — Content Registries und Extension Points

Ziel: Die typischen Käuferaufgaben ermöglichen, ohne das Projekt neu zu schreiben.

Geschätzter Aufwand: **40–72 Stunden**

## D1 — Enemy Registry

- [ ] Enemy-Definitionen aus `WaveSystem` extrahieren.
- [ ] Normal Enemy, Elite, Champion und Boss als Definitionstypen modellieren.
- [ ] Stats, Visuals, Collider, Animationen, Ability, Aura und Drops beschreiben.
- [ ] Bestehende `make...()`-Ergebnisse unverändert in Definitionen übertragen.
- [ ] `WaveSystem.makeEnemyFromSpec()` auf Registry-Auflösung umstellen.
- [ ] Challenge-Modifikatoren kompatibel halten.
- [ ] Enemy-Lexikon aus Registry-Daten erzeugen.
- [ ] Beispiel-Enemy ausschließlich über Registry hinzufügen.

Verifikation:

- [ ] `test:encounter`
- [ ] `test:arena`
- [ ] `test:spawn-targeting`
- [ ] `test:adaptive-spawns`
- [ ] `test:pressure`
- [ ] `test:mechanics`

## D2 — Boss Definition

- [ ] Boss-Stats aus `WaveSystem` entfernen.
- [ ] Bossphasen, Sequenzen, Übergänge und Add-Gruppen als Definition modellieren.
- [ ] erlaubte Boss-Step-Kinds dokumentieren.
- [ ] unbekannte Boss-Step-Kinds validieren.
- [ ] Audio-/Banner-/Transition-Hooks registrierbar machen.
- [ ] Brood King als Example-Boss registrieren.
- [ ] minimalen zweiten Testboss ohne neue Core-Branches definieren.

Verifikation:

- [ ] `test:boss`
- [ ] `test:boss-matrix`
- [ ] `test:encounter`
- [ ] `test:mechanics`

## D3 — Ability Registry

- [ ] Lifecycle-Vertrag definieren: `create`, `update`, `unlock`, `evolve`, `cooldownState`, `destroy`.
- [ ] bestehende Timed Abilities registrieren.
- [ ] Companion Abilities in denselben Auflösungsweg integrieren oder klaren Subtyp definieren.
- [ ] manuelle Imports/Instanziierungen in `ActiveAbilitySystem` entfernen.
- [ ] Unlock-Methoden pro Ability durch generischen Dispatch ersetzen.
- [ ] Evolution-Switch durch Registry-Auflösung ersetzen.
- [ ] Cooldown-Snapshot aus registrierten Abilities erzeugen.
- [ ] Test API aus Registry-Zustand speisen.
- [ ] neue Test-Ability ohne Änderung am zentralen System registrieren.

Verifikation:

- [ ] `test:evolution`
- [ ] `test:weapon-progression`
- [ ] `test:mechanics`
- [ ] `test:foundation`
- [ ] `test:rooster-depth`

## D4 — Evolution Registry

- [ ] EVO-Rezepte in eigenen Katalog verschieben.
- [ ] Base Weapon, Passive, Handler und Visuals validieren.
- [ ] Primary- und Active-Evolutions über denselben Rezeptpfad auflösen.
- [ ] EVO-Entdeckung und Meta-Anzeige aus Registry erzeugen.
- [ ] Upgrade-System behält Auswahl- und Rank-Verhalten unverändert.
- [ ] ungültige oder zyklische Rezepte ablehnen.

Verifikation:

- [ ] alle elf vorhandenen EVOs funktionieren unverändert.
- [ ] EVO-Texte und Loadout-Snapshots bleiben korrekt.
- [ ] `test:evolution`
- [ ] `test:weapon-progression`
- [ ] `test:meta`

## D5 — Character Registry

- [ ] Character-Definition um Primary Strategy/Handler ergänzen.
- [ ] Character Asset Manifest und Animation Descriptor zuordnen.
- [ ] Passive Hooks explizit modellieren.
- [ ] Primary Targeting aus `roosterId`-Branches lösen.
- [ ] Primary Impact/Feedback aus ID-RegEx lösen.
- [ ] Audio-Key datengetrieben machen.
- [ ] Sprite-Mirroring und Richtungsbesonderheiten in Visual Descriptor verschieben.
- [ ] Upgrade Pool, Class Upgrades und Primary EVO validieren.
- [ ] Meta Unlock/Mastery/Cosmetics aus Registry erzeugen.
- [ ] vierten Test-Character ohne Änderung bestehender Character-Branches ergänzen.

Verifikation:

- [ ] `test:character-lab`
- [ ] `test:rooster-depth`
- [ ] `test:weapon-progression`
- [ ] `test:acceptance`
- [ ] `test:smoke`

## D6 — Asset Registry

- [ ] Asset-Descriptor für Image, Spritesheet, Audio und Atlas definieren.
- [ ] lange manuelle Loaderlisten schrittweise in Manifeste überführen.
- [ ] Animationen an Content Descriptor statt globale Key-Listen binden.
- [ ] Asset-Key-Kollisionen validieren.
- [ ] fehlende Runtime-Dateien im Build erkennen.
- [ ] Release-Build lädt ausschließlich verwendete/erlaubte Assets.
- [ ] DEV- und Release-Assetpfade vereinheitlichen, soweit risikolos.

Verifikation:

- [ ] `assets:check`
- [ ] `build`
- [ ] `build:release`
- [ ] `test:production`
- [ ] `test:release`
- [ ] Missing-Asset-Szenario im Smoke-Test bleibt korrekt.

## D7 — Meta Content Registry

- [ ] Character-IDs aus `MetaProgressionSystem` entfernen.
- [ ] Unlock-Regeln in Definitionen verschieben.
- [ ] Cosmetics in eigenen Datenkatalog verschieben.
- [ ] Challenge-, Talent- und Reward-Definitionen vereinheitlichen.
- [ ] Save-Sanitizing anhand registrierter IDs durchführen.
- [ ] Save-Migration für entfernte oder umbenannte Content-IDs dokumentieren.

Verifikation:

- [ ] `test:meta`
- [ ] bestehende v1→v2-Migration bleibt grün.
- [ ] alte Rooster-Rage-Saves bleiben lesbar.

Acceptance Criteria Phase D:

- [ ] Neuer Enemy ohne Edit an `WaveSystem`.
- [ ] Neue Ability ohne Edit an zentralen Unlock/Evolve/Cooldown-Switches.
- [ ] Neuer Character ohne `roosterId`-Branch in Combat oder Player.
- [ ] Neue Wave mit bestehenden IDs nur über Definition.
- [ ] Neuer Boss primär über Definition und dokumentierte Step-Kinds.
- [ ] Bestehender Content verhält sich unverändert.
- [ ] Kein Registry-Refactor senkt die vorhandene Testabdeckung.

---

# Phase E — Framework-/Example-Trennung und neutrales Branding

Ziel: Rooster Rage bleibt als vollständiges Beispielspiel erhalten; der Core wird neutral verwendbar.

Geschätzter Aufwand: **24–44 Stunden**

## E1 — Strukturentscheidung

- [ ] Nach Abschluss der Registries tatsächliche Importabhängigkeiten analysieren.
- [ ] Kleinste sinnvolle Ordnergrenze festlegen.
- [ ] Entscheiden zwischen physischer Trennung und stabiler logischer Modulgrenze.
- [ ] Entscheidung in `ARCHITECTURE.md` begründen.
- [ ] Keine Massenverschiebung nur aus optischen Gründen durchführen.

Vorzugsrichtung, nur wenn durch Abhängigkeiten bestätigt:

```text
src/
  framework/
    core/
    combat/
    enemies/
    progression/
    meta/
    input/
    ui/
    save/
  example/
    rooster-rage/
      config/
      content/
      assets/
```

## E2 — Branding-Konfiguration

- [ ] Produktname und HTML-Metadaten aus Product Config beziehen.
- [ ] Storage Keys namespacen und migrieren.
- [ ] Pages Base Path konfigurierbar machen.
- [ ] Analytics Event Context neutralisieren.
- [ ] Test-Global `__ROOSTER_TEST__` neutral benennen.
- [ ] Asset-/Audio-Namen nur dort neutralisieren, wo sie Core-API sind.
- [ ] Example-Texte, Rooster-Namen und Egg-Content ausdrücklich erhalten.

## E3 — Neutraler Contract Fixture

- [ ] Minimales neutrales Test-Manifest erstellen.
- [ ] Neutraler Fixture-Character, Enemy, Ability und eine Wave.
- [ ] Fixture verwendet einfache Testassets, nicht das verkaufte Example-Artset.
- [ ] Framework bootet mit Fixture ohne Rooster-Rage-Module.
- [ ] Fixture wird nur für Contract Tests verwendet, nicht als neue Verkaufsdemo.

## E4 — Interne Inhalte aus Produktpfad entfernen

- [ ] Character Labs als internes Dev Tool markieren oder aus Paket ausschließen.
- [ ] alte Preview-HTML-Dateien aus Käuferpaket ausschließen.
- [ ] Produktionspläne und Session-TODOs aus Käuferpaket ausschließen.
- [ ] QA-Captures und alte Assetgenerationen intern belassen, aber nicht ausliefern.
- [ ] Marketingmaterial getrennt halten.

Acceptance Criteria:

- [ ] Framework-Core bootet mit neutralem Fixture.
- [ ] Rooster Rage bootet als Example Config über denselben Core.
- [ ] Core enthält keine unnötigen Rooster-/Egg-/Henhouse-Annahmen.
- [ ] Rooster-Rage-Beispiel verliert keine Inhalte oder Persönlichkeit.
- [ ] Storage-Migration erhält bestehende Nutzerstände.

---

# Phase F — Test-Suite produktisieren

Ziel: Aus der bestehenden Regression-Suite ein verständliches Käufer- und Release-Werkzeug machen.

Geschätzter Aufwand: **20–36 Stunden**

## F1 — Testklassen

- [ ] Tests als `framework`, `example`, `visual`, `performance` und `release` klassifizieren.
- [ ] Testmatrix mit Zweck, Laufzeit und Trigger dokumentieren.
- [ ] Framework Contract Tests auf neutralem Fixture ausführen.
- [ ] Example Content Tests für Rooster Rage erhalten.
- [ ] visuelle/assetbezogene Tests klar als Example Tests kennzeichnen.

## F2 — Käuferfreundliche Scripts

- [ ] `npm run test:fast` definieren.
- [ ] `npm run test:framework` definieren.
- [ ] `npm run test:example` definieren.
- [ ] `npm run test:full` definieren.
- [ ] `npm run test:release` beibehalten/erweitern.
- [ ] lange Soak-/Balance-Läufe separat halten.
- [ ] Exit Codes und Artefaktpfade vereinheitlichen.

## F3 — CI

- [ ] PR-CI für Install, Asset Validation, Build und Fast Tests.
- [ ] Full Regression für Release/Manual Dispatch.
- [ ] Performance-/Soak-Gate für Release Candidate.
- [ ] License-/Provenance-/Package-Gate integrieren.
- [ ] fehlgeschlagene Screenshots und Reports als Artefakte hochladen.
- [ ] CI-Dauer messen und dokumentieren.

## F4 — Content-feste Assertions generalisieren

- [ ] feste Erwartung „drei Rooster“ nur in Example Tests behalten.
- [ ] feste Erwartung „zehn Waves“ nur in Example Tests behalten.
- [ ] Registry-basierte Erwartungen in Framework Tests nutzen.
- [ ] Serverbereitschaft nicht am Titel `Rooster Rage` erkennen.
- [ ] Release-Gate nicht an konkrete alte Rooster-Dateinamen koppeln.
- [ ] Test API aus neutralen Registry-Daten speisen.

Acceptance Criteria:

- [ ] Käufer versteht, welchen Test er nach welcher Änderung ausführen muss.
- [ ] Fast Suite eignet sich für normalen Entwicklungsfluss.
- [ ] Full Suite schützt den kompletten Example-Run.
- [ ] Release-Gate prüft Build, Package, Assets, Lizenzen und Production Safety.
- [ ] bestehende wichtige Regressionen wurden nicht entfernt.

---

# Phase G — Käuferdokumentation

Ziel: Ein Käufer kann installieren, verstehen, erweitern, reskinnen, testen und deployen, ohne den gesamten Core zu lesen.

Geschätzter Aufwand: **28–48 Stunden**

## G1 — Einstieg

- [ ] `README.md` neu auf Produktnutzen und Einstieg ausrichten.
- [ ] `QUICK_START.md` erstellen.
- [ ] Voraussetzungen und unterstützte Node-/Browser-Versionen angeben.
- [ ] Install, Dev Server, Build und Test dokumentieren.
- [ ] Example Game klar als enthaltene Implementierung kennzeichnen.

## G2 — Architektur

- [ ] `ARCHITECTURE.md` erstellen.
- [ ] Composition Root und Systemgrenzen erklären.
- [ ] Config-/Registry-Fluss visualisieren.
- [ ] Runtime Lifecycle erklären.
- [ ] Save-, Event-, Asset- und Testgrenzen dokumentieren.
- [ ] zentrale Invarianten nennen.

## G3 — Erweiterungsanleitungen

- [ ] `ADD_CHARACTER.md`
- [ ] `ADD_ENEMY.md`
- [ ] `WEAPONS_AND_EVOLUTIONS.md`
- [ ] `WAVES_AND_BOSSES.md`
- [ ] `META_PROGRESSION.md`
- [ ] jede Anleitung auf frischem Checkout praktisch durchführen.
- [ ] erwartete Dateien, Registrierungen und Tests je Anleitung nennen.

## G4 — Plattform und Reskin

- [ ] `MOBILE_AND_DESKTOP.md`
- [ ] `RESKIN_GUIDE.md`
- [ ] `DEPLOYMENT.md`
- [ ] Assetgrößen, Sprite-Anforderungen und Audioevents dokumentieren.
- [ ] Responsive Breakpoints und Performancebudgets dokumentieren.
- [ ] Save Namespace und Upgrade-Pfad dokumentieren.

## G5 — AI Development Guide

- [ ] `AI_DEVELOPMENT_GUIDE.md` erstellen.
- [ ] Architektur und Extension Points kompakt beschreiben.
- [ ] Core-Invarianten und verbotene Blind-Refactors nennen.
- [ ] Dateimatrix für typische Änderungen erstellen.
- [ ] Testmatrix für Character, Enemy, Ability, UI, Save, Balance und Assets erstellen.
- [ ] Prompts für sichere, begrenzte Erweiterungen bereitstellen.
- [ ] Regeln für bestehendes Verhalten und Regression Coverage formulieren.
- [ ] Beispiel: vierter Character ohne Änderung bestehender Character-Logik.
- [ ] Beispiel: neuer Enemy über Registry und Wave Pool.
- [ ] Beispiel: neue Ability plus EVO und Tests.

## G6 — Produkt-/Rechtsdokumente

- [ ] `LICENSE.md`
- [ ] `THIRD_PARTY_NOTICES.md`
- [ ] `ASSET_LICENSES.md`
- [ ] `CHANGELOG.md`
- [ ] `SUPPORT.md`
- [ ] Versions- und Breaking-Change-Policy definieren.

Acceptance Criteria:

- [ ] Eine neue Person kann Quick Start ohne Zusatzwissen abschließen.
- [ ] Alle Erweiterungstutorials funktionieren praktisch.
- [ ] Kein Dokument verweist auf nicht ausgelieferte Dateien oder lokale Pfade.
- [ ] AI Guide nennt gekoppelte Systeme und notwendige Regressionstests.
- [ ] Supportumfang ist klar begrenzt.

---

# Phase H — Demo, Packaging und Marketplace-Artefakte

Ziel: Aus demselben Code eine öffentliche Demo und ein sauberes Käuferpaket erzeugen.

Geschätzter Aufwand: **20–36 Stunden**

## H1 — Demo

- [ ] Demo-Buildprofil im Zielrepository definieren.
- [ ] Demo verwendet denselben Framework-Core und Example Content.
- [ ] Demo-URL und Base Path konfigurieren.
- [ ] DEV-Test-API und interne Tools ausschließen.
- [ ] vollständigen Run in Demo ermöglichen.
- [ ] Mobile/desktop Entry Points prüfen.
- [ ] Datenschutzhinweis für optionale Analytics erstellen.

## H2 — Käuferpaket

- [ ] Package-Allowlist umsetzen.
- [ ] Source, Runtime Assets, Docs und Tests einschließen.
- [ ] interne Art Sources, Chat References und QA-Captures ausschließen.
- [ ] `node_modules`, Build Outputs und lokale Artefakte ausschließen.
- [ ] Beispiel-`.env` nur bei Bedarf bereitstellen.
- [ ] Versionsnummer in Dateiname und Manifest aufnehmen.
- [ ] SHA-256 des finalen ZIP erzeugen.

## H3 — Paket-Selbsttest

- [ ] ZIP in leeres temporäres Verzeichnis entpacken.
- [ ] prüfen, dass keine Git-/lokalen Arbeitsdateien enthalten sind.
- [ ] `npm ci` aus dem ZIP.
- [ ] `npm run build` aus dem ZIP.
- [ ] `npm run test:fast` aus dem ZIP.
- [ ] `npm run test:release` aus dem ZIP.
- [ ] Doku-Links und Assetpfade prüfen.
- [ ] Provenienz-Allowlist mit ZIP-Inhalt vergleichen.

## H4 — Marketplace-Material

- [ ] Codester-Beschreibung erstellen.
- [ ] itch.io-Seite vorbereiten.
- [ ] Featureliste auf Beweise statt Featurezahl ausrichten.
- [ ] Kernbotschaft „Skip the prototype-to-production grind“ verwenden.
- [ ] echte Demo-Screenshots aus finalem Paket erzeugen.
- [ ] Installations- und Dokumentationsscreenshots ergänzen.
- [ ] Preis-/Lizenzvergleich Standard vs. Extended darstellen.
- [ ] Supportversprechen bewusst begrenzen.

Acceptance Criteria:

- [ ] Demo und ZIP stammen aus demselben Commit.
- [ ] Clean-ZIP-Test ist grün.
- [ ] ZIP enthält nur erlaubte und dokumentierte Dateien.
- [ ] Demo zeigt Movement, Auto-Attacks, Waves, Upgrades, EVO, Boss und Meta-Loop.
- [ ] Marketplace-Text behauptet nichts, was nicht im Paket verifiziert ist.

---

# Phase I — Release Candidate und Verkaufsfreigabe

Ziel: Technische, visuelle, rechtliche und dokumentarische Endabnahme.

Geschätzter Aufwand: **16–32 Stunden**

## I1 — Vollständige technische QA

- [ ] Full Regression Suite auf Release Candidate.
- [ ] Performance-Gates mit hohen Enemy Counts.
- [ ] zehnminütiger Soak-Test.
- [ ] Production-/Release-/Iframe-Gates.
- [ ] Save-Migration mit realem alten Save.
- [ ] frischer Run bis Boss und Victory.
- [ ] Game Over, Restart und Return-to-Hub.
- [ ] Asset-Failure-Verhalten.

## I2 — Geräte-/Viewport-Matrix

- [ ] Desktop Chromium.
- [ ] Desktop Firefox.
- [ ] Desktop Safari/macOS, sofern verfügbar.
- [ ] Android Portrait.
- [ ] Android Landscape.
- [ ] iPhone Portrait.
- [ ] iPhone Landscape.
- [ ] Touch, Audio Unlock, Fullscreen und Rotation prüfen.
- [ ] mindestens ein schwächeres Mobilgerät prüfen.

## I3 — Dokumentationsabnahme

- [ ] Quick Start durch frische Person oder saubere VM validieren.
- [ ] Add Character Tutorial validieren.
- [ ] Add Enemy Tutorial validieren.
- [ ] Weapon/EVO Tutorial validieren.
- [ ] Deployment Guide validieren.
- [ ] alle Kommandos und Links prüfen.

## I4 — Rechtliche/kommerzielle Freigabe

- [ ] Produktlizenz final.
- [ ] Third-party Notices final.
- [ ] Asset-Provenienz ohne offene rote Einträge.
- [ ] Marken-/Namensprüfung für finalen Produktnamen.
- [ ] Codester-/itch.io-Lizenzkompatibilität geprüft.
- [ ] Preis und Launch-Angebot festgelegt.
- [ ] Supportkanal und Antwortumfang festgelegt.

## I5 — Release

- [ ] Version `1.0.0` festlegen.
- [ ] Changelog finalisieren.
- [ ] Release Tag erstellen.
- [ ] Demo deployen.
- [ ] Käufer-ZIP aus Release Tag erzeugen.
- [ ] ZIP-Hash und Testreport archivieren.
- [ ] Produktseite veröffentlichen.
- [ ] Post-Release-Issue-Template und Known Issues veröffentlichen.

Acceptance Criteria:

- [ ] Alle globalen Definition-of-Done-Punkte erfüllt.
- [ ] Keine offenen P0/P1-Bugs.
- [ ] Keine ungeklärten Redistributable-Lizenzen.
- [ ] Demo und Käuferpaket sind auf demselben Release Tag.
- [ ] Rollback auf vorherigen Release Candidate ist möglich.

---

# Testmatrix während der Umsetzung

| Änderung | Mindesttests |
| --- | --- |
| Product Config/Registry Foundation | `build`, `test:foundation`, `test:mechanics`, `test:smoke` |
| Character | `test:character-lab`, `test:rooster-depth`, `test:weapon-progression`, `test:acceptance`, `test:smoke` |
| Enemy/Elite | `test:encounter`, `test:pressure`, `test:spawn-targeting`, `test:mechanics` |
| Boss | `test:boss`, `test:boss-matrix`, `test:encounter`, `test:mechanics` |
| Ability/Weapon/EVO | `test:evolution`, `test:weapon-progression`, `test:mechanics`, `test:foundation` |
| Waves/Spawn/XP | `test:pacing`, `test:early-pacing`, `test:adaptive-spawns`, `test:balance` |
| Arena/Streaming | `test:arena`, `test:map-streaming`, `test:spawn-targeting`, `test:smoke` |
| Meta/Save | `test:meta`, `test:product`, Storage-Failure- und Migrationstest |
| HUD/Responsive/Mobile | `test:menus`, `test:hud-report`, `test:smoke`, `test:acceptance` |
| Assets/Packaging | `assets:check`, `build:release`, `test:production`, `test:release`, Provenienz-Gate |
| Performance | `test:late-run`, `test:pressure`, `test:acceptance`, `test:soak` |

Kein Testname wird entfernt, bevor sein Verhalten einem neuen oder umbenannten Gate eindeutig zugeordnet ist.

---

# Meilensteine

## M1 — Sichere, reproduzierbare Kopie

- [ ] Phase A abgeschlossen.
- Ergebnis: Original geschützt, Zielrepo enthält unveränderte grüne Baseline.

## M2 — Rechtlich definierter Lieferumfang

- [ ] Phase B abgeschlossen.
- Ergebnis: Allowlist, Provenienz, Third-party Notices und Lizenzstrategie stehen.

## M3 — Framework Extension Architecture

- [ ] Phasen C und D abgeschlossen.
- Ergebnis: Character, Enemy und Ability sind über stabile Extension Points ergänzbar.

## M4 — Neutrales Framework mit vollständigem Beispielspiel

- [ ] Phasen E und F abgeschlossen.
- Ergebnis: Core und Rooster-Rage-Example sind sauber getrennt und regressionsgeprüft.

## M5 — Käuferfertiges Produkt

- [ ] Phasen G und H abgeschlossen.
- Ergebnis: Dokumentation, Demo und Clean-ZIP liegen vor.

## M6 — Version 1.0.0

- [ ] Phase I abgeschlossen.
- Ergebnis: Release geprüft und veröffentlichbar.

---

# Aufwandstracking

| Phase | Schätzung | Ist | Status |
| --- | ---: | ---: | --- |
| 0 — Audit | abgeschlossen | — | fertig |
| A — Safe Import/Baseline | 8–16 h | 0 h | offen |
| B — Lizenzen/Packaging | 16–32 h | 0 h | offen |
| C — Config/Sicherheitsnetz | 12–24 h | 0 h | offen |
| D — Registries/Extension Points | 40–72 h | 0 h | offen |
| E — Framework/Example/Branding | 24–44 h | 0 h | offen |
| F — Tests produktisieren | 20–36 h | 0 h | offen |
| G — Dokumentation | 28–48 h | 0 h | offen |
| H — Demo/Marketplace-Paket | 20–36 h | 0 h | offen |
| I — Release QA | 16–32 h | 0 h | offen |
| **Gesamt brutto** | **184–340 h** | **0 h** | offen |

Hinweis: Die frühere Nettoeinschätzung von etwa 150–240 Stunden bleibt erreichbar, wenn Phasen überlappen, keine größeren Asset-Ersetzungen nötig sind und vorhandene Tests/Dokumente konsequent wiederverwendet werden.

---

# Offene Entscheidungen

- [ ] Finaler Produktname und Kurzname.
- [ ] Standard-/Indie- und Extended-/Studio-Lizenzmodell.
- [ ] Ob Raw Source Art als separates Extended-Paket angeboten wird.
- [ ] Ob Rooster Rage als Name des Beispielspiels unverändert bleibt.
- [ ] Ob optionale Product Analytics im Käuferpaket enthalten oder als Modul entfernt werden.
- [ ] Welche Browser-/Node-Versionen offiziell unterstützt werden.
- [ ] Ob Support über E-Mail, GitHub Issues oder Marketplace-System erfolgt.

Entscheidungen werden erst getroffen, wenn sie für die jeweils nächste Phase erforderlich sind.

---

# Aktive Risiken

| Risiko | Wahrscheinlichkeit | Auswirkung | Gegenmaßnahme | Status |
| --- | --- | --- | --- | --- |
| Asset darf im fertigen Spiel, aber nicht im Source-Produkt weitergegeben werden | mittel | sehr hoch | Phase B vor Refactor, Allowlist, Rechtsprüfung | offen |
| Registry-Refactor verändert Balance/Mechanik | mittel | hoch | kleine Schritte, Compatibility Adapter, Regression nach jedem Slice | offen |
| Full Suite ist zu langsam für jeden PR | hoch | mittel | Fast/Full/Release-Aufteilung | offen |
| Käuferpaket wird durch Raw Art/QA zu groß | hoch | mittel | Allowlist-Packaging | offen |
| Character-Erweiterung bleibt trotz Registry quer gekoppelt | mittel | hoch | vierter Contract-Character als Acceptance Test | offen |
| Save Keys brechen bei Rebranding | mittel | hoch | Namespace-Migration und Alt-Key-Fallback | offen |
| Doku driftet vom Code ab | mittel | mittel | Tutorials in Release QA praktisch ausführen | offen |

---

# Entscheidungsprotokoll

| Datum | Entscheidung | Begründung |
| --- | --- | --- |
| 2026-09-22 | Kein Rewrite | Der bestehende Vertical Slice und seine Tests sind der zentrale Vermögenswert. |
| 2026-09-22 | Asset-/Lizenzphase vor Architekturrefactor | Es soll kein Content aufwendig abstrahiert werden, der später nicht ausgeliefert werden darf. |
| 2026-09-22 | Rooster Rage bleibt vorläufig vollständiges Example Game | Der Produktionswert und die integrierten Systeme sollen erhalten bleiben. |
| 2026-09-22 | Arbeitsname „Phaser Survivor Framework — Complete Bullet Heaven Game Foundation“ | Gute Auffindbarkeit plus realistische Beschreibung des Umfangs. |

---

# Änderungsprotokoll dieses Plans

## 2026-09-22

- [x] Initialen konkreten Umsetzungsplan erstellt.
- [x] Phasen, Abhängigkeiten, Acceptance Criteria und Testmatrix definiert.
- [x] Audit als Phase 0 markiert.
- [x] Phase A als nächsten Fokus festgelegt.
