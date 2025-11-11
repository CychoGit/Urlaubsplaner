# 👔 Benutzerhandbuch für Organisations-Administratoren

**Team Urlaubsplaner** - Administrator-Handbuch

Version 1.0 | Für Organisations-Administratoren / Organization Admins

---

## 📋 Inhaltsverzeichnis

1. [Einführung](#einführung)
2. [Admin-Rolle verstehen](#admin-rolle-verstehen)
3. [Dashboard & Übersicht](#dashboard--übersicht)
4. [Urlaubsanträge genehmigen](#urlaubsanträge-genehmigen)
5. [Benutzer verwalten](#benutzer-verwalten)
6. [Organisationseinstellungen](#organisationseinstellungen)
7. [Analytics & Statistiken](#analytics--statistiken)
8. [Eigene Urlaubsanträge](#eigene-urlaubsanträge)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Einführung

### Was ist ein Organisations-Administrator?

Als **Organisations-Administrator** (kurz: Admin) sind Sie verantwortlich für:
- ✅ Genehmigung/Ablehnung von Urlaubsanträgen
- 👥 Freischaltung neuer Mitarbeiter
- ⚙️ Verwaltung der Organisationseinstellungen
- 📊 Überwachung der Team-Kapazität
- 📈 Einsicht in Analytics und Statistiken

### Ihre Rechte als Admin

Sie können:
- ✅ Alle Funktionen eines normalen Mitarbeiters nutzen
- ✅ Urlaubsanträge Ihrer Organisation genehmigen/ablehnen
- ✅ Neue Benutzer freischalten
- ✅ Organisationseinstellungen ändern
- ✅ Analytics und Statistiken einsehen

Sie können NICHT:
- ❌ Neue Organisationen erstellen (nur Tenant Admin)
- ❌ Benutzer-Rollen ändern (nur Tenant Admin)
- ❌ Ihre eigenen Urlaubsanträge genehmigen (Vier-Augen-Prinzip!)
- ❌ Auf andere Organisationen zugreifen

> 💡 **Hinweis**: Wenn Sie Funktionen benötigen, die Sie nicht haben, wenden Sie sich an den Tenant Admin (System-Administrator).

---

## Admin-Rolle verstehen

### Rollenhierarchie

```
Tenant Admin (System-Administrator)
    └── Admin (Organisations-Administrator) ← Sie sind hier!
        └── Employee (Mitarbeiter)
```

### Ihre Organisation

- Sie verwalten **Ihre eigene Organisation**
- Sie sehen nur Daten Ihrer Organisation
- Sie haben keinen Zugriff auf andere Organisationen

### Mehrere Administratoren

- Eine Organisation kann mehrere Administratoren haben
- Alle Admins haben die gleichen Rechte
- Koordinieren Sie sich untereinander bei größeren Änderungen

---

## Dashboard & Übersicht

Nach der Anmeldung sehen Sie Ihr **Admin-Dashboard**.

### Dashboard-Bereiche

#### 1. Statistik-Übersicht

| Kennzahl | Bedeutung |
|----------|-----------|
| **Ausstehende Anträge** | Anzahl der Anträge, die auf Ihre Genehmigung warten |
| **Team-Abwesenheiten heute** | Wie viele Mitarbeiter sind heute abwesend |
| **Team-Kapazität** | Prozent der verfügbaren Mitarbeiter |
| **Kritische Tage** | Tage mit sehr vielen Abwesenheiten |

#### 2. Schnellzugriffe

- 🔔 **Ausstehende Anträge** - Direkt zu den zu genehmigenden Anträgen
- 👥 **Neue Benutzer** - Benutzer, die auf Freischaltung warten
- 📊 **Analytics** - Detaillierte Auswertungen
- ⚙️ **Einstellungen** - Organisations-Konfiguration

#### 3. Team-Kalender

- Übersicht über alle Abwesenheiten
- Farbliche Markierung nach Status
- Klickbar für Details

---

## Urlaubsanträge genehmigen

### Ausstehende Anträge ansehen

#### Weg 1: Dashboard
- Klicken Sie im Dashboard auf **"Ausstehende Anträge"** (Zahl in der Badge)

#### Weg 2: Navigation
- Klicken Sie auf **"Admin"** → **"Anträge genehmigen"**

### Antragsliste

Sie sehen eine Liste aller ausstehenden Anträge mit:
- 👤 Name des Mitarbeiters
- 📅 Zeitraum (Start- und Enddatum)
- 📊 Anzahl der Tage
- 🏷️ Urlaubstyp
- 💬 Bemerkung (falls vorhanden)
- ⚡ Aktionen (Genehmigen/Ablehnen)

### Antrag im Detail prüfen

Klicken Sie auf einen Antrag, um Details zu sehen:

#### Mitarbeiter-Informationen
- Name, E-Mail, Rolle
- Aktueller Urlaubssaldo
- Bereits genommene Tage
- Ausstehende Anträge

#### Antrags-Details
- Genaue Daten (inkl. Wochentage)
- Anzahl der Werktage
- Urlaubstyp
- Bemerkung
- Erstellungsdatum

#### Team-Auslastung
- **Wichtig!** Sehen Sie, wie viele Kollegen im gleichen Zeitraum abwesend sind
- Prozent der verfügbaren Mitarbeiter
- Kritische Tage (rot markiert, wenn < 50% verfügbar)

### Antrag genehmigen

**Wenn alles in Ordnung ist:**

1. Klicken Sie auf **"Genehmigen"** (✅ grüner Button)
2. Optional: Fügen Sie eine Nachricht hinzu (z.B. "Viel Spaß im Urlaub!")
3. Bestätigen Sie mit **"Ja, genehmigen"**

**Was passiert:**
- ✅ Status ändert sich auf "Genehmigt"
- 📧 Mitarbeiter erhält eine Benachrichtigung
- 📅 Urlaub erscheint im Team-Kalender
- 📊 Urlaubssaldo des Mitarbeiters wird angepasst

### Antrag ablehnen

**Wenn Sie den Antrag nicht genehmigen können:**

1. Klicken Sie auf **"Ablehnen"** (❌ roter Button)
2. **Wichtig!** Geben Sie einen Grund an:
   - "Zu viele Abwesenheiten im Team im gleichen Zeitraum"
   - "Urlaubssaldo reicht nicht aus"
   - "Wichtiges Projekt läuft in diesem Zeitraum"
   - etc.
3. Bestätigen Sie mit **"Ja, ablehnen"**

**Was passiert:**
- ❌ Status ändert sich auf "Abgelehnt"
- 📧 Mitarbeiter erhält eine Benachrichtigung mit Ihrem Ablehnungsgrund
- 📊 Keine Änderung am Urlaubssaldo

> 💡 **Tipp**: Geben Sie immer einen klaren Ablehnungsgrund an, damit der Mitarbeiter weiß, warum und ggf. alternative Termine planen kann!

### Entscheidungshilfen

#### ✅ Wann sollten Sie genehmigen?

- ✓ Mitarbeiter hat ausreichend Urlaubssaldo
- ✓ Team-Kapazität ist ausreichend (mindestens 50% verfügbar)
- ✓ Keine kritischen Projekte/Deadlines
- ✓ Angemessene Vorlaufzeit (mind. 2-4 Wochen empfohlen)

#### ❌ Wann sollten Sie ablehnen?

- ✗ Zu viele Kollegen sind bereits im Urlaub
- ✗ Urlaubssaldo reicht nicht aus
- ✗ Wichtige Deadlines/Projekte
- ✗ Zu kurzfristig (außer Notfall/Krankheit)
- ✗ Betriebliche Gründe (z.B. Hochsaison)

### Massenaktionen

Bei vielen ausstehenden Anträgen:

1. Wählen Sie mehrere Anträge aus (Checkboxen)
2. Klicken Sie auf **"Alle genehmigen"** oder **"Alle ablehnen"**
3. Bestätigen Sie die Aktion

> ⚠️ **Vorsicht**: Bei Massenablehnung müssen Sie trotzdem einen Grund angeben!

### Das Vier-Augen-Prinzip

**Sie können Ihre eigenen Anträge NICHT genehmigen!**

- System blockiert automatisch Self-Approval
- Ein anderer Admin muss Ihren Antrag genehmigen
- ODER: Der Tenant Admin kann Ihren Antrag genehmigen

> 🔒 **Warum?** Dies verhindert Missbrauch und stellt sicher, dass jeder Antrag von einer anderen Person geprüft wird.

---

## Benutzer verwalten

### Neue Benutzer freischalten

#### Prozess verstehen

1. **Mitarbeiter registriert sich** selbst auf der Website
2. **Konto ist inaktiv** bis zur Freischaltung
3. **Sie prüfen und schalten frei**
4. **Mitarbeiter kann sich einloggen**

#### Wartende Benutzer ansehen

**Weg 1: Dashboard**
- Badge "Neue Benutzer" zeigt Anzahl
- Klicken Sie darauf

**Weg 2: Navigation**
- **"Admin"** → **"Benutzer verwalten"** → Tab **"Wartend"**

#### Benutzer prüfen

Sie sehen für jeden wartenden Benutzer:
- 👤 Vor- und Nachname
- 📧 E-Mail-Adresse
- 🏢 Gewählte Organisation (sollte Ihre sein!)
- 📅 Registrierungsdatum

**Prüfen Sie:**
- ✓ Ist die Person wirklich Teil Ihres Teams?
- ✓ Ist die E-Mail-Adresse korrekt?
- ✓ Richtige Organisation gewählt?

#### Benutzer genehmigen

**Wenn alles stimmt:**

1. Klicken Sie auf **"Genehmigen"** (✅)
2. Optional: Rolle wählen (normalerweise "Mitarbeiter")
3. Optional: Initiale Urlaubstage festlegen (z.B. 30)
4. Klicken Sie auf **"Benutzer freischalten"**

**Was passiert:**
- ✅ Konto wird aktiviert
- 📧 Benutzer erhält Willkommens-E-Mail
- 👤 Benutzer kann sich einloggen
- 📊 Urlaubssaldo wird gesetzt

#### Benutzer ablehnen

**Wenn etwas nicht stimmt** (falsche Organisation, Spam, etc.):

1. Klicken Sie auf **"Ablehnen"** (❌)
2. Optional: Grund angeben
3. Bestätigen Sie

**Was passiert:**
- ❌ Konto wird gelöscht
- 📧 Optional: Benutzer wird benachrichtigt

### Bestehende Benutzer verwalten

#### Benutzerliste

**"Admin"** → **"Benutzer verwalten"** → Tab **"Alle Benutzer"**

Sie sehen alle Mitarbeiter Ihrer Organisation:
- 👤 Name
- 📧 E-Mail
- 🎭 Rolle (Admin/Mitarbeiter)
- 📊 Urlaubssaldo
- 🟢 Status (Aktiv/Inaktiv)
- ⚡ Aktionen

#### Benutzer-Details bearbeiten

1. Klicken Sie auf einen Benutzer
2. Klicken Sie auf **"Bearbeiten"**
3. Sie können ändern:
   - Vor- und Nachname
   - E-Mail-Adresse
   - Urlaubssaldo anpassen
   - Status (Aktiv/Inaktiv)

4. Klicken Sie auf **"Speichern"**

#### Urlaubssaldo anpassen

**Wann notwendig?**
- Neues Jahr: Resturlaub übertragen
- Korrekturen bei Fehlern
- Sonderurlaub gewähren
- Abzug bei vorzeitigem Austritt

**Wie geht's?**
1. Benutzer auswählen → **"Bearbeiten"**
2. Feld **"Urlaubssaldo"** anpassen
3. Optional: Grund/Notiz hinzufügen
4. Speichern

> 💡 **Tipp**: Dokumentieren Sie größere Anpassungen intern!

#### Benutzer deaktivieren

**Wann?** Wenn ein Mitarbeiter das Unternehmen verlässt.

1. Benutzer auswählen → **"Bearbeiten"**
2. Status auf **"Inaktiv"** setzen
3. Speichern

**Effekt:**
- ❌ Benutzer kann sich nicht mehr einloggen
- 📊 Erscheint nicht mehr im Team-Kalender
- 💾 Daten bleiben erhalten (für Archivierung)

> ⚠️ **Nicht löschen!** Deaktivieren Sie statt zu löschen, um Daten zu behalten.

---

## Organisationseinstellungen

### Einstellungen öffnen

**"Admin"** → **"Organisationseinstellungen"** ODER **"Einstellungen"** → **"Organisation"**

### Grundeinstellungen

#### Organisationsname
- Ändern Sie den Namen Ihrer Organisation
- Wird in Navigationsleiste und Benachrichtigungen angezeigt

#### Zeitzone
- Wichtig für korrekte Datumsanzeige
- Wählen Sie Ihre lokale Zeitzone (z.B. "Europe/Berlin")

### Urlaubsregelungen

#### Standard-Urlaubstage
- Anzahl der Urlaubstage pro Jahr für neue Mitarbeiter
- Z.B. 30 Tage

#### Urlaubstypen aktivieren/deaktivieren

| Typ | Empfohlen? | Verwendung |
|-----|------------|------------|
| **Urlaub** | ✅ Ja | Regulärer bezahlter Urlaub |
| **Unbezahlter Urlaub** | ⚠️ Optional | Sonderregelungen |
| **Sonderurlaub** | ✅ Ja | Hochzeit, Umzug, Geburt, etc. |
| **Krankheit** | ✅ Ja | Krankmeldungen |
| **Home Office** | ⚠️ Optional | Falls Sie das tracken möchten |

#### Regeln

##### Vorlaufzeit für Anträge
- Mindestanzahl Tage vor Urlaubsbeginn
- Z.B. "14 Tage" = Anträge müssen 2 Wochen vorher eingereicht werden
- Ausnahme: Krankheit

##### Rückwirkende Anträge erlauben?
- **Ja**: Mitarbeiter können nachträglich Urlaub eintragen (z.B. für vergessene Krankheitstage)
- **Nein**: Nur zukünftige Daten erlaubt

##### Maximale Urlaubsdauer
- Längste erlaubte zusammenhängende Urlaubsdauer
- Z.B. "21 Tage"
- Verhindert zu lange Abwesenheiten

##### Mindest-Teambesetzung
- Prozent der Mitarbeiter, die anwesend sein müssen
- Z.B. "50%" = Mindestens die Hälfte muss da sein
- System warnt, wenn unterschritten

### Feiertage

#### Bundesland/Region wählen
- Wählen Sie Ihr Bundesland aus
- System lädt automatisch gesetzliche Feiertage

#### Zusätzliche Feiertage
- Fügen Sie firmeninterne Feiertage hinzu
- Z.B. "Betriebsurlaub 24.-31. Dezember"

**Hinzufügen:**
1. Klicken Sie auf **"Feiertag hinzufügen"**
2. Datum wählen
3. Beschreibung eingeben (z.B. "Betriebsfeier")
4. Speichern

### Benachrichtigungen

#### E-Mail-Benachrichtigungen

Aktivieren/Deaktivieren Sie:
- ☑️ Neue Urlaubsanträge (an Admins)
- ☑️ Genehmigte Anträge (an Mitarbeiter)
- ☑️ Abgelehnte Anträge (an Mitarbeiter)
- ☑️ Neue Benutzer-Registrierungen (an Admins)

### Logo hochladen

Personalisieren Sie Ihre Organisation:
1. Klicken Sie auf **"Logo hochladen"**
2. Wählen Sie eine Bilddatei (PNG, JPG)
3. Empfohlen: 200x200 Pixel, max. 2 MB
4. Logo wird in Navigation angezeigt

### Urlaubssaldo-Tracking

#### Was ist Urlaubssaldo-Tracking?

Das **Urlaubssaldo-Tracking** Feature ermöglicht es Mitarbeitern, ihre Urlaubssaldo-Karte auf dem Dashboard zu sehen. Dieses Feature verwendet ein **zweistufiges Gating-System** für maximale Kontrolle und Datenschutz.

#### Zweistufiges Gating erklärt

Das Feature erfordert **zwei unabhängige Aktivierungen**:

1. **Organisations-Ebene** (Sie als Admin): Aktivieren Sie das Feature für Ihre gesamte Organisation
2. **Benutzer-Ebene** (Ihre Mitarbeiter): Jeder Mitarbeiter entscheidet selbst, ob er das Feature nutzen möchte

**Wichtig:** Die Urlaubssaldo-Karte wird auf dem Dashboard **NUR** angezeigt, wenn **BEIDE** Einstellungen aktiviert sind!

| Org-Einstellung | User-Einstellung | Dashboard-Anzeige | Ergebnis |
|-----------------|------------------|-------------------|----------|
| ✅ Aktiviert | ✅ Aktiviert | ✅ Saldo sichtbar | Feature wird genutzt |
| ✅ Aktiviert | ❌ Deaktiviert | ❌ Saldo verborgen | Benutzer hat es ausgeschaltet |
| ❌ Deaktiviert | ✅ Aktiviert | ❌ Saldo verborgen | Organisation erlaubt es nicht |
| ❌ Deaktiviert | ❌ Deaktiviert | ❌ Saldo verborgen | Feature nicht aktiv |

#### Warum zweistufiges Gating?

**Vorteile:**
- **Datenschutz**: Ihre Organisation kann entscheiden, ob Saldo-Daten überhaupt angezeigt werden
- **Benutzer-Autonomie**: Mitarbeiter können selbst entscheiden, ob sie das Feature nutzen möchten
- **Flexibilität**: Ermöglicht schrittweise Einführung oder Test-Phasen

**Anwendungsfälle:**
- **Datenschutz-sensitive Organisationen**: Deaktivieren Sie das Feature org-weit
- **Transparente Organisationen**: Aktivieren Sie es und lassen Mitarbeiter selbst entscheiden
- **Test-Phase**: Aktivieren Sie es für die Organisation, Mitarbeiter können es testen

#### Urlaubssaldo-Tracking aktivieren/deaktivieren

1. **Einstellungen öffnen**
   - Navigieren Sie zu **"Einstellungen"** → **"Organisation"**
   - ODER: **"Admin"** → **"Organisationseinstellungen"**

2. **Abschnitt "Urlaubssaldo-Tracking" finden**
   - Scrollen Sie zum Abschnitt **"Features"** oder **"Urlaubssaldo-Tracking"**

3. **Toggle umschalten**
   - ✅ **Aktiviert**: Mitarbeiter können das Feature in ihren persönlichen Einstellungen aktivieren
   - ❌ **Deaktiviert**: Feature ist für alle Mitarbeiter deaktiviert (unabhängig von ihrer Einstellung)

4. **Speichern**
   - Klicken Sie auf **"Einstellungen speichern"**
   - Änderung wird sofort wirksam

#### Was Mitarbeiter sehen

**Wenn aktiviert (Organisation UND Benutzer):**
- Dashboard zeigt Urlaubssaldo-Karte mit:
  - Verfügbare Tage
  - Genommene Tage
  - Beantragte Tage (ausstehend)
  - Verbleibende Tage

**Wenn deaktiviert:**
- Keine Saldo-Karte auf dem Dashboard
- Mitarbeiter können ihre Urlaubstage trotzdem in ihrem Profil oder in der Antragsübersicht sehen

#### Häufige Fragen

**❓ Was passiert, wenn ich das Feature deaktiviere?**
- Alle Mitarbeiter verlieren sofort die Saldo-Karte auf ihrem Dashboard
- Die eigentlichen Urlaubssaldo-Daten bleiben unverändert

**❓ Können Mitarbeiter das Feature selbst aktivieren, wenn ich es deaktiviert habe?**
- Nein! Wenn Sie als Admin das Feature org-weit deaktivieren, können Mitarbeiter es nicht nutzen

**❓ Kann ich sehen, welche Mitarbeiter das Feature aktiviert haben?**
- Das ist eine persönliche Einstellung der Mitarbeiter, Sie haben keine Übersicht darüber

**❓ Sollte ich das Feature aktivieren?**
- **Ja**, wenn Sie Transparenz über Urlaubssalden fördern möchten
- **Nein**, wenn Ihre Organisation aus Datenschutzgründen diese Information nicht auf dem Dashboard anzeigen möchte

#### Empfehlung

💡 **Best Practice**: Aktivieren Sie das Feature und informieren Sie Ihre Mitarbeiter, dass sie es in ihren persönlichen Einstellungen nutzen können. So haben Ihre Mitarbeiter die Wahl!

---

## Analytics & Statistiken

### Analytics-Übersicht öffnen

**"Admin"** → **"Analytics"** ODER **"Berichte"**

### Verfügbare Berichte

#### 1. Urlaubsübersicht

**Zeitraum wählen:** Letzte 30/90/365 Tage, oder individuell

| Metrik | Beschreibung |
|--------|--------------|
| **Gesamt beantragt** | Anzahl aller eingereichten Anträge |
| **Genehmigt** | Anzahl genehmigter Anträge |
| **Abgelehnt** | Anzahl abgelehnter Anträge |
| **Ausstehend** | Aktuell wartende Anträge |
| **Durchschn. Bearbeitungszeit** | Wie lange dauert die Genehmigung? |

#### 2. Team-Kapazität

**Visualisierung:** Kalender-Heatmap

- Zeigt für jeden Tag: Wie viele Mitarbeiter sind abwesend?
- Farbcodierung:
  - 🟢 Grün: < 25% abwesend (gut)
  - 🟡 Gelb: 25-50% abwesend (OK)
  - 🔴 Rot: > 50% abwesend (kritisch)

**Nutzen:** Erkennen Sie kritische Zeiträume und planen Sie vorausschauend!

#### 3. Mitarbeiter-Statistiken

Tabelle mit allen Mitarbeitern:
- 👤 Name
- 📊 Verfügbare Tage
- 📊 Genommene Tage
- 📊 Verbleibende Tage
- 📈 Nutzungsrate (%)

**Sortierbar:** Finden Sie Mitarbeiter mit viel/wenig Resturlaub.

#### 4. Urlaubstypen-Verteilung

Diagramm (Kreisdiagramm):
- Wie viele Tage wurden pro Urlaubstyp genommen?
- Z.B. 80% Urlaub, 15% Krankheit, 5% Sonderurlaub

#### 5. Saisonale Trends

Liniendiagramm über das Jahr:
- Wann werden am meisten Urlaubstage genommen?
- Hilft bei der Planung für nächstes Jahr

### Berichte exportieren

1. Wählen Sie den gewünschten Bericht
2. Klicken Sie auf **"Exportieren"**
3. Format wählen: CSV, Excel, PDF
4. Datei wird heruntergeladen

**Nutzen:** Für interne Dokumentation oder HR-Berichte.

---

## Eigene Urlaubsanträge

Als Administrator sind Sie **auch ein Mitarbeiter**!

### Eigenen Urlaub beantragen

Sie beantragen Urlaub genauso wie normale Mitarbeiter:
1. **"Neuer Urlaubsantrag"**
2. Daten eingeben
3. Einreichen

**Wichtig:**
- ❌ Sie können Ihren eigenen Antrag NICHT genehmigen!
- ✅ Ein anderer Admin Ihrer Organisation muss genehmigen
- ODER: Der Tenant Admin kann genehmigen

### Koordination mit anderen Admins

Falls Sie mehrere Admins haben:
- Koordinieren Sie sich untereinander
- Vermeiden Sie, dass alle Admins gleichzeitig Urlaub nehmen
- Stellen Sie sicher, dass immer jemand Anträge genehmigen kann!

> 💡 **Tipp**: Vereinbaren Sie eine Vertretungsregelung für Urlaubszeiten!

---

## Best Practices

### Genehmigungsprozess

#### ✅ DO's

- ✅ **Zeitnah genehmigen**: Bearbeiten Sie Anträge innerhalb von 1-3 Werktagen
- ✅ **Gründlich prüfen**: Schauen Sie sich Team-Auslastung an
- ✅ **Klare Kommunikation**: Bei Ablehnung immer Grund angeben
- ✅ **Fair sein**: Behandeln Sie alle Mitarbeiter gleich
- ✅ **Vorlauf respektieren**: Früh eingereichte Anträge bevorzugen

#### ❌ DON'Ts

- ❌ **Nicht verschleppen**: Anträge nicht wochenlang liegen lassen
- ❌ **Keine Bevorzugung**: Keine Vorzugsbehandlung einzelner Mitarbeiter
- ❌ **Nicht pauschal ablehnen**: Jeder Antrag verdient individuelle Prüfung
- ❌ **Keine Ablehnung ohne Grund**: Immer Begründung angeben

### Team-Management

#### Urlaubsplanung fördern

- Ermutigen Sie Mitarbeiter, frühzeitig zu planen (3-6 Monate voraus)
- Nutzen Sie Team-Meetings zur Urlaubskoordination
- Sprechen Sie Mitarbeiter an, die wenig Urlaub nehmen

#### Überlastung vermeiden

- Achten Sie auf kritische Zeiträume (z.B. Sommermonate)
- Begrenzen Sie gleichzeitige Abwesenheiten
- Koordinieren Sie mit anderen Abteilungen

#### Fairness

- Erste Anträge für beliebte Zeiten haben Vorrang (First-Come-First-Served)
- Rotieren Sie bei wiederkehrenden Engpässen (z.B. Weihnachten)
- Dokumentieren Sie Entscheidungen bei Konflikten

### Kommunikation

#### Mit Mitarbeitern

- Seien Sie ansprechbar bei Fragen
- Erklären Sie Ablehnungen klar und freundlich
- Bieten Sie Alternativen an

#### Mit anderen Admins

- Stimmen Sie sich ab bei größeren Änderungen
- Informieren Sie sich gegenseitig über Abwesenheiten
- Teilen Sie Erfahrungen und Best Practices

### Jahreswechsel

#### Vorbereitung

1. **November/Dezember**: Erinnern Sie Mitarbeiter an Resturlaub
2. **Prüfen**: Wer hat noch viele Tage übrig?
3. **Planen**: Resturlaubsübertragung koordinieren
4. **Anpassen**: Nach Jahreswechsel neue Urlaubskontingente setzen

#### Urlaubssaldo-Reset

1. **Resturlaub feststellen**: Wer hat wie viel übrig?
2. **Übertragen**: Je nach Firmenregelung (z.B. max. 5 Tage übertragbar)
3. **Neue Kontingente**: Alle Mitarbeiter auf Standard-Urlaubstage setzen (z.B. 30)
4. **Dokumentieren**: Übertragungen intern festhalten

---

## Troubleshooting

### Häufige Probleme & Lösungen

#### ❓ "Ich kann meinen eigenen Antrag nicht genehmigen"

**Ursache:** Vier-Augen-Prinzip (Self-Approval ist blockiert)

**Lösung:**
- Ein anderer Admin muss Ihren Antrag genehmigen
- Falls kein anderer Admin: Tenant Admin kontaktieren
- Oder: Zweiten Admin ernennen lassen

#### ❓ "Mitarbeiter beschwert sich über Ablehnung"

**Ursache:** Mitarbeiter versteht Grund nicht oder findet ihn unfair

**Lösung:**
1. Ruhe bewahren
2. Persönlich sprechen (nicht nur E-Mail)
3. Situation erklären (Team-Auslastung, Projekte, etc.)
4. Alternative Termine vorschlagen
5. Bei Bedarf: Kompromiss finden

#### ❓ "Zu viele ausstehende Anträge"

**Ursache:** Lange nicht reingeguckt oder Urlaubssaison

**Lösung:**
1. Zeit blocken für Genehmigungen (z.B. 30 Min. täglich)
2. Nach Priorität sortieren (älteste zuerst)
3. Bei Unsicherheit: Mit anderen Admins besprechen
4. Team-Kalender checken für jeden Antrag

#### ❓ "Urlaubssaldo eines Mitarbeiters ist falsch"

**Ursache:** Fehlhafte Ersteinstellung, nicht übertragener Resturlaub, oder Systemfehler

**Lösung:**
1. Prüfen: Aktuelle Anträge und Historie ansehen
2. Korrigieren: Urlaubssaldo manuell anpassen
3. Mitarbeiter informieren
4. Falls Systemfehler: Tenant Admin oder IT kontaktieren

#### ❓ "Mitarbeiter kann sich nicht einloggen nach Freischaltung"

**Ursache:** Verzögerung, Cache, oder falsches Passwort

**Lösung:**
1. Prüfen: Ist Benutzer wirklich auf "Aktiv" geschaltet?
2. Mitarbeiter bitten: Browser-Cache leeren und neu versuchen
3. Passwort zurücksetzen (falls verfügbar)
4. Falls Problem bleibt: IT-Support kontaktieren

#### ❓ "Organisationseinstellungen speichern nicht"

**Ursache:** Berechtigungsproblem oder Netzwerkfehler

**Lösung:**
1. Seite neu laden und erneut versuchen
2. Prüfen: Haben Sie wirklich Admin-Rechte?
3. Browser-Konsole öffnen (F12) und nach Fehlern suchen
4. Falls persistiert: IT-Support oder Tenant Admin kontaktieren

---

## 📞 Support & Hilfe

### Eskalationspfad

| Stufe | Kontakt | Für welche Probleme? |
|-------|---------|----------------------|
| **1. Andere Admins** | Ihre Admin-Kollegen | Entscheidungsfragen, Best Practices |
| **2. Tenant Admin** | System-Administrator | Berechtigungen, Organisationen, Rollen |
| **3. IT-Support** | [it-support@firma.de] | Technische Probleme, Bugs |
| **4. HR/Personal** | Personalabteilung | Urlaubsregelungen, Rechtliches |

### Weitere Ressourcen

- 📖 [HANDBUCH_MITARBEITER.md](./HANDBUCH_MITARBEITER.md) - Mitarbeiter-Handbuch
- 📖 [HANDBUCH_TENANT_ADMIN.md](./HANDBUCH_TENANT_ADMIN.md) - Tenant Admin Handbuch
- 🔐 [PERMISSIONS.md](./PERMISSIONS.md) - Berechtigungsmatrix
- 💻 [GitHub Repository](https://github.com/IhrUsername/TeamUrlaubplaner)

---

## ✅ Admin-Checkliste

### Täglich
- [ ] Ausstehende Urlaubsanträge prüfen und genehmigen
- [ ] Neue Benutzer-Registrierungen prüfen

### Wöchentlich
- [ ] Team-Kalender checken: Kritische Zeiträume?
- [ ] Mitarbeiter mit viel Resturlaub ansprechen (gegen Jahresende)

### Monatlich
- [ ] Analytics ansehen: Trends erkennen
- [ ] Team-Kapazität prüfen: Unterbesetzungen?

### Jährlich
- [ ] Resturlaub zum Jahreswechsel regeln
- [ ] Neue Urlaubskontingente setzen
- [ ] Organisationseinstellungen überprüfen
- [ ] Feiertage für neues Jahr aktualisieren

---

**Viel Erfolg als Organisations-Administrator!** 👔

Sie tragen Verantwortung für ein ausgeglichenes und produktives Team. Ihre Fairness und zeitnahe Bearbeitung sind entscheidend für die Zufriedenheit Ihrer Mitarbeiter!

---

*Zuletzt aktualisiert: November 2025*
*Version: 1.0*
