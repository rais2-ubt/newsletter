# KI-Assistent Konfiguration

Der RAIS² Newsletter Manager enthält einen integrierten KI-Assistenten, der Sie beim Schreiben, Verbessern und Zusammenfassen von Newsletter-Inhalten unterstützt. Diese Anleitung erklärt, wie Sie ihn einrichten.

## Was der KI-Assistent kann

- **Einleitungen schreiben**: Einleitungsabsätze für Newsletter generieren
- **Zusammenfassen**: Lange Texte in kürzere Versionen verdichten
- **Verbessern**: Bestehende Texte optimieren (bessere Formulierungen, Struktur)
- **Veranstaltungsbeschreibungen**: Beschreibungen für Veranstaltungen und Vorträge erstellen
- **Eigene Eingaben**: Beliebige Fragen zu Ihren Newsletter-Inhalten stellen

## Kostenlose Optionen (Kein API-Schlüssel erforderlich)

### OpenRouter (Empfohlen)
Der Standardanbieter. Bietet kostenlosen Zugang zu hochwertigen KI-Modellen.

**Kostenlos verfügbare Modelle:**
- Llama 4 Maverick (400B) — Hervorragend für Schreibaufgaben
- Gemma 3 (27B) — Schnell und leistungsfähig
- DeepSeek V3 — Starke mehrsprachige Unterstützung
- Mistral Small — Gute Balance zwischen Geschwindigkeit und Qualität
- Und weitere...

**Einrichtung:**
1. Gehen Sie zu **Einstellungen** → **KI-Assistent**
2. Wählen Sie **OpenRouter** als Anbieter
3. Das war's! Kostenlose Modelle funktionieren ohne API-Schlüssel

> **Hinweis:** Kostenlose Modelle haben Nutzungslimits. Wenn Sie ein Limit erreichen, versuchen Sie ein anderes kostenloses Modell oder warten Sie einige Minuten.

### Puter.js / Grok
Vollständig kostenloser KI-Zugang über Puter.js. Kein API-Schlüssel, kein Konto erforderlich.

**Einrichtung:**
1. Gehen Sie zu **Einstellungen** → **KI-Assistent**
2. Wählen Sie **Puter / Grok** als Anbieter
3. Fertig! Es funktioniert sofort

## Kostenpflichtige Optionen (API-Schlüssel erforderlich)

### OpenAI (GPT-4, GPT-3.5)
Für die beste Ergebnisqualität.

**So erhalten Sie einen API-Schlüssel:**
1. Gehen Sie zu [platform.openai.com](https://platform.openai.com)
2. Erstellen Sie ein Konto (oder melden Sie sich an)
3. Navigieren Sie zu **API Keys** in Ihren Kontoeinstellungen
4. Klicken Sie auf **Create new secret key**
5. Kopieren Sie den Schlüssel (beginnt mit `sk-...`)

**Einrichtung in RAIS²:**
1. Gehen Sie zu **Einstellungen** → **KI-Assistent**
2. Wählen Sie **OpenAI** als Anbieter
3. Fügen Sie Ihren API-Schlüssel ein
4. Wählen Sie ein Modell (GPT-4o empfohlen)

> **Kosten:** OpenAI berechnet pro Token (ungefähr pro Wort). GPT-4o kostet etwa 2,50-10 $ pro Million Tokens. Für das Schreiben von Newslettern ist das sehr günstig — in der Regel unter 0,10 $ pro Sitzung.

### Claude / Anthropic
Anthropics Claude-Modelle, bekannt für hochwertige Texterstellung.

**So erhalten Sie einen API-Schlüssel:**
1. Gehen Sie zu [console.anthropic.com](https://console.anthropic.com)
2. Erstellen Sie ein Konto
3. Navigieren Sie zu **API Keys**
4. Erstellen Sie einen neuen Schlüssel

**Einrichtung in RAIS²:**
1. Gehen Sie zu **Einstellungen** → **KI-Assistent**
2. Wählen Sie **Claude** als Anbieter
3. Fügen Sie Ihren API-Schlüssel ein
4. Wählen Sie ein Modell

> **Hinweis:** Claude-API-Aufrufe aus dem Browser können CORS-Einschränkungen unterliegen. OpenRouter wird empfohlen, da es Zugang zu Claude-Modellen ohne diese Einschränkungen bietet.

## Den KI-Chat verwenden

### Chat öffnen
Suchen Sie das **Chat-Symbol** in der unteren rechten Ecke der Seite. Klicken Sie darauf, um das KI-Panel zu öffnen.

### Schnellaktionen
Vier voreingestellte Schaltflächen für häufige Aufgaben:
- **Einleitung schreiben** — Generiert eine Newsletter-Einleitung
- **Zusammenfassen** — Verdichtet ausgewählte Inhalte
- **Verbessern** — Optimiert die Textqualität
- **Veranstaltungsbeschreibung** — Erstellt eine Veranstaltungsbeschreibung

### Eigene Eingaben
Geben Sie eine beliebige Frage oder Anweisung in das Chat-Eingabefeld ein. Beispiele:
- "Schreiben Sie eine formelle Einleitung für den dieswöchigen Newsletter zum Thema KI-Ethik"
- "Übersetzen Sie diese Veranstaltungsbeschreibung ins Englische"
- "Machen Sie diesen Text kürzer und ansprechender"
- "Erstellen Sie einen Call-to-Action für den kommenden Workshop"

### Tipps für gute Ergebnisse
1. **Seien Sie spezifisch**: "Schreiben Sie eine 3-Satz-Einleitung über unsere KI-Ethik-Vortragsreihe" funktioniert besser als "Schreiben Sie etwas"
2. **Geben Sie Kontext**: Die KI weiß, dass sie für RAIS²-Newsletter schreibt, aber zusätzliche Details helfen
3. **Iterieren Sie**: Wenn das erste Ergebnis nicht perfekt ist, bitten Sie die KI um Anpassungen: "Kürzer bitte" oder "Verwenden Sie einen formelleren Ton"
4. **Nutzen Sie die Regenerieren-Funktion**: Klicken Sie auf das Regenerieren-Symbol bei einer KI-Nachricht, um eine alternative Version zu erhalten

## Einrichtung testen

1. Gehen Sie zu **Einstellungen** → **KI-Assistent**
2. Klicken Sie auf **KI-Verbindung testen**
3. Sie sollten eine Erfolgsmeldung mit dem Modellnamen sehen
4. Öffnen Sie den KI-Chat auf einer beliebigen Seite und probieren Sie eine Schnellaktion aus

## Anbieter wechseln

Sie können jederzeit zwischen Anbietern wechseln:
1. Gehen Sie zu **Einstellungen** → **KI-Assistent**
2. Wählen Sie einen anderen Anbieter
3. Geben Sie bei Bedarf den API-Schlüssel ein
4. Die Änderung wird sofort wirksam
