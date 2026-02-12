# E-Mail-Einrichtung

Diese Anleitung beschreibt Schritt für Schritt, wie Sie den E-Mail-Versand für den RAIS² Newsletter Manager einrichten. Nach der Konfiguration können Sie Newsletter direkt über Gmail an Ihre Abonnenten versenden.

## So funktioniert es

Der RAIS² Newsletter Manager nutzt **Google Apps Script** als kostenlose E-Mail-Schnittstelle:
- Ihre Newsletter werden über Ihr Gmail-Konto versendet
- Abonnentendaten werden in einer Google-Tabelle gespeichert
- Alles läuft über die Infrastruktur von Google — zuverlässig und kostenlos
- Gmail erlaubt bis zu 100 E-Mails/Tag (privat) oder 1.500/Tag (Google Workspace)

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Newsletter  │────▶│  Google Apps      │────▶│  Gmail      │
│  Manager     │     │  Script           │     │  (Versand)  │
│  (Browser)   │     │  (Ihr Konto)      │     │             │
└──────────────┘     └────────┬─────────┘     └─────────────┘
                              │
                     ┌────────┴─────────┐
                     │  Google-Tabelle  │
                     │  (Abonnenten)    │
                     └──────────────────┘
```

## Voraussetzungen

- Ein Google-Konto (Gmail oder Google Workspace)
- Zugang zum RAIS² Newsletter Manager (lokal auf Ihrem Rechner)

## Schritt 1: Eine Google-Tabelle für Abonnenten erstellen

1. Öffnen Sie [Google Tabellen](https://sheets.google.com) und erstellen Sie eine neue Tabelle
2. Geben Sie einen aussagekräftigen Namen ein, z. B. **"RAIS2 Newsletter Abonnenten"**
3. Stellen Sie sicher, dass das erste Tabellenblatt **"Subscribers"** heißt (klicken Sie auf den Reiter unten, um ihn umzubenennen)
4. Tragen Sie in Zeile 1 folgende Spaltenüberschriften ein (eine pro Zelle, beginnend ab Spalte A):

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| id | email | name | status | subscribedAt | unsubscribedAt | source | confirmToken |

5. Speichern Sie die Tabelle
6. **Kopieren Sie die Sheet-ID** aus der URL. Die URL sieht so aus:
   ```
   https://docs.google.com/spreadsheets/d/ABC123xyz.../edit
   ```
   Die Sheet-ID ist die lange Zeichenkette zwischen `/d/` und `/edit` — in diesem Beispiel: `ABC123xyz...`

> **Notieren Sie sich diese ID** — Sie benötigen sie in Schritt 3.

## Schritt 2: Ein Google Apps Script Projekt erstellen

1. Öffnen Sie [Google Apps Script](https://script.google.com)
2. Klicken Sie auf **Neues Projekt** (die "+"-Schaltfläche)
3. Sie sehen eine Datei namens `Code.gs` mit Standardcode
4. **Löschen Sie den gesamten Standardcode** in `Code.gs`
5. Öffnen Sie die Datei `docs/apps-script-code.gs` aus dem RAIS²-Projektordner auf Ihrem Computer
6. **Kopieren Sie den gesamten Inhalt** dieser Datei
7. **Fügen Sie ihn** in `Code.gs` im Apps Script Editor ein
8. Klicken Sie auf das **Speichern-Symbol** (oder drücken Sie Strg+S / Cmd+S)
9. Geben Sie dem Projekt einen Namen, z. B. **"RAIS2 Email Service"**

## Schritt 3: Das Script konfigurieren

1. Klicken Sie im Apps Script Editor auf das **Zahnrad-Symbol** in der linken Seitenleiste, um die **Projekteinstellungen** zu öffnen
2. Scrollen Sie nach unten zu **Skripteigenschaften**
3. Klicken Sie auf **Skripteigenschaft hinzufügen**
4. Tragen Sie ein:
   - **Eigenschaft**: `SHEET_ID`
   - **Wert**: Die Sheet-ID, die Sie in Schritt 1 kopiert haben
5. Klicken Sie auf **Skripteigenschaften speichern**

## Schritt 4: Als Web-App bereitstellen

1. Klicken Sie im Apps Script Editor auf **Bereitstellen** → **Neue Bereitstellung**
2. Klicken Sie auf das **Zahnrad-Symbol** neben "Typ auswählen" und wählen Sie **Web-App**
3. Konfigurieren Sie:
   - **Beschreibung**: "RAIS2 Email Service" (oder ein anderer Name)
   - **Ausführen als**: **Ich** (Ihr Google-Konto)
   - **Zugriff**: **Jeder**
4. Klicken Sie auf **Bereitstellen**
5. Google wird Sie auffordern, die App zu **autorisieren**:
   - Klicken Sie auf **Zugriff autorisieren**
   - Wählen Sie Ihr Google-Konto
   - Möglicherweise erscheint die Warnung "Google hat diese App nicht überprüft" — klicken Sie auf **Erweitert** → **Zu RAIS2 Email Service (unsicher) wechseln**
   - Klicken Sie auf **Zulassen** (dies erlaubt dem Script, E-Mails über Ihr Gmail zu senden und auf Ihre Tabelle zuzugreifen)
6. Nach der Bereitstellung sehen Sie eine **Web-App-URL**, die so aussieht:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
7. **Kopieren Sie diese URL** — Sie benötigen sie im nächsten Schritt

> **Wichtig:** Jedes Mal, wenn Sie den Code ändern und die Änderungen wirksam werden sollen, müssen Sie eine **neue Bereitstellung** erstellen (Bereitstellen → Neue Bereitstellung). Die URL ändert sich dabei jedes Mal.

## Schritt 5: Mit dem RAIS² Newsletter Manager verbinden

1. Öffnen Sie den RAIS² Newsletter Manager in Ihrem Browser (http://localhost:8080)
2. Gehen Sie zu **Einstellungen** (in der Seitenleiste)
3. Im Bereich **E-Mail-Konfiguration**:
   - Fügen Sie Ihre **Web-App-URL** in das URL-Feld ein
   - Legen Sie Ihren **Absendernamen** fest (z. B. "RAIS² Newsletter")
   - Geben Sie eine **Antwort-an**-E-Mail-Adresse ein
4. Klicken Sie auf **Verbindung testen** — Sie sollten den grünen Status "Verbunden" sehen
5. Klicken Sie auf **Test-E-Mail senden** — geben Sie Ihre E-Mail-Adresse ein, um eine Testnachricht zu erhalten

> **Erwartetes Ergebnis:** Eine Test-E-Mail in Ihrem Posteingang von "RAIS² Newsletter" mit einem grünen Header "Test Email Successful!"

## Fertig!

Jetzt können Sie:
- Newsletter von der **Archiv**-Seite aus versenden
- Abonnenten auf der **Abonnenten**-Seite verwalten (sie synchronisieren sich mit Ihrer Google-Tabelle)
- Abonnenten können sich über einen Link in jeder E-Mail abmelden

## Fehlerbehebung

### Warnung "Google hat diese App nicht überprüft"
Das ist normal bei persönlichen Apps Script Projekten. Klicken Sie auf **Erweitert** → **Zu [Projektname] (unsicher) wechseln**, um fortzufahren. Die Bezeichnung "unsicher" bedeutet lediglich, dass Google den Code nicht überprüft hat — Sie haben ihn aber selbst geschrieben.

### Verbindungstest schlägt fehl
- Stellen Sie sicher, dass die Web-App-URL korrekt ist (endet mit `/exec`)
- Überprüfen Sie, ob die Bereitstellung auf "Jeder" gesetzt ist
- Versuchen Sie, eine neue Bereitstellung zu erstellen

### E-Mails werden nicht empfangen
- Überprüfen Sie Ihren Gmail-Spamordner
- Stellen Sie sicher, dass die E-Mail-Adresse des Abonnenten korrekt ist
- Prüfen Sie das tägliche Gmail-Sendelimit (100/Tag für privates Gmail, 1.500/Tag für Workspace)

### Fehler "SHEET_ID not configured"
- Gehen Sie zu Apps Script → Projekteinstellungen → Skripteigenschaften
- Stellen Sie sicher, dass die Eigenschaft `SHEET_ID` existiert und den korrekten Wert enthält

### Änderungen am Script wirken sich nicht aus
- Sie müssen jedes Mal eine **neue Bereitstellung** erstellen, wenn Sie den Code ändern
- Die alte Bereitstellungs-URL verwendet weiterhin den alten Code
- Kopieren Sie die neue URL und aktualisieren Sie sie in den RAIS²-Einstellungen
