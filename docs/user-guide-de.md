# RAIS² Newsletter Manager — Benutzerhandbuch

Eine vollständige Anleitung zu allen Funktionen des RAIS² Newsletter Managers.

---

## Inhaltsverzeichnis

- [Überblick](#überblick)
  - [Navigation](#navigation)
  - [Wie die Daten fließen](#wie-die-daten-fließen)
- [Dashboard](#dashboard)
  - [Was Sie sehen](#was-sie-sehen)
  - [Inhalte abrufen](#inhalte-abrufen)
  - [Schnellaktionen](#schnellaktionen)
- [CSV-Verarbeitung](#csv-verarbeitung)
  - [Eine CSV-Datei hochladen](#eine-csv-datei-hochladen)
  - [Der Feld-Inspektor](#der-feld-inspektor)
  - [Inhaltstypen](#inhaltstypen)
  - [Text generieren](#text-generieren)
  - [Sprachumschalter](#sprachumschalter)
  - [Einträge speichern](#einträge-speichern)
- [Newsletter-Editor](#newsletter-editor)
  - [Inhalte durchsuchen](#inhalte-durchsuchen)
  - [Einträge auswählen](#einträge-auswählen)
  - [Drag-and-Drop](#drag-and-drop)
  - [Newsletter-Einstellungen](#newsletter-einstellungen)
  - [Live-Vorschau](#live-vorschau)
  - [Newsletter speichern](#newsletter-speichern)
  - [Publikationsfilter](#publikationsfilter)
- [CMS-Export](#cms-export)
  - [Datenquellen](#datenquellen)
  - [CMS-Felder generieren](#cms-felder-generieren)
  - [Die generierten Felder verwenden](#die-generierten-felder-verwenden)
- [Archiv](#archiv)
  - [Newsletter anzeigen](#newsletter-anzeigen)
  - [Newsletter-Status](#newsletter-status)
  - [Aktionen](#aktionen)
- [Abonnenten](#abonnenten)
  - [Ihre E-Mail-Liste verwalten](#ihre-e-mail-liste-verwalten)
  - [Abonnenten hinzufügen](#abonnenten-hinzufügen)
  - [Google Sheets Synchronisation](#google-sheets-synchronisation)
  - [Abonnenten entfernen](#abonnenten-entfernen)
- [Einstellungen](#einstellungen)
  - [E-Mail-Konfiguration](#e-mail-konfiguration)
  - [KI-Assistent](#ki-assistent)
  - [Datenverwaltung](#datenverwaltung)
- [Tipps & Tricks](#tipps--tricks)
  - [Service Worker / Cache-Probleme](#service-worker--cache-probleme)
  - [Regelmäßige Sicherungen](#regelmäßige-sicherungen)
  - [KI-Chat-Panel](#ki-chat-panel)
  - [Tastaturkürzel](#tastaturkürzel)

---

## Überblick

Der RAIS² Newsletter Manager ist ein browserbasiertes Werkzeug zur Erstellung, Verwaltung und Versendung von Newslettern für das RAIS²-Zentrum für Verantwortungsvolle KI in der Gesellschaft an der Universität Bayreuth. Die Anwendung läuft vollständig in Ihrem Browser — eine Installation ist nicht erforderlich. Sämtliche Daten werden lokal im Browser gespeichert.

Um die Anwendung zu starten, führen Sie folgenden Befehl im Terminal im Projektordner aus:

```
python3 -m http.server 8080
```

Öffnen Sie anschließend Ihren Browser und navigieren Sie zu `http://localhost:8080`.

### Navigation

Die Seitenleiste auf der linken Seite bietet Zugang zu allen Bereichen:

- **Dashboard** — Ihr Startpunkt. Statistiken, Inhalte abrufen und eine Übersicht über Ihre Daten.
- **Newsletter erstellen** — Der Newsletter-Editor zum Zusammenstellen von Inhalten.
- **CSV-Verarbeitung** — Daten aus Tabellenkalkulationen importieren (z. B. Google Forms, Excel-Exporte).
- **CMS-Export** — Inhalte für das CMS der Universität Bayreuth exportieren (Akkordeonelement-Format).
- **Archiv** — Gespeicherte Newsletter anzeigen und verwalten.
- **Abonnenten** — Ihre E-Mail-Verteilerliste verwalten.
- **Einstellungen** — E-Mail-Versand, KI-Anbieter und Daten konfigurieren.

### Wie die Daten fließen

```
  ┌──────────┐     ┌──────────────┐     ┌──────────────┐
  │  Website  │     │ CSV-Upload   │     │  Manuelle    │
  │  abrufen  │     │ (Formulare)  │     │  Eingabe     │
  └────┬─────┘     └──────┬───────┘     └──────┬───────┘
       │                  │                     │
       └──────────┬───────┴─────────────────────┘
                  ▼
       ┌─────────────────────┐
       │  Newsletter-Editor   │  ← Auswählen, ordnen, anpassen
       └──────────┬──────────┘
                  │
          ┌───────┴───────┐
          ▼               ▼
  ┌──────────────┐  ┌──────────────┐
  │  CMS-Export  │  │ E-Mail senden│
  │  (UBT CMS)  │  │ (über Gmail) │
  └──────────────┘  └──────────────┘
```

Ihre Inhalte gelangen auf drei Wegen in das System:

1. **Website abrufen (Scraping)** — Automatischer Abruf von Inhalten der RAIS²-Website.
2. **CSV-Upload** — Import von Daten aus Tabellenkalkulationen, Google-Forms-Antworten oder anderen tabellarischen Daten.
3. **Manuelle Eingabe** — Direkte Eingabe von Inhalten über ein Formular.

Die gesammelten Inhalte stellen Sie dann im **Newsletter-Editor** zusammen. Anschließend können Sie den Newsletter entweder für das Uni-CMS exportieren oder per E-Mail an Ihre Abonnenten versenden.

---

## Dashboard

Das Dashboard ist Ihre Startseite. Es bietet einen schnellen Überblick über alle Daten im System und ist der Ausgangspunkt für den Abruf neuer Inhalte von der RAIS²-Website.

### Was Sie sehen

- **Statistikkarten** am oberen Rand mit Anzahl der:
  - Neuen verfügbaren Einträge
  - Abonnenten in Ihrer Liste
  - Gespeicherten Newsletter im Archiv
  - Importierten CSV-Einträge
- **Scraping-Dashboard** — Steuerung und Status für den Abruf von Inhalten der RAIS²-Website.
- **Aktuelle Inhalte** — Vorschau der zuletzt abgerufenen oder importierten Einträge.

### Inhalte abrufen

Beim Abrufen (Scraping) werden Inhalte von der RAIS²-Website geladen und lokal gespeichert, damit Sie diese in Ihren Newslettern verwenden können.

1. Klicken Sie auf **Jetzt abrufen** (Scrape Now) auf dem Dashboard.
2. Das System ruft Inhalte der RAIS²-Website in 6 Kategorien ab:
   - News
   - Veranstaltungen (Events)
   - Vorträge (Lectures)
   - Publikationen (Publications)
   - Mitglieder (Members)
   - Projekte (Projects)
3. Ein Fortschrittsbalken zeigt den Status für jede Kategorie an.
4. Abgerufene Inhalte werden für 24 Stunden lokal zwischengespeichert, um unnötige Anfragen zu vermeiden.
5. Verwenden Sie **Cache leeren** (Clear Cache), um die zwischengespeicherten Daten zu entfernen und beim nächsten Mal frische Daten abzurufen.

> **Hinweis:** Der Abruf verwendet CORS-Proxys, um von Ihrem Browser aus auf die RAIS²-Website zuzugreifen. Das System prüft automatisch die Verfügbarkeit der Proxys und wählt den schnellsten funktionierenden aus. Sollte der Abruf fehlschlagen, versuchen Sie es erneut — es wird automatisch ein anderer Proxy verwendet.

### Schnellaktionen

Unterhalb der Statistikkarten finden Sie Schaltflächen für häufige Aktionen:

- **Newsletter erstellen** — Öffnet direkt den Newsletter-Editor.
- **Archiv anzeigen** — Öffnet die Archivseite mit gespeicherten Newslettern.
- **Cache leeren** — Entfernt alle zwischengespeicherten Abrufdaten, sodass beim nächsten Abruf aktuelle Inhalte geladen werden.

---

## CSV-Verarbeitung

Die CSV-Verarbeitung ermöglicht den Import von Daten aus Tabellenkalkulationen (z. B. Google-Forms-Antworten, Excel-Exporte, Konferenzlisten) und deren Umwandlung in fertig formatierte Newsletter-Texte.

### Eine CSV-Datei hochladen

1. Öffnen Sie die **CSV-Verarbeitung** über die Seitenleiste.
2. Laden Sie Ihre Datei hoch, indem Sie:
   - Die Datei per **Drag-and-Drop** auf den Upload-Bereich ziehen, oder
   - Auf den Upload-Bereich **klicken** und eine Datei von Ihrem Computer auswählen.
3. Das System liest die CSV-Datei ein und zeigt alle gefundenen Einträge als Liste an.

Unterstützte Formate: `.csv`-Dateien mit Komma-, Semikolon- oder Tab-Trennung. Der Parser verarbeitet automatisch Felder in Anführungszeichen und mehrzeilige Werte.

### Der Feld-Inspektor

Klicken Sie nach dem Hochladen auf einen beliebigen Eintrag, um den **Feld-Inspektor** zu öffnen. Dieser zeigt Ihnen:

- Alle erkannten Felder aus der CSV (Titel, Datum, Vortragende/r, Ort usw.).
- Wie jedes Feld von Ihren CSV-Spaltenbezeichnungen auf das interne Schema abgebildet wurde.
- Welche Felder als **erforderlich** bzw. **optional** für den erkannten Inhaltstyp gelten.
- Die Rohdaten aus der CSV neben den zugeordneten Werten, sodass Sie die Korrektheit prüfen können.

> **Tipp:** Das System erkennt zahlreiche Varianten von Spaltenbezeichnungen. Beispielsweise kann eine Spalte namens „Speaker" auch „Referent", „Presenter", „Lecturer", „Vortragende/r" oder ähnlich heißen. Sie müssen Ihre CSV-Spalten nicht umbenennen, damit sie einem bestimmten Format entsprechen.

### Inhaltstypen

Das System erkennt den Typ jedes Eintrags automatisch und wendet eine passende deterministische Vorlage an. Es gibt 6 Vorlagen:

1. **Vortrag (Lecture/Talk)** — Fokus auf der vortragenden Person. Enthält Name, Titel, Biografie und Zusammenfassung. Ideal für Einträge regelmäßiger Vortragsreihen.
2. **Workshop** — Praxisorientierte Inhalte mit Moderationsleitung. Betont praktische Aspekte und Teilnahmeinformationen.
3. **Konferenz (Conference)** — Für mehrtägige, größere Veranstaltungen. Hebt Termine, Veranstaltungsort, Hauptvortragende und Anmeldung hervor.
4. **Call for Papers (CFP)** — Fokus auf Einreichungen. Hebt Fristen, Themen, Einreichungsanforderungen und Kontaktdaten hervor.
5. **Veranstaltung (Event)** — Allgemeine Veranstaltungen mit logistischen Details (Datum, Uhrzeit, Ort, Anmeldung).
6. **Nachricht (News)** — Allgemeine Ankündigungen und Neuigkeiten. Flexibles Format für verschiedene Inhalte.

Der Typ wird automatisch anhand von Schlüsselwörtern im Titel und in der Beschreibung erkannt. Sie können ihn bei Bedarf aber auch manuell ändern.

### Text generieren

Für jeden importierten Eintrag erzeugt das System Text in drei Formaten:

- **Reintext (Plain Text)** — Sauber formatierter Text ohne besondere Auszeichnungen, geeignet für einfache E-Mail-Newsletter oder reine Textumgebungen.
- **HTML** — Vollständig gestalteter HTML-Text mit Farben, Überschriften und Formatierungen im Corporate Design der UBT (Grün #009260, Crimson Text für Überschriften, Source Sans Pro für Fließtext).
- **Prompt** — Ein strukturierter Prompt, den Sie an einen KI-Assistenten senden können, um individuell formulierten Text zu erzeugen. Nützlich, wenn die KI in einem bestimmten Tonfall schreiben oder kreative Elemente hinzufügen soll.

Klicken Sie auf die Format-Schaltflächen, um zwischen den Ansichten zu wechseln. Jedes Format kann mit einem Klick in die Zwischenablage kopiert werden.

### Sprachumschalter

Am oberen Rand des Textgenerierungsbereichs finden Sie einen **DE / EN**-Umschalter:

- **DE** — Erzeugt den Text auf Deutsch.
- **EN** — Erzeugt den Text auf Englisch.

Der Umschalter gilt für alle drei Formate (Reintext, HTML, Prompt). Beim Wechsel der Sprache wird der Text mit denselben Basisdaten, aber mit der entsprechenden Sprachvorlage neu generiert.

### Einträge speichern

Nachdem Sie die Texte Ihrer Einträge geprüft und generiert haben:

1. Klicken Sie auf **Speichern** (oder **Alle speichern**), um die verarbeiteten Einträge zu sichern.
2. Gespeicherte Einträge erscheinen an zwei Stellen:
   - Im Tab **CSV Items** im Newsletter-Editor, sodass Sie sie in Newsletter einbinden können.
   - In der Datenquelle **CSV Items** im CMS-Export, sodass Sie CMS-Felder dafür generieren können.

Die Einträge werden mit sämtlichen generierten Texten (beide Sprachen, alle Formate) gespeichert, sodass Sie diese später nicht erneut erzeugen müssen.

---

## Newsletter-Editor

Der Newsletter-Editor ist das Herzstück der Anwendung. Hier stellen Sie Ihren Newsletter zusammen, indem Sie Einträge auswählen, in Abschnitte ordnen und das Ergebnis in der Vorschau prüfen.

### Inhalte durchsuchen

Das linke Panel zeigt alle verfügbaren Inhalte, geordnet nach Kategorie-Tabs:

- **Alle** — Zeigt sämtliche Einträge aus allen Kategorien.
- **News** — Nachrichten und Ankündigungen.
- **Events** — Kommende Veranstaltungen.
- **Lectures** — Vorträge und Beiträge zu Vortragsreihen.
- **Publications** — Wissenschaftliche Publikationen.
- **Members** — Personen und Team-Updates.
- **Projects** — Forschungsprojekt-Updates.
- **CSV Items** — Einträge, die Sie über die CSV-Verarbeitung importiert haben.

Jeder Eintrag wird als Karte mit Titel, Datum und farbiger Kategoriemarkierung angezeigt. CSV-Einträge sind zusätzlich mit **NEU**- und **CSV**-Kennzeichnungen versehen.

### Einträge auswählen

1. Klicken Sie auf eine Eintragskarte im linken Panel, um den Eintrag für den Newsletter **auszuwählen**.
2. Der Eintrag wird in den Bereich der **Newsletter-Abschnitte** auf der rechten Seite verschoben.
3. Einträge werden automatisch nach Kategorie in Abschnitte gruppiert (z. B. landen alle Veranstaltungen im Abschnitt „Events").
4. Klicken Sie erneut auf einen ausgewählten Eintrag, um die **Auswahl aufzuheben** und ihn aus dem Newsletter zu entfernen.

Sie können Einträge aus mehreren Kategorien auswählen, um einen Newsletter mit vielfältigen Inhalten zu erstellen.

### Drag-and-Drop

Der Editor unterstützt Drag-and-Drop für flexible Anordnung:

- **Einträge innerhalb eines Abschnitts umordnen**: Ziehen Sie eine Eintragskarte nach oben oder unten, um ihre Position innerhalb des Abschnitts zu ändern.
- **Abschnitte umordnen**: Ziehen Sie die Abschnittsüberschrift, um die Reihenfolge ganzer Abschnitte im Newsletter zu ändern (z. B. Events vor News setzen).

Die Reihenfolge wird beim Ziehen automatisch gespeichert. Die Live-Vorschau aktualisiert sich sofort entsprechend der neuen Anordnung.

### Newsletter-Einstellungen

Klicken Sie auf das **Zahnrad-Symbol**, um die Newsletter-Konfiguration zu öffnen:

- **Logo**: Ein- oder Ausblenden des RAIS²-Logos am Anfang des Newsletters.
- **Trennlinienstil**: Wählen Sie das visuelle Trennzeichen zwischen Abschnitten:
  - Durchgezogene Linie
  - Verlaufslinie (Gradient)
  - Punkte
  - Wellenmuster
- **Hervorgehobene Einträge**: Markieren Sie bestimmte Einträge als „hervorgehoben", um sie im Newsletter-Layout besonders hervorzuheben.

### Live-Vorschau

Das rechte Panel zeigt eine **Live-HTML-Vorschau** Ihres Newsletters. Diese Vorschau:

- Aktualisiert sich automatisch, wenn Sie Einträge hinzufügen, entfernen oder umordnen.
- Zeigt die fertige HTML-Darstellung im Corporate Design der UBT (grüne Überschriften, passende Schriftarten).
- Ermöglicht es Ihnen, das Erscheinungsbild des Newsletters vor dem Speichern oder Versenden zu prüfen.

Über die Tabs am oberen Rand des rechten Panels können Sie zwischen dem Abschnittseditor und der vollständigen Vorschau wechseln.

### Newsletter speichern

1. Klicken Sie auf **Newsletter speichern**, wenn Sie mit Inhalt und Layout zufrieden sind.
2. Geben Sie einen aussagekräftigen Titel ein (z. B. „RAIS² Newsletter — Februar 2026").
3. Der Newsletter wird im localStorage Ihres Browsers gespeichert.
4. Sie finden ihn anschließend im **Archiv**, wo Sie ihn ansehen, bearbeiten, duplizieren oder versenden können.

### Publikationsfilter

Beim Anzeigen des Tabs **Publications** erscheinen zusätzliche Filteroptionen:

- **Jahresfilter**: Publikationen eines bestimmten Jahres anzeigen:
  - 2026
  - 2025
  - 2024
  - Früher
  - Alle Jahre
- **Sortierung**:
  - Neueste zuerst (Standard)
  - Älteste zuerst
  - Titel A-Z

Diese Filter helfen Ihnen, schnell relevante Publikationen zu finden, wenn Sie einen Newsletter mit Schwerpunkt auf aktuelle Forschungsergebnisse erstellen.

---

## CMS-Export

Die CMS-Export-Seite erzeugt formatierte Felder für das Content-Management-System der Universität Bayreuth. Die Inhalte werden im Format des **Akkordeonelement** ausgegeben, das im UBT-CMS verwendet wird.

### Datenquellen

Vier Tabs bieten verschiedene Wege, Inhalte in den CMS-Export einzuspeisen:

1. **Newsletter Items** — Von der RAIS²-Website abgerufene Inhalte. Wählen Sie einen beliebigen abgerufenen Eintrag, um CMS-Felder zu erzeugen.
2. **Google Forms** — Import von Daten aus Google Forms über drei Methoden:
   - **CSV-Upload** — Laden Sie einen CSV-Export aus Google Forms hoch.
   - **JSON einfügen** — Fügen Sie JSON-Daten direkt ein.
   - **Google Sheets API** — Verbinden Sie sich mit einem Google Sheet für Live-Daten.
3. **Manuelle Eingabe** — Füllen Sie die CMS-Felder manuell über ein strukturiertes Formular aus. Nützlich für einzelne Inhalte, die aus keiner anderen Quelle stammen.
4. **CSV Items** — Zuvor über die CSV-Verarbeitung importierte und gespeicherte Einträge. Deren generierte Texte sind sofort einsatzbereit.

### CMS-Felder generieren

1. Wählen Sie einen Eintrag aus einem der vier Quell-Tabs.
2. Das rechte Panel erzeugt CMS-Felder, gegliedert in die Feldgruppen des **Akkordeonelements**:
   - **Allgemein**: Interner Name, Anzeigetitel, URL-Pfad.
   - **Content**: Der sichtbare Titel und der HTML-Inhalt des Akkordeonelements.
   - **Flipside**: Sortierreihenfolge, Bildanzeigeeinstellungen.
   - **Felder**: Datumsfelder, Verteilkanäle, Metadaten.
3. Bei CSV-Einträgen erscheint unterhalb der CMS-Felder ein Bereich mit dem generierten Text, der alle verfügbaren Textformate (Reintext, HTML, Prompt) in beiden Sprachen zeigt.

### Die generierten Felder verwenden

- Klicken Sie auf die Schaltfläche **Kopieren** neben einem Feld, um dessen Wert in die Zwischenablage zu kopieren.
- Öffnen Sie das UBT-CMS in einem weiteren Browser-Tab.
- Navigieren Sie zu dem Akkordeonelement, das Sie bearbeiten möchten.
- Fügen Sie jeden Feldwert in das entsprechende CMS-Eingabefeld ein.
- Wiederholen Sie dies für alle Feldgruppen.

> **Tipp:** Arbeiten Sie die Feldgruppen von oben nach unten durch (Allgemein, Content, Flipside, Felder), um das CMS-Formular systematisch auszufüllen.

---

## Archiv

Das Archiv speichert alle Newsletter, die Sie im Editor gespeichert haben. Es dient als Newsletter-Verlauf und als Ausgangspunkt für den Versand.

### Newsletter anzeigen

- Das Archiv zeigt alle gespeicherten Newsletter in einem **Kartenraster** an.
- Jede Karte zeigt:
  - Titel des Newsletters
  - Erstellungsdatum
  - Aktueller Status (Entwurf oder Gesendet)
  - Anzahl der Abschnitte und Einträge

Klicken Sie auf eine Karte, um weitere Details zu sehen und auf Aktionen zuzugreifen.

### Newsletter-Status

Jeder Newsletter hat einen der folgenden Status:

- **Entwurf (Draft)** — Der Newsletter wurde gespeichert, aber noch nicht an Abonnenten versendet.
- **Gesendet (Sent)** — Der Newsletter wurde per E-Mail an Ihre Abonnentenliste verschickt.

Der Status wird als farbige Markierung auf jeder Karte angezeigt.

### Aktionen

Für jeden Newsletter stehen folgende Aktionen zur Verfügung:

- **Vorschau** — Öffnet eine Vollbildvorschau des Newsletter-HTML. Zeigt exakt, was Ihre Empfänger sehen werden.
- **Bearbeiten** — Kehrt zum Newsletter-Editor zurück, in dem der Newsletter geladen ist, sodass Sie Änderungen vornehmen können.
- **Duplizieren** — Erstellt eine Kopie des Newsletters. Nützlich, wenn Sie eine neue Ausgabe auf Basis einer vorherigen Vorlage erstellen möchten.
- **Senden** — Versendet den Newsletter an alle aktiven Abonnenten per E-Mail. Hierfür muss der E-Mail-Versand in den Einstellungen konfiguriert sein (siehe [E-Mail-Konfiguration](#e-mail-konfiguration)).
- **Löschen** — Entfernt den Newsletter aus dem Archiv.

---

## Abonnenten

Die Abonnentenseite verwaltet Ihre E-Mail-Verteilerliste. Alle Personen auf dieser Liste erhalten den Newsletter, wenn Sie im Archiv auf „Senden" klicken.

### Ihre E-Mail-Liste verwalten

Die Seite zeigt eine Tabelle aller Abonnenten mit folgenden Spalten:

- **E-Mail** — Die E-Mail-Adresse des Abonnenten.
- **Name** — Der Anzeigename des Abonnenten.
- **Status** — Aktiv, Inaktiv oder Ausstehend.
- **Aktionen** — Schaltflächen zum Bearbeiten oder Löschen.

Verwenden Sie die **Suchleiste** am oberen Rand, um Abonnenten nach Name oder E-Mail-Adresse zu filtern.

### Abonnenten hinzufügen

1. Klicken Sie auf die Schaltfläche **Abonnent hinzufügen**.
2. Geben Sie die E-Mail-Adresse (erforderlich) und den Namen (optional) ein.
3. Klicken Sie auf **Speichern**.
4. Neue Abonnenten erhalten standardmäßig den Status **Aktiv**.

### Google Sheets Synchronisation

Wenn Sie den E-Mail-Versand über Google Apps Script konfiguriert haben (siehe [E-Mail-Konfiguration](#e-mail-konfiguration)):

1. Klicken Sie auf der Abonnentenseite auf **Synchronisieren**.
2. Das System gleicht Ihre lokale Abonnentenliste mit dem verbundenen Google Sheet ab.
3. Neue Abonnenten aus dem Google Sheet werden lokal hinzugefügt.
4. Lokale Änderungen werden in das Google Sheet übertragen.
5. Die Synchronisation führt beide Richtungen zusammen, sodass keine Daten verloren gehen.

Dies ist besonders nützlich, wenn mehrere Personen die Abonnentenliste pflegen oder sich Abonnenten über ein Google-Formular anmelden, das in dasselbe Sheet schreibt.

### Abonnenten entfernen

Sie haben zwei Möglichkeiten, jemanden von der Liste zu entfernen:

- **Löschen**: Klicken Sie auf das Löschen-Symbol neben einem Abonnenten, um ihn dauerhaft zu entfernen.
- **Deaktivieren**: Ändern Sie den Status auf **Inaktiv**. Die Person bleibt in der Liste, erhält aber keine Newsletter mehr. Dies ist nützlich, wenn jemand sein Abonnement vorübergehend pausieren möchte.

---

## Einstellungen

Auf der Einstellungsseite konfigurieren Sie den E-Mail-Versand, die KI-Anbieter und verwalten Ihre Anwendungsdaten.

### E-Mail-Konfiguration

Der E-Mail-Bereich zeigt:

- **Statusanzeige**: Grünes Häkchen, wenn E-Mail konfiguriert ist; rotes X, wenn nicht.
- **Web-App-URL**: Geben Sie hier die URL Ihrer Google Apps Script Web-App ein, die den E-Mail-Versand übernimmt.
- **Absendername**: Der Name, der im Posteingang der Empfänger erscheint (Standard: „RAIS2 Newsletter").
- **Antwortadresse (Reply-To)**: Die E-Mail-Adresse, an die Antworten gesendet werden sollen.
- **Verbindung testen**: Klicken Sie hier, um zu prüfen, ob die Apps-Script-URL erreichbar ist und korrekt antwortet.
- **Test-E-Mail senden**: Senden Sie eine Test-E-Mail an sich selbst, um Formatierung und Zustellung zu überprüfen.

> Eine ausführliche Anleitung zur Einrichtung von Google Apps Script für den E-Mail-Versand finden Sie im [E-Mail-Einrichtungsleitfaden](email-setup-de.md).

### KI-Assistent

Der KI-Assistent hilft Ihnen beim Verfassen, Zusammenfassen und Verbessern von Newsletter-Texten. Konfigurieren Sie ihn hier:

- **Anbieter**: Wählen Sie Ihren KI-Anbieter:
  - **OpenRouter** — Kostenlose Stufe verfügbar, kein API-Schlüssel für kostenlose Modelle erforderlich.
  - **Puter/Grok** — Kostenlos, kein API-Schlüssel erforderlich.
  - **OpenAI** — Erfordert einen API-Schlüssel von OpenAI.
  - **Claude** — Erfordert einen API-Schlüssel von Anthropic.
- **API-Schlüssel**: Geben Sie Ihren API-Schlüssel ein (nur für OpenAI und Claude erforderlich).
- **Modell**: Wählen Sie das gewünschte KI-Modell des ausgewählten Anbieters.
- **System-Prompt**: Passen Sie das Verhalten der KI an. Der Standard-Prompt ist auf das Verfassen akademischer Newsletter an der Universität Bayreuth abgestimmt.

> Eine ausführliche Anleitung zur Einrichtung der einzelnen Anbieter finden Sie im [KI-Einrichtungsleitfaden](ai-setup-de.md).

### Datenverwaltung

Dieser Bereich bietet Werkzeuge zur Sicherung und Verwaltung Ihrer Daten:

- **Daten exportieren**: Laden Sie alle Ihre Anwendungsdaten (Newsletter, Einträge, Abonnenten, Einstellungen) als eine einzelne JSON-Datei herunter. **Nutzen Sie diese Funktion regelmäßig für Sicherungskopien.**
- **Daten importieren**: Laden Sie eine zuvor exportierte JSON-Datei hoch, um Ihre Daten wiederherzustellen. Dabei werden die aktuellen Daten überschrieben.
- **Cache leeren**: Entfernt zwischengespeicherte Abrufdaten. Gespeicherte Newsletter und Abonnenten sind davon nicht betroffen.
- **Gesehen-Verlauf zurücksetzen**: Setzt die Markierungen zurück, welche Einträge Sie bereits angesehen haben. Einträge erscheinen wieder als „neu".
- **Speicherverbrauch**: Zeigt an, wie viel des localStorage Ihres Browsers derzeit von der Anwendung belegt wird.

> **Wichtig:** Sämtliche Daten werden im localStorage Ihres Browsers gespeichert. Wenn Sie Ihre Browserdaten löschen, den Browser wechseln oder einen anderen Computer verwenden, sind Ihre Daten nicht vorhanden. **Exportieren Sie Ihre Daten regelmäßig** und bewahren Sie die JSON-Datei an einem sicheren Ort auf. Sie können sie jederzeit über „Daten importieren" wiederherstellen.

---

## Tipps & Tricks

### Service Worker / Cache-Probleme

Die Anwendung nutzt einen Service Worker, um Dateien für schnelleres Laden zwischenzuspeichern. Manchmal führt dies dazu, dass Änderungen nicht sofort sichtbar werden. Falls die Anwendung nicht reagiert oder Aktualisierungen nicht anzeigt:

1. **Cache-Parameter anhängen**: Fügen Sie `?nocache=1` an die URL in der Adressleiste Ihres Browsers an (z. B. `http://localhost:8080/builder.html?nocache=1`).
2. **Service Worker deregistrieren**: Öffnen Sie die Entwicklertools Ihres Browsers (Taste F12), wechseln Sie zum Tab **Application**, klicken Sie links auf **Service Workers** und dann auf **Unregister**.
3. **Browser-Cache leeren**: Drücken Sie Strg+Umschalt+Entf (Windows/Linux) bzw. Cmd+Umschalt+Entf (Mac), um den Dialog zum Löschen des Caches zu öffnen.

### Regelmäßige Sicherungen

Da alle Daten in Ihrem Browser gespeichert werden, sind regelmäßige Sicherungskopien unerlässlich:

1. Öffnen Sie **Einstellungen** über die Seitenleiste.
2. Klicken Sie auf **Daten exportieren**.
3. Speichern Sie die heruntergeladene JSON-Datei an einem sicheren Ort (z. B. auf einem gemeinsamen Netzlaufwerk oder in einer Cloud-Ablage).
4. Zum Wiederherstellen öffnen Sie die Einstellungen und klicken auf **Daten importieren**, dann wählen Sie Ihre Sicherungsdatei aus.

Wir empfehlen, nach jedem wichtigen Newsletter, den Sie erstellen oder versenden, eine Sicherung durchzuführen.

### KI-Chat-Panel

Der KI-Assistent ist auf mehreren Seiten verfügbar. Achten Sie auf das **Chat-Symbol** in der unteren rechten Ecke des Bildschirms. Die KI kann Ihnen bei folgenden Aufgaben helfen:

- **Einleitung verfassen** — Generiert einen einleitenden Absatz für Ihren Newsletter auf Basis der ausgewählten Inhalte.
- **Zusammenfassen** — Fasst einen langen Text in einer kürzeren Version zusammen.
- **Verbessern** — Optimiert bestehenden Text durch ansprechendere Formulierungen, Grammatikkorrekturen oder Tonanpassungen.
- **Veranstaltungsbeschreibung** — Erstellt eine vollständige Veranstaltungsbeschreibung aus grundlegenden Angaben (Titel, Datum, Ort).

Die KI verwendet den Anbieter und das Modell, das Sie in den Einstellungen konfiguriert haben. Kostenlose Anbieter (kostenlose OpenRouter-Modelle, Puter/Grok) funktionieren ohne API-Schlüssel.

### Tastaturkürzel

- Verwenden Sie die **Tab-Taste**, um zwischen Formularfeldern und interaktiven Elementen zu wechseln.
- **Strg+C** (Windows/Linux) bzw. **Cmd+C** (Mac) zum Kopieren von markiertem Text.
- **Strg+V** (Windows/Linux) bzw. **Cmd+V** (Mac) zum Einfügen aus der Zwischenablage.
- **Escape** zum Schließen von Dialogen, Seitenleisten und Dropdown-Menüs.
- **Enter** zum Bestätigen von Dialogen und Absenden von Formularen.

---

## Hilfe erhalten

Falls Sie auf Probleme stoßen:

1. Prüfen Sie zunächst den Abschnitt [Tipps & Tricks](#tipps--tricks) oben auf dieser Seite.
2. Versuchen Sie, den Cache zu leeren und die Seite neu zu laden.
3. Exportieren Sie Ihre Daten als Sicherungskopie, bevor Sie weitere Schritte zur Fehlerbehebung unternehmen.
4. Wenden Sie sich an das technische Team des RAIS²-Zentrums.

---

*RAIS² Newsletter Manager — Universität Bayreuth, Zentrum für Verantwortungsvolle KI in der Gesellschaft*
