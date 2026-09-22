# Unveränderte Rooster-Rage-Baseline

Stand: 22. September 2026  
Quellcommit: `5e9fc5879ff322d73c5b8267aa3b0e5cd14a5419`

Dieses Protokoll erfasst ausschließlich Prüfungen am unveränderten übernommenen Spiel. Es ist kein Nachweis für die spätere Framework-Produktisierung.

## Erfolgreiche Prüfungen

| Befehl | Ergebnis | Bemerkung |
| --- | --- | --- |
| `npm ci` | bestanden | 19 Pakete installiert. |
| `npm run assets:check` | bestanden | 133 Runtime-Assets aktuell. |
| `npm run build` | bestanden | Vite-Produktionsbuild erstellt. |
| `npm run build:release` | bestanden | Über `test:release` geprüft. |
| `npm run test:mechanics` | bestanden | Keine Fehlerausgabe, Exit-Code 0. |
| `npm run test:smoke` | bestanden | Gegen lokalen Vite-Server unter `127.0.0.1:5173` ausgeführt; prüft Eingabe, Gameplay-Boot sowie Portrait und Landscape. |
| `npm run test:product` | bestanden | Privacy-safe Analytics Gate bestanden. |
| `npm run test:production` | bestanden | Production Gate bestanden; Test-API nicht exponiert. |
| `npm run test:release` | bestanden | Release Gate bestanden; 131 Dateien, 17,49 MiB, WebGL-Boot mit normalem und blockiertem Storage geprüft. |

## Bekannte Baseline-Abweichungen

| Befehl | Ergebnis | Ursache/Umgang |
| --- | --- | --- |
| `npm run test:foundation` | fehlgeschlagen | Der deterministische Novice-Profile-Test weicht zwischen zwei gleichen Läufen bei Safe-Spawn-Koordinaten um 1–2 Pixel ab. Dieser Fehler bestand vor jeder Framework-Änderung und wird vor einem Refactor separat reproduziert und behoben. |
| `npm run test:smoke` ohne Server | erwartete Voraussetzung | Der Test benötigt einen Dev-Server unter `http://127.0.0.1:5173/`; ohne parallel gestarteten Server entsteht erwartungsgemäß `ERR_CONNECTION_REFUSED`. |
| Lokaler Dev-Server | beobachtet | Nach parallelen Browser-Screenshot-Sessions meldete Vite in `GameScene.update` einen Fehler beim Zugriff auf `this.debugStats.lastError`, weil `debugStats` undefiniert war. Der Smoke- und Release-Gate erfassen diesen Pfad nicht. Vor Framework-Änderungen reproduzierbar isolieren. |

## Hinweise

- Vite meldet beim Standard- und Release-Build einen Chunk über 500 kB. Das ist eine Optimierungswarnung, kein Build-Fehler.
- Visuell geprüft und als Referenz abgelegt: [Desktop](./baseline-desktop.png), [Portrait](./baseline-portrait.png), [Landscape](./baseline-landscape.png). Die Henhouse-Startansicht lädt vollständig und zeigt keinen Fehleroverlay.
- Der vollständige Testkatalog und Laufzeiten folgen, sobald die über den Browser laufenden Tests unter der lokalen Dev-Server-Session validiert wurden.
