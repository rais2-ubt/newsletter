# Erste Schritte mit dem RAIS² Newsletter Manager

Diese Anleitung hilft Ihnen, den RAIS² Newsletter Manager auf Ihrem Computer einzurichten. Keine Programmierkenntnisse erforderlich — folgen Sie einfach den Schritten unten.

## Was Sie benötigen

- Einen Computer (Windows, Mac oder Linux)
- Einen Webbrowser (Google Chrome empfohlen, Firefox funktioniert ebenfalls)
- Python 3 (ein kostenloses Programm — die Installation wird unten erklärt)
- Die Projektdateien (auch dazu finden Sie unten eine Anleitung)

## Schritt 1: Python installieren

Python ist ein Programm, das einen kleinen Webserver auf Ihrem Computer bereitstellt. Sie müssen es nur einmal installieren.

### Auf dem Mac

Auf dem Mac ist Python häufig bereits vorinstalliert. Öffnen Sie das **Terminal** (suchen Sie mit Cmd+Leertaste nach "Terminal") und geben Sie ein:

```bash
python3 --version
```

Wenn eine Versionsnummer angezeigt wird (z. B. `Python 3.11.5`), ist Python bereits installiert. Falls nicht, laden Sie es von [https://www.python.org/downloads/](https://www.python.org/downloads/) herunter.

### Unter Windows

1. Gehen Sie auf [https://www.python.org/downloads/](https://www.python.org/downloads/)
2. Klicken Sie auf den großen gelben Button **Download Python**
3. Starten Sie die heruntergeladene Installationsdatei
4. **WICHTIG:** Setzen Sie am unteren Rand des Installationsfensters den Haken bei **"Add Python to PATH"**
5. Klicken Sie auf **Install Now**

Um die Installation zu überprüfen, öffnen Sie die **Eingabeaufforderung** (suchen Sie im Startmenü nach "cmd") und geben Sie ein:

```bash
python --version
```

oder

```bash
python3 --version
```

Wenn eine Versionsnummer erscheint, war die Installation erfolgreich.

### Unter Linux

Öffnen Sie ein Terminal und führen Sie folgenden Befehl aus:

```bash
sudo apt install python3   # Ubuntu / Debian
# oder
sudo dnf install python3   # Fedora
```

## Schritt 2: Die Projektdateien herunterladen

### Option A: Als ZIP herunterladen (am einfachsten)

1. Gehen Sie zur Projektseite auf GitHub
2. Klicken Sie auf den grünen Button **Code**
3. Klicken Sie auf **Download ZIP**
4. Entpacken Sie die ZIP-Datei in einen Ordner auf Ihrem Computer (z. B. auf den Desktop)

### Option B: Mit Git (falls Git installiert ist)

```bash
git clone <Repository-URL>
```

Ersetzen Sie `<Repository-URL>` durch die tatsächliche URL des Repositorys.

## Schritt 3: Den Server starten

### Auf Mac / Linux

1. Öffnen Sie das **Terminal**
2. Navigieren Sie zum Projektordner. Wenn Sie die Dateien auf den Desktop entpackt haben:
   ```bash
   cd ~/Desktop/rais2-newsletter-static
   ```
3. Starten Sie den Server:
   ```bash
   python3 -m http.server 8080
   ```
4. Sie sollten die Meldung sehen: `Serving HTTP on :: port 8080 ...`

### Unter Windows

1. Öffnen Sie die **Eingabeaufforderung** (suchen Sie im Startmenü nach "cmd")
2. Navigieren Sie zum Projektordner:
   ```bash
   cd C:\Users\IhrBenutzername\Desktop\rais2-newsletter-static
   ```
   Ersetzen Sie `IhrBenutzername` durch Ihren tatsächlichen Windows-Benutzernamen.
3. Starten Sie den Server:
   ```bash
   python -m http.server 8080
   ```
   oder
   ```bash
   python3 -m http.server 8080
   ```
4. Sie sollten die Meldung sehen: `Serving HTTP on :: port 8080 ...`

> **Was passiert hier?** Ihr Computer wird zu einem kleinen Webserver, auf den nur Sie selbst zugreifen können. Die Daten bleiben auf Ihrem Rechner — niemand anderes im Internet kann darauf zugreifen.

## Schritt 4: Im Browser öffnen

1. Öffnen Sie Google Chrome (oder Firefox)
2. Geben Sie folgende Adresse in die Adressleiste ein: **http://localhost:8080**
3. Drücken Sie die Eingabetaste
4. Sie sollten nun das Dashboard des RAIS² Newsletter Managers sehen

> **Was bedeutet "localhost"?** "localhost" bedeutet, dass Ihr Computer mit sich selbst kommuniziert. Es ist so, als würden Sie Ihre eigene Telefonnummer anrufen — die Daten verlassen Ihren Rechner nicht. Alles läuft lokal auf Ihrem Computer.

## Den Server beenden

Wenn Sie mit der Arbeit fertig sind:

1. Wechseln Sie zurück zum Terminal- oder Eingabeaufforderungs-Fenster, in dem der Server läuft
2. Drücken Sie **Strg + C** auf Ihrer Tastatur
3. Der Server wird gestoppt

Wenn Sie das nächste Mal mit dem Newsletter-Tool arbeiten möchten, beginnen Sie einfach wieder bei **Schritt 3**. Ihre Daten werden automatisch im Browser gespeichert und sind beim nächsten Start noch vorhanden.

## Fehlerbehebung

### "python3: command not found" (Befehl nicht gefunden)

- **Windows:** Versuchen Sie `python` statt `python3`. Unter Windows heißt der Befehl manchmal nur `python`.
- **Mac:** Installieren Sie Python von [https://www.python.org/downloads/](https://www.python.org/downloads/) und versuchen Sie es erneut.
- **Alle Systeme:** Schließen Sie das Terminal bzw. die Eingabeaufforderung und öffnen Sie ein neues Fenster, nachdem Sie Python installiert haben. Erst dann wird die neue Installation erkannt.

### "Address already in use" (Port 8080 bereits belegt)

Ein anderes Programm verwendet bereits Port 8080. Versuchen Sie einen anderen Port:

```bash
python3 -m http.server 8081
```

Öffnen Sie dann [http://localhost:8081](http://localhost:8081) in Ihrem Browser.

### Die Seite zeigt alte Inhalte oder Änderungen werden nicht angezeigt

Das Newsletter-Tool verwendet einen Service Worker, der Dateien für die Offline-Nutzung zwischenspeichert. Manchmal sehen Sie dadurch eine ältere Version einer Seite. So beheben Sie das:

1. **Schnelle Lösung:** Hängen Sie `?nocache=1` an die URL an (z. B. `http://localhost:8080?nocache=1`)
2. **Vollständige Lösung:** Öffnen Sie die Chrome DevTools (drücken Sie **F12**), wechseln Sie zum Tab **Application**, klicken Sie links auf **Service Workers** und dann auf **Unregister**. Laden Sie anschließend die Seite neu.

### Leere Seite oder Fehlermeldungen im Browser

- Stellen Sie sicher, dass Sie sich im richtigen Ordner befinden — dem Ordner, der die Datei `index.html` enthält. Sie können das überprüfen, indem Sie die Dateien auflisten:
  ```bash
  ls        # Mac / Linux
  dir       # Windows
  ```
  Sie sollten `index.html`, `builder.html`, `css/`, `js/` und weitere Projektdateien sehen.
- Überprüfen Sie, ob das Terminal noch anzeigt, dass der Server läuft. Falls er gestoppt wurde, starten Sie ihn erneut.
- Versuchen Sie, die Seite in einem anderen Browser zu öffnen.
- Öffnen Sie die Entwicklerkonsole des Browsers (drücken Sie **F12**, dann klicken Sie auf den Tab **Console**), um eventuelle Fehlermeldungen zu sehen.

### Daten scheinen verschwunden zu sein

Alle Daten werden im localStorage Ihres Browsers gespeichert. Das bedeutet:

- Wenn Sie einen anderen Browser verwenden, sehen Sie Ihre Daten dort nicht (sie werden pro Browser gespeichert).
- Wenn Sie Ihre Browserdaten oder Cookies löschen, werden auch Ihre Newsletter-Daten gelöscht.
- In einem privaten Fenster (Inkognito-Modus) starten Sie mit einem leeren Arbeitsbereich.

Um Datenverlust zu vermeiden, nutzen Sie die **Archiv**-Funktion, um fertige Newsletter zu sichern, und exportieren Sie wichtige Daten regelmäßig.

## Nächste Schritte

Jetzt, da das Tool läuft, finden Sie hier weiterführende Anleitungen:

- **[Benutzerhandbuch](user-guide-de.md)** — Lernen Sie alle Funktionen kennen: Scraping, CSV-Import, Newsletter erstellen und mehr
- **[E-Mail-Einrichtung](email-setup-de.md)** — Konfigurieren Sie den E-Mail-Versand, um Newsletter direkt über Gmail zu versenden
- **[KI-Konfiguration](ai-setup-de.md)** — Richten Sie die KI-gestützte Textgenerierung ein, die Ihnen beim Verfassen von Newsletter-Inhalten hilft (kostenlose Optionen verfügbar)
