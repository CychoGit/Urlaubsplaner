# 🔐 Benutzerhandbuch für Tenant Administratoren

**Team Urlaubsplaner** - System-Administrator-Handbuch

Version 1.0 | Für Tenant Admins / System-Administratoren

---

## 📋 Inhaltsverzeichnis

1. [Einführung & Rolle](#einführung--rolle)
2. [Erste Schritte nach Installation](#erste-schritte-nach-installation)
3. [Organisationen verwalten](#organisationen-verwalten)
4. [Benutzer-Rollen verwalten](#benutzer-rollen-verwalten)
5. [System-Administration](#system-administration)
6. [Multi-Tenant-Management](#multi-tenant-management)
7. [Sicherheit & Compliance](#sicherheit--compliance)
8. [Backup & Wartung](#backup--wartung)
9. [Troubleshooting & Support](#troubleshooting--support)
10. [Best Practices](#best-practices)

---

## Einführung & Rolle

### Was ist ein Tenant Administrator?

Als **Tenant Administrator** (kurz: Tenant Admin) sind Sie der **System-Administrator** mit den höchsten Rechten:

- 🏢 Verwalten Sie **alle Organisationen** im System
- 👥 Erstellen und löschen Sie Organisationen
- 🎭 Ändern Sie Benutzer-Rollen system-weit
- ⚙️ Konfigurieren Sie system-weite Einstellungen
- 🔍 Überwachen Sie das gesamte System

### Rollenhierarchie

```
Tenant Admin (System-Administrator) ← Sie sind hier!
    └── Admin (Organisations-Administrator)
        └── Employee (Mitarbeiter)
```

### Ihre Rechte

✅ **Sie können ALLES:**
- Alle Funktionen von Admins und Mitarbeitern
- Organisationen erstellen, bearbeiten, löschen
- Benutzer-Rollen ändern (Mitarbeiter ↔ Admin)
- Benutzer zwischen Organisationen verschieben
- System-weite Einstellungen verwalten
- Auf alle Organisationen zugreifen

⚠️ **Mit großer Macht kommt große Verantwortung:**
- Sie sind verantwortlich für das gesamte System
- Ihre Aktionen betreffen alle Benutzer
- Sicherheit und Datenschutz liegen in Ihrer Hand

### Wann brauchen Sie diese Rolle?

- Bei **Self-Hosting** auf eigenem Server
- Als **IT-Administrator** Ihrer Firma
- Für **Multi-Tenant-Setups** (mehrere Organisationen/Abteilungen)
- Für **System-Wartung** und Konfiguration

---

## Erste Schritte nach Installation

### Initial-Login

Nach der Installation existiert ein Standard-Admin-Konto:

```
E-Mail: tenantadmin@system.local
Passwort: TenantAdmin
```

> 🔐 **WICHTIG**: Ändern Sie dieses Passwort SOFORT nach dem ersten Login!

### Passwort ändern (Pflicht!)

1. Einloggen mit Standard-Zugangsdaten
2. Oben rechts auf Ihr Profil klicken → **"Einstellungen"**
3. **"Sicherheit"** → **"Passwort ändern"**
4. Neues, sicheres Passwort setzen:
   - Mindestens 12 Zeichen
   - Mix aus Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen
   - Nicht einfach zu erraten

### System-Check nach Installation

#### ✅ Checkliste

- [ ] Passwort geändert
- [ ] E-Mail-Adresse angepasst (falls nicht `tenantadmin@system.local` behalten möchten)
- [ ] Profil ausgefüllt (Name, etc.)
- [ ] Erste Organisation erstellt
- [ ] Ersten Organisations-Admin ernannt
- [ ] System-Einstellungen geprüft
- [ ] Backup-Strategie eingerichtet

---

## Organisationen verwalten

### Organisationen-Konzept verstehen

#### Was ist eine Organisation?

Eine **Organisation** ist eine isolierte Einheit im System:
- Entspricht z.B. einer **Abteilung**, **Filiale**, oder **Tochtergesellschaft**
- Jede Organisation hat eigene:
  - Mitarbeiter
  - Administratoren
  - Urlaubsanträge
  - Kalender
  - Einstellungen

#### Isolation

- Mitarbeiter von Org A sehen NICHT Daten von Org B
- Admins von Org A können NICHT Anträge von Org B genehmigen
- **NUR Sie** als Tenant Admin haben Zugriff auf alles

### Organisationen-Übersicht

**Navigation:** **"Tenant Admin"** → **"Organisationen"**

Sie sehen eine Liste aller Organisationen:
- 🏢 Organisationsname
- 👥 Anzahl Mitarbeiter
- 👔 Anzahl Admins
- 📊 Aktive/Inaktive Mitarbeiter
- ⚡ Aktionen (Bearbeiten, Löschen)

### Neue Organisation erstellen

#### Wann erstellen?

- Neue Abteilung im Unternehmen
- Neue Filiale
- Tochtergesellschaft
- Projekt-Team mit eigener Urlaubsverwaltung

#### Schritt-für-Schritt

1. **"Tenant Admin"** → **"Organisationen"** → **"Neue Organisation"**

2. **Formular ausfüllen:**
   ```
   Name: [Z.B. "Marketing", "Vertrieb Berlin", "IT-Abteilung"]
   Beschreibung: [Optional, z.B. "Marketing-Team am Standort München"]
   Standard-Urlaubstage: [Z.B. 30 Tage]
   Zeitzone: [Z.B. "Europe/Berlin"]
   ```

3. **"Organisation erstellen"** klicken

4. **Organisation ist erstellt!** Aber noch leer (keine Mitarbeiter).

#### Nach Erstellung

Nun müssen Sie:
1. **Ersten Admin ernennen** (siehe unten)
2. **Mitarbeiter zuweisen** oder neu registrieren lassen
3. **Org-Einstellungen feintunen** (optional)

### Organisation bearbeiten

1. Organisations-Liste → **"Bearbeiten"** (Stift-Symbol) bei gewünschter Org
2. Sie können ändern:
   - Name
   - Beschreibung
   - Standard-Urlaubstage
   - Zeitzone
   - Logo
3. **"Speichern"**

### Organisation löschen

> ⚠️ **VORSICHT**: Dies löscht auch alle Mitarbeiter, Anträge, und Daten dieser Organisation!

**Wann löschen?**
- Organisation/Abteilung wird aufgelöst
- Testdaten aufräumen
- Fehlerhafte Erstellung korrigieren

**Sicher löschen:**

1. **Backup erstellen!** (Datenbank-Backup, siehe Abschnitt weiter unten)
2. **Mitarbeiter informieren** (falls noch aktiv)
3. **Daten exportieren** (falls benötigt für Archivierung)
4. Organisations-Liste → **"Löschen"** (Papierkorb) bei gewünschter Org
5. **Bestätigung**: Geben Sie Organisationsnamen ein (Sicherheitscheck)
6. **"Endgültig löschen"**

**Was wird gelöscht:**
- ❌ Alle Mitarbeiter dieser Organisation (Benutzerkonten!)
- ❌ Alle Urlaubsanträge
- ❌ Alle Einstellungen
- ❌ Logo und Anpassungen

> 💾 **Alternative**: Organisation auf "Inaktiv" setzen statt löschen (Feature ggf. in Zukunft)

---

## Benutzer-Rollen verwalten

### Rollen-Übersicht

| Rolle | Rechte | Anzahl pro Org |
|-------|--------|----------------|
| **tenant_admin** | Alles (Sie!) | 1-2 (system-weit) |
| **admin** | Org-Verwaltung | 1-5 pro Org |
| **employee** | Urlaubsanträge erstellen | Unbegrenzt |

### Rollen ändern

**Wann?**
- Mitarbeiter zum Admin befördern
- Admin zurück zu Employee machen (z.B. nach Abteilungswechsel)
- Tenant Admin hinzufügen/entfernen (vorsichtig!)

#### Mitarbeiter → Admin

**Szenario:** Ein Mitarbeiter soll Admin seiner Organisation werden.

1. **"Tenant Admin"** → **"Benutzer"** (system-weite Benutzerliste)
2. Benutzer suchen/finden
3. **"Rolle ändern"** klicken
4. Neue Rolle wählen: **"Admin"**
5. **"Bestätigen"**

**Effekt:**
- ✅ Benutzer hat jetzt Admin-Rechte in seiner Organisation
- 🔓 Kann Urlaubsanträge genehmigen
- ⚙️ Kann Org-Einstellungen ändern
- 📊 Kann Analytics sehen

#### Admin → Mitarbeiter

**Szenario:** Ein Admin wird zurückgestuft (Abteilungswechsel, Austritt aus Führung, etc.)

1. **"Tenant Admin"** → **"Benutzer"**
2. Benutzer suchen
3. **"Rolle ändern"** → **"Mitarbeiter"**
4. **Bestätigen**

**Effekt:**
- ❌ Verliert Admin-Rechte sofort
- ❌ Kann keine Anträge mehr genehmigen
- ❌ Kein Zugriff mehr auf Admin-Bereiche

> ⚠️ **Kommunikation**: Informieren Sie den Benutzer vorher über die Rollenänderung!

#### Tenant Admin ernennen (kritisch!)

**Szenario:** Sie möchten einen zweiten Tenant Admin ernennen (z.B. Vertretung).

1. **"Tenant Admin"** → **"Benutzer"**
2. Benutzer auswählen (sollte vertrauenswürdig sein!)
3. **"Rolle ändern"** → **"Tenant Admin"**
4. **Doppelte Bestätigung** (wegen kritischer Aktion)

**Effekt:**
- 🔐 Benutzer hat jetzt ALLE Ihre Rechte
- 🏢 Zugriff auf alle Organisationen
- 🎭 Kann Rollen ändern
- ⚙️ Kann System-Einstellungen ändern

> ⚠️ **ACHTUNG**: Nur absolut vertrauenswürdige Personen zum Tenant Admin machen!

### Benutzer zwischen Organisationen verschieben

**Szenario:** Ein Mitarbeiter wechselt die Abteilung.

1. **"Tenant Admin"** → **"Benutzer"**
2. Benutzer finden → **"Bearbeiten"**
3. Feld **"Organisation"** ändern
4. **"Speichern"**

**Effekt:**
- 🔄 Benutzer gehört jetzt zur neuen Organisation
- 📊 Kann nur noch Daten der neuen Org sehen
- ❓ **Urlaubssaldo**: Wird mitgenommen oder zurückgesetzt (je nach Einstellung)

### Benutzer-Status ändern

Sie können Benutzer **aktivieren/deaktivieren**:

**Deaktivieren:**
- Benutzer kann sich nicht mehr einloggen
- Daten bleiben erhalten
- Nutzen: Austritt aus Firma, lange Abwesenheit

**Reaktivieren:**
- Benutzer kann sich wieder einloggen
- Alle Daten wie vorher

---

## System-Administration

### Tenant-Admin-Bereich

**"Tenant Admin"** in der Navigation → System-weite Übersicht

### Dashboard

#### System-Statistiken

| Metrik | Bedeutung |
|--------|-----------|
| **Organisationen gesamt** | Anzahl aller Organisationen |
| **Benutzer gesamt** | Alle Benutzer system-weit |
| **Aktive Benutzer** | Eingeloggt in letzten 30 Tagen |
| **Ausstehende Anträge** | Über alle Orgs |
| **System-Health** | Server-Status (gut/warnung/kritisch) |

### System-Einstellungen

**"Tenant Admin"** → **"System-Einstellungen"**

#### Allgemeine Einstellungen

##### System-Name
- Name der gesamten Anwendung
- Wird in Browser-Tab und E-Mails angezeigt
- Z.B. "Urlaub.Firma.de" oder "MeineFirma Urlaubsplaner"

##### System-URL
- Haupt-URL Ihrer Installation
- Z.B. "https://urlaub.ihre-firma.de"
- Wird für E-Mail-Links verwendet

##### Support-Kontakt
- E-Mail oder Link für Support-Anfragen
- Wird Benutzern angezeigt bei Problemen

#### Standard-Einstellungen für neue Organisationen

Diese Einstellungen gelten für **neu erstellte** Organisationen:

- Standard-Urlaubstage (z.B. 30)
- Standard-Zeitzone
- Standard-Bundesland (für Feiertage)
- Erlaubte Urlaubstypen

#### E-Mail-Konfiguration

Falls E-Mail-Benachrichtigungen eingerichtet sind:

```
SMTP-Server: [smtp.ihre-firma.de]
SMTP-Port: [587]
Verschlüsselung: [TLS/SSL]
Benutzername: [urlaubsplaner@firma.de]
Passwort: [********]
Absender-Name: [Team Urlaubsplaner]
Absender-E-Mail: [noreply@firma.de]
```

> 🔧 **Hinweis**: E-Mail-Konfiguration erfordert ggf. Anpassungen in der `.env` Datei auf dem Server.

#### Sicherheits-Einstellungen

##### Session-Timeout
- Automatischer Logout nach Inaktivität
- Empfohlen: 30-60 Minuten

##### Passwort-Regeln
- Mindestlänge (empfohlen: 8-12 Zeichen)
- Komplexitätsanforderungen
- Passwort-Ablauf (z.B. alle 90 Tage ändern)

##### Zwei-Faktor-Authentifizierung (2FA)
- Für Tenant Admins empfohlen: **Aktiviert**
- Für normale Benutzer: Optional

##### IP-Whitelist (optional)
- Beschränkung auf bestimmte IP-Bereiche
- Nutzen: Zugriff nur aus Firmen-Netzwerk

#### Logging & Monitoring

##### Aktivitäts-Logs
- **An/Aus**: Alle Benutzer-Aktionen loggen?
- **Aufbewahrung**: Wie lange Logs speichern? (z.B. 90 Tage)

##### Admin-Audit-Log
- Alle Admin-Aktionen werden automatisch geloggt
- **Wer** hat **wann** **was** gemacht

**Nutzen:**
- Nachvollziehbarkeit
- Compliance (DSGVO, etc.)
- Sicherheits-Audits

### System-Logs ansehen

**"Tenant Admin"** → **"Logs"**

#### Verfügbare Log-Typen

1. **Login-Logs**
   - Wer hat sich wann eingeloggt?
   - Fehlgeschlagene Login-Versuche
   - Verdächtige Aktivitäten

2. **Admin-Aktionen**
   - Organisationen erstellt/gelöscht
   - Rollen geändert
   - Einstellungen angepasst

3. **Urlaubsanträge**
   - Erstellte/Genehmigte/Abgelehnte Anträge
   - Wer hat was genehmigt/abgelehnt?

4. **System-Fehler**
   - Fehler in der Anwendung
   - Datenbank-Fehler
   - Performance-Probleme

#### Logs filtern

- Nach Datum
- Nach Benutzer
- Nach Organisation
- Nach Aktion-Typ

#### Logs exportieren

- CSV/Excel für Archivierung
- PDF für Berichte

---

## Multi-Tenant-Management

### Konzept verstehen

"Multi-Tenant" bedeutet: **Mehrere unabhängige Organisationen** in einem System.

#### Vorteile
- ✅ Zentrale Verwaltung
- ✅ Eine Installation für alle
- ✅ Kosteneffizienz
- ✅ Einheitliche Updates

#### Herausforderungen
- ⚠️ Daten-Isolation sicherstellen
- ⚠️ Performance bei vielen Orgs
- ⚠️ Individuelle Anpassungen

### Strategie festlegen

#### Option A: Eine Organisation pro Abteilung
```
Firma GmbH (System)
  ├── Marketing
  ├── Vertrieb
  ├── IT
  └── HR
```

**Nutzen:** Abteilungen können individuell konfigurieren.

#### Option B: Eine Organisation pro Standort
```
Firma GmbH (System)
  ├── Berlin
  ├── München
  ├── Hamburg
  └── Köln
```

**Nutzen:** Unterschiedliche Feiertage, Regelungen.

#### Option C: Hybrid
```
Firma GmbH (System)
  ├── Zentrale
  │   ├── IT
  │   └── HR
  ├── Standort Berlin
  └── Standort München
```

### Org-übergreifende Berichte

**"Tenant Admin"** → **"System-Analytics"**

- Vergleich zwischen Organisationen
- Welche Org nimmt am meisten Urlaub?
- System-weite Trends
- Ressourcen-Nutzung

---

## Sicherheit & Compliance

### Datenschutz (DSGVO)

#### Ihre Verantwortung

Als Tenant Admin sind Sie **verantwortlich für**:
- ✅ Sichere Speicherung personenbezogener Daten
- ✅ Zugriffskontrollen
- ✅ Recht auf Auskunft
- ✅ Recht auf Löschung

#### DSGVO-Funktionen

##### Daten-Export (Recht auf Auskunft)
1. **"Tenant Admin"** → **"Benutzer"** → Benutzer auswählen
2. **"Daten exportieren"**
3. ZIP-Datei mit allen Benutzerdaten wird erstellt

##### Benutzer löschen (Recht auf Löschung)
1. Benutzer auswählen → **"Endgültig löschen"**
2. Optional: **"Anonymisieren"** statt Löschen (behält Statistiken, entfernt persönliche Daten)

### Sicherheits-Checkliste

#### Server-Sicherheit
- [ ] HTTPS aktiviert (kein HTTP!)
- [ ] SSL-Zertifikat gültig
- [ ] Firewall konfiguriert
- [ ] Nur notwendige Ports offen (80, 443)
- [ ] SSH-Zugang gesichert (Key-based Auth)

#### Anwendungs-Sicherheit
- [ ] Starke Passwörter erzwingen
- [ ] 2FA für Admins aktiviert
- [ ] Session-Timeout konfiguriert
- [ ] Regelmäßige Passwort-Änderung
- [ ] Logs aktiviert und überwacht

#### Datenbank-Sicherheit
- [ ] Datenbank-Passwort stark und sicher
- [ ] Nur localhost-Zugriff (keine externe DB)
- [ ] Regelmäßige Backups
- [ ] Verschlüsselte Verbindungen

---

## Backup & Wartung

### Backup-Strategie

#### Was muss gesichert werden?

1. **PostgreSQL-Datenbank** (enthält alle Daten)
2. **Uploads** (Logos, falls vorhanden): `/opt/urlaubsplaner/app/uploads/`
3. **Konfiguration**: `/opt/urlaubsplaner/app/.env`

#### Manuelles Backup

```bash
# Datenbank-Backup
pg_dump -U vacation_admin team_vacation_planner > backup_$(date +%Y%m%d_%H%M%S).sql

# Uploads sichern
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /opt/urlaubsplaner/app/uploads/

# .env sichern (VORSICHT: enthält Secrets!)
cp /opt/urlaubsplaner/app/.env .env.backup_$(date +%Y%m%d)
```

#### Automatisches Backup (Cronjob)

```bash
# Crontab bearbeiten
crontab -e

# Täglich um 2 Uhr nachts
0 2 * * * pg_dump -U vacation_admin team_vacation_planner > /backup/urlaubsplaner_$(date +\%Y\%m\%d).sql

# Alte Backups nach 30 Tagen löschen
0 3 * * * find /backup -name "urlaubsplaner_*.sql" -mtime +30 -delete
```

#### Backup-Speicherort

- **Lokal**: `/backup/` (separate Partition!)
- **Extern**: NAS, Cloud (S3, etc.)
- **Offsite**: Geographisch getrennt

#### Backup testen!

- Regelmäßig (z.B. monatlich) Restore-Test durchführen
- Sicherstellen, dass Backups wiederherstellbar sind

### Restore (Wiederherstellen)

```bash
# Datenbank wiederherstellen
psql -U vacation_admin team_vacation_planner < backup_20251103.sql

# Uploads wiederherstellen
tar -xzf uploads_backup_20251103.tar.gz -C /

# Service neu starten
sudo systemctl restart urlaubsplaner
```

### Updates durchführen

#### Anwendungs-Update

```bash
cd /opt/urlaubsplaner/app

# Backup erstellen!
pg_dump -U vacation_admin team_vacation_planner > backup_before_update_$(date +%Y%m%d).sql

# Code aktualisieren
git pull

# Dependencies aktualisieren
npm install --omit=dev

# Neu bauen
npm run build

# Service neu starten
sudo systemctl restart urlaubsplaner

# Logs prüfen
sudo journalctl -u urlaubsplaner -f
```

#### System-Updates

```bash
# RHEL/CentOS
sudo dnf update -y

# Debian/Ubuntu
sudo apt update && sudo apt upgrade -y

# System neu starten (wenn Kernel-Update)
sudo reboot
```

### Wartungsfenster

Planen Sie regelmäßige Wartungsfenster:
- **Frequenz**: Monatlich oder quartalsweise
- **Zeit**: Außerhalb der Arbeitszeiten (z.B. Sonntag Nacht)
- **Ankündigung**: Benutzer mind. 1 Woche vorher informieren

---

## Troubleshooting & Support

### Häufige System-Probleme

#### ❓ "Service startet nicht nach Update"

**Diagnose:**
```bash
sudo systemctl status urlaubsplaner
sudo journalctl -u urlaubsplaner -n 50
```

**Häufige Ursachen:**
- Syntax-Fehler im Code
- Fehlende Dependencies
- Datenbank-Verbindungsfehler

**Lösung:**
1. Logs analysieren
2. Build-Fehler? Neu bauen: `npm run build`
3. Dependencies fehlen? `npm install --omit=dev`
4. Notfall: Zurückrollen auf letztes Backup/Version

#### ❓ "Datenbank-Verbindung fehlgeschlagen"

**Prüfen:**
```bash
# PostgreSQL läuft?
sudo systemctl status postgresql

# Verbindung testen
psql -U vacation_admin -d team_vacation_planner -h localhost
```

**Lösung:**
- PostgreSQL starten: `sudo systemctl start postgresql`
- Passwort in `.env` prüfen
- `pg_hba.conf` prüfen (md5 statt peer)

#### ❓ "Performance-Probleme / Langsam"

**Diagnose:**
```bash
# CPU/RAM-Auslastung
top

# Disk Space
df -h

# Postgres-Abfragen analysieren
psql -U vacation_admin team_vacation_planner
# \x
# SELECT * FROM pg_stat_activity;
```

**Lösungen:**
- Datenbank-Indizes optimieren
- Alte Logs löschen
- Server-Ressourcen erhöhen
- Caching aktivieren

#### ❓ "SSL-Zertifikat abgelaufen"

**Prüfen:**
```bash
openssl x509 -in /etc/nginx/ssl/urlaubsplaner.crt -noout -dates
```

**Lösung:**
- Let's Encrypt erneuern: `sudo certbot renew`
- Oder: Neues Zertifikat von CA anfordern

### Support-Level

| Level | Zuständig | Kontakt |
|-------|-----------|---------|
| **L1** | Sie (Tenant Admin) | - |
| **L2** | IT-Team | [it@firma.de] |
| **L3** | Entwickler/Community | GitHub Issues |

### Hilfe holen

#### GitHub Issues
- Bugs melden
- Features vorschlagen
- Community fragen

#### Dokumentation
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [README.md](./README.md)
- [PERMISSIONS.md](./PERMISSIONS.md)

---

## Best Practices

### Organisations-Management

#### ✅ DO's
- ✅ Klare Organisations-Struktur planen (vor Rollout)
- ✅ Aussagekräftige Namen wählen
- ✅ Für jede Org mindestens 1 Admin ernennen
- ✅ Regelmäßig ungenutzte Orgs aufräumen

#### ❌ DON'Ts
- ❌ Zu viele kleine Orgs (Management-Overhead)
- ❌ Orgs ohne Admin lassen
- ❌ Orgs löschen ohne Backup
- ❌ Testdaten mit Produktivdaten mischen

### Rollen-Management

- **Restriktiv**: Nur notwendige Rechte vergeben
- **Dokumentiert**: Festhalten, wer warum welche Rolle hat
- **Regelmäßig prüfen**: Jährliche Rolle-Reviews

### Sicherheit

- **Passwörter**: Regelmäßig ändern (Sie als Vorbild!)
- **2FA**: Für sich selbst aktivieren
- **Logs**: Regelmäßig auf Anomalien prüfen
- **Updates**: Zeitnah einspielen (Sicherheits-Patches!)

### Kommunikation

- **Transparent**: Wartungsfenster ankündigen
- **Erreichbar**: Support-Kanal bereitstellen
- **Dokumentieren**: Änderungen kommunizieren

---

## ✅ Tenant Admin Checkliste

### Nach Installation
- [ ] Standard-Passwort geändert
- [ ] Profil ausgefüllt
- [ ] Erste Organisation erstellt
- [ ] Ersten Org-Admin ernannt
- [ ] System-Einstellungen konfiguriert
- [ ] Backup eingerichtet
- [ ] SSL-Zertifikat installiert

### Täglich
- [ ] System-Health Dashboard checken
- [ ] Kritische Fehler in Logs prüfen

### Wöchentlich
- [ ] Neue Organisationen/Benutzer prüfen
- [ ] Backup-Status verifizieren

### Monatlich
- [ ] System-Updates einspielen
- [ ] Logs archivieren/bereinigen
- [ ] Backup-Restore testen
- [ ] Ungenutzten Org/User aufräumen

### Quartalsweise
- [ ] Rollen-Review (wer hat welche Rechte?)
- [ ] Sicherheits-Audit
- [ ] Performance-Optimierung

### Jährlich
- [ ] Compliance-Check (DSGVO, etc.)
- [ ] Disaster-Recovery-Test
- [ ] Dokumentation aktualisieren

---

**Vielen Dank für Ihre Arbeit als System-Administrator!** 🔐

Sie tragen die Hauptverantwortung für ein funktionierendes und sicheres System. Ihre Sorgfalt schützt die Daten aller Benutzer!

---

*Zuletzt aktualisiert: November 2025*
*Version: 1.0*
