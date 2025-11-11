# 🧪 Testdaten & Demo-Accounts

**Team Urlaubsplaner** - Übersicht der automatisch angelegten Testdaten

---

## 📋 Übersicht

Bei jeder Installation (in `development` Mode) werden automatisch folgende Testdaten angelegt:

1. **System Administration** - Organisation für Tenant Admin
2. **Test GmbH** - Beispiel-Organisation mit 1 Admin und 3 Mitarbeitern

> ⚠️ **Wichtig für Produktion**: Im `production` Mode (NODE_ENV=production) werden **NUR** der Tenant Admin angelegt, **NICHT** die Test GmbH!

---

## 🔐 Zugangsdaten

### 1. System Administration

#### Tenant Administrator (System-Admin)

| Feld | Wert |
|------|------|
| **Rolle** | Tenant Admin (höchste Berechtigung) |
| **E-Mail** | `tenantadmin@system.local` |
| **Passwort** | `TenantAdmin` |
| **Vorname** | Tenant |
| **Nachname** | Administrator |
| **Organisation** | System Administration |

**Rechte:**
- ✅ Alle Organisationen verwalten (erstellen, bearbeiten, löschen)
- ✅ Benutzer-Rollen ändern (Mitarbeiter ↔ Admin)
- ✅ System-weite Einstellungen
- ✅ Zugriff auf alle Daten

**Verwendung:**
- Für System-Administration und Multi-Tenant-Management
- Sollte in Produktion verwendet werden

> 🔒 **WICHTIG**: Ändern Sie das Passwort nach dem ersten Login!

---

### 2. Test GmbH (nur Development)

Eine Beispiel-Organisation zum Testen aller Funktionen.

#### Admin: Max Manager

| Feld | Wert |
|------|------|
| **Rolle** | Admin (Organisations-Administrator) |
| **E-Mail** | `max.manager@test-gmbh.de` |
| **Passwort** | `MaxManager123` |
| **Vorname** | Max |
| **Nachname** | Manager |
| **Organisation** | Test GmbH |

**Rechte:**
- ✅ Urlaubsanträge seiner Organisation genehmigen/ablehnen
- ✅ Neue Benutzer seiner Organisation freischalten
- ✅ Organisationseinstellungen ändern
- ✅ Analytics und Statistiken einsehen
- ❌ Kann keine neuen Organisationen erstellen
- ❌ Kann keine Rollen ändern

**Verwendung:**
- Testen der Admin-Funktionen
- Genehmigung von Urlaubsanträgen
- Organisations-Verwaltung

---

#### Mitarbeiter: Udo User

| Feld | Wert |
|------|------|
| **Rolle** | Employee (Mitarbeiter) |
| **E-Mail** | `udo.user@test-gmbh.de` |
| **Passwort** | `UdoUser123` |
| **Vorname** | Udo |
| **Nachname** | User |
| **Organisation** | Test GmbH |

**Rechte:**
- ✅ Eigene Urlaubsanträge erstellen
- ✅ Eigene Anträge bearbeiten/löschen (solange ausstehend)
- ✅ Team-Kalender ansehen
- ✅ Team-Übersicht ansehen
- ✅ Eigenes Profil bearbeiten
- ❌ Keine Admin-Funktionen

**Verwendung:**
- Testen der Mitarbeiter-Funktionen
- Urlaubsanträge erstellen
- End-User-Perspektive

---

#### Mitarbeiter: Bernd Benutzer

| Feld | Wert |
|------|------|
| **Rolle** | Employee (Mitarbeiter) |
| **E-Mail** | `bernd.benutzer@test-gmbh.de` |
| **Passwort** | `BerndBenutzer123` |
| **Vorname** | Bernd |
| **Nachname** | Benutzer |
| **Organisation** | Test GmbH |

**Verwendung:**
- Zweiter Test-Mitarbeiter
- Multi-User-Szenarien testen
- Team-Kalender mit mehreren Abwesenheiten

---

#### Mitarbeiter: Moni Mitarbeiter

| Feld | Wert |
|------|------|
| **Rolle** | Employee (Mitarbeiter) |
| **E-Mail** | `moni.mitarbeiter@test-gmbh.de` |
| **Passwort** | `MoniMitarbeiter123` |
| **Vorname** | Moni |
| **Nachname** | Mitarbeiter |
| **Organisation** | Test GmbH |

**Verwendung:**
- Dritter Test-Mitarbeiter
- Team-Dynamiken testen
- Genehmigungs-Workflows mit mehreren Beteiligten

---

## 🎯 Test-Szenarien

### Szenario 1: Urlaubsantrag-Workflow

1. **Als Udo** (`udo.user@test-gmbh.de`):
   - Einloggen
   - Neuen Urlaubsantrag erstellen (z.B. 01.07. - 14.07.2025)
   - Antrag einreichen

2. **Als Max** (`max.manager@test-gmbh.de`):
   - Einloggen
   - Ausstehenden Antrag von Udo sehen
   - Team-Kalender prüfen (sind genug Leute da?)
   - Antrag genehmigen

3. **Als Udo** (wieder):
   - Benachrichtigung über Genehmigung
   - Urlaub erscheint im Kalender

### Szenario 2: Vier-Augen-Prinzip testen

1. **Als Max** (Admin):
   - Einloggen
   - Eigenen Urlaubsantrag erstellen
   - Versuchen, selbst zu genehmigen → ❌ **Blockiert!**

2. **Als Tenant Admin** (`tenantadmin@system.local`):
   - Einloggen
   - Zu Test GmbH wechseln
   - Max's Antrag genehmigen ✅

### Szenario 3: Team-Koordination

1. **Als Bernd**:
   - Urlaubsantrag für 15.08. - 22.08.2025

2. **Als Moni**:
   - Urlaubsantrag für gleichen Zeitraum 15.08. - 22.08.2025

3. **Als Max** (Admin):
   - Sieht beide Anträge
   - Team-Kalender zeigt Warnung: Zu viele Abwesenheiten!
   - Muss entscheiden: Beide genehmigen oder einen ablehnen?

### Szenario 4: Multi-Tenant

1. **Als Tenant Admin**:
   - Neue Organisation erstellen (z.B. "Marketing AG")
   - Ersten Admin ernennen
   - Zwischen Organisationen wechseln
   - Daten-Isolation prüfen (Test GmbH sieht nichts von Marketing AG)

### Szenario 5: Urlaubssaldo-Tracking (Zweistufiges Gating)

Dieses Szenario testet das optionale Urlaubssaldo-Tracking Feature mit zweistufigem Gating.

#### Test 1: Organisation deaktiviert, Benutzer aktiviert

1. **Als Max** (`max.manager@test-gmbh.de`) - Admin:
   - Einloggen
   - Zu **Organisationseinstellungen** navigieren
   - Urlaubssaldo-Tracking **deaktiviert** lassen (Standard)
   
2. **Als Udo** (`udo.user@test-gmbh.de`) - Mitarbeiter:
   - Einloggen
   - Zu **Benutzereinstellungen** navigieren
   - Urlaubssaldo-Tracking **aktivieren**
   - Zum Dashboard wechseln
   - **Erwartung**: ❌ Keine Urlaubssaldo-Karte sichtbar (Organisation erlaubt es nicht)

#### Test 2: Organisation aktiviert, Benutzer deaktiviert

1. **Als Max** (`max.manager@test-gmbh.de`) - Admin:
   - Zu **Organisationseinstellungen** navigieren
   - Urlaubssaldo-Tracking **aktivieren**
   - Speichern
   
2. **Als Udo** (`udo.user@test-gmbh.de`) - Mitarbeiter:
   - Zu **Benutzereinstellungen** navigieren
   - Urlaubssaldo-Tracking **deaktiviert** lassen (Standard)
   - Zum Dashboard wechseln
   - **Erwartung**: ❌ Keine Urlaubssaldo-Karte sichtbar (Benutzer hat es nicht aktiviert)

#### Test 3: Beide aktiviert (Feature funktioniert)

1. **Als Max** (`max.manager@test-gmbh.de`) - Admin:
   - Urlaubssaldo-Tracking in **Organisationseinstellungen aktiviert** (aus Test 2)
   
2. **Als Udo** (`udo.user@test-gmbh.de`) - Mitarbeiter:
   - Zu **Benutzereinstellungen** navigieren
   - Urlaubssaldo-Tracking **aktivieren**
   - Speichern
   - Zum Dashboard wechseln
   - **Erwartung**: ✅ Urlaubssaldo-Karte wird angezeigt mit:
     - Verfügbare Tage
     - Genommene Tage
     - Beantragte Tage
     - Verbleibende Tage

#### Test 4: Organisation deaktiviert Feature (alle Benutzer verlieren Zugriff)

1. **Als Max** (`max.manager@test-gmbh.de`) - Admin:
   - Urlaubssaldo-Tracking in **Organisationseinstellungen deaktivieren**
   - Speichern
   
2. **Als Udo** (`udo.user@test-gmbh.de`) - Mitarbeiter:
   - Dashboard neu laden
   - **Erwartung**: ❌ Urlaubssaldo-Karte verschwindet sofort (obwohl Benutzer es aktiviert hat)

#### Test 5: Unterschiedliche Benutzer-Präferenzen

1. **Als Max** - Admin aktiviert Org-Feature

2. **Als Udo** - Aktiviert Benutzer-Feature:
   - **Erwartung**: ✅ Sieht Saldo-Karte
   
3. **Als Bernd** (`bernd.benutzer@test-gmbh.de`) - Lässt Benutzer-Feature deaktiviert:
   - Einloggen
   - **Erwartung**: ❌ Sieht keine Saldo-Karte
   
4. **Als Moni** (`moni.mitarbeiter@test-gmbh.de`) - Aktiviert Benutzer-Feature:
   - **Erwartung**: ✅ Sieht Saldo-Karte

**Ergebnis**: Jeder Mitarbeiter kann individuell entscheiden, ob er das Feature nutzt!

#### Erwartete Ergebnisse: Urlaubssaldo-Tracking

| Org-Setting | User-Setting (Udo) | Dashboard-Karte | Status |
|-------------|-------------------|-----------------|--------|
| ❌ Deaktiviert | ✅ Aktiviert | ❌ Verborgen | Org blockiert |
| ✅ Aktiviert | ❌ Deaktiviert | ❌ Verborgen | User will nicht |
| ✅ Aktiviert | ✅ Aktiviert | ✅ **Sichtbar** | Feature aktiv! |
| ❌ Deaktiviert | ❌ Deaktiviert | ❌ Verborgen | Nicht genutzt |

---

## 🏢 Organisations-Details: Test GmbH

| Einstellung | Wert |
|-------------|------|
| **Name** | Test GmbH |
| **Domain** | test-gmbh.de |
| **Standard-Urlaubstage** | 30 Tage |
| **Zeitzone** | Europe/Berlin (default) |
| **Mitarbeiter** | 4 (1 Admin + 3 Employees) |

---

## 🗑️ Testdaten löschen

### Option 1: Über die Anwendung

Als Tenant Admin:
1. Einloggen als `tenantadmin@system.local`
2. **"Tenant Admin"** → **"Organisationen"**
3. "Test GmbH" auswählen → **"Löschen"**
4. Organisationsnamen eingeben zur Bestätigung
5. Löschen bestätigen

> ⚠️ Dies löscht die Organisation und alle zugehörigen Benutzer!

### Option 2: Datenbank (für Entwickler)

```bash
# Kompletten Reset der Datenbank
cd /opt/urlaubsplaner/app

# Datenbank-Schema neu aufsetzen
npm run db:push

# Server neu starten (legt automatisch Testdaten neu an)
npm start
```

---

## 🔄 Testdaten neu laden

Falls Sie die Testdaten versehentlich gelöscht haben:

**In Development Mode:**
1. Server stoppen
2. Datenbank-Tabellen leeren (oder komplett neu aufsetzen)
3. Server neu starten
4. Testdaten werden automatisch angelegt

**Code-Location:**
Die Testdaten werden beim Start in `server/seed.ts` angelegt:
- `seedInitialTenantAdmin()` - Tenant Admin (immer)
- `seedTestOrganization()` - Test GmbH (nur in Development)

---

## 🚀 Produktions-Einsatz

### Was passiert in Production?

Wenn `NODE_ENV=production` gesetzt ist:

✅ **Wird angelegt:**
- Tenant Admin (tenantadmin@system.local)

❌ **Wird NICHT angelegt:**
- Test GmbH Organisation
- Test-Benutzer (Max, Udo, Bernd, Moni)

### Erste Schritte in Production

1. **Als Tenant Admin einloggen**
   - E-Mail: `tenantadmin@system.local`
   - Passwort: `TenantAdmin` (SOFORT ÄNDERN!)

2. **Passwort ändern** (Pflicht!)

3. **Erste echte Organisation erstellen**
   - Z.B. "Ihre Firma GmbH"
   - Standard-Urlaubstage setzen

4. **Ersten Admin dieser Organisation ernennen**
   - Mitarbeiter registrieren lassen
   - Als Admin freischalten
   - Admin-Rolle zuweisen

5. **Mitarbeiter registrieren lassen**
   - Admin schaltet sie frei

---

## 📚 Weitere Dokumentation

- **[HANDBUCH_MITARBEITER.md](./HANDBUCH_MITARBEITER.md)** - Für Udo, Bernd, Moni
- **[HANDBUCH_ADMIN.md](./HANDBUCH_ADMIN.md)** - Für Max Manager
- **[HANDBUCH_TENANT_ADMIN.md](./HANDBUCH_TENANT_ADMIN.md)** - Für Tenant Admin

---

## ⚠️ Sicherheitshinweise

### Development

- ✅ Test-Accounts mit einfachen Passwörtern sind OK
- ✅ Daten können jederzeit gelöscht werden
- ✅ Zum Experimentieren gedacht

### Production

- 🔐 **NIEMALS** Test GmbH in Produktion verwenden
- 🔐 Tenant Admin Passwort sofort ändern
- 🔐 Starke Passwörter erzwingen
- 🔐 2FA für Admins aktivieren
- 🔐 Regelmäßige Sicherheits-Audits

---

## 🎓 Quick Start Guide

**Für neue Entwickler / Tester:**

1. **Installation durchführen** (siehe [DEPLOYMENT.md](../DEPLOYMENT.md))

2. **Anwendung starten** in Development Mode:
   ```bash
   NODE_ENV=development npm start
   ```

3. **Browser öffnen**: http://localhost:5000

4. **Als Mitarbeiter einloggen** (einfachster Einstieg):
   - E-Mail: `udo.user@test-gmbh.de`
   - Passwort: `UdoUser123`
   - Urlaubsantrag erstellen und einreichen

5. **Als Admin einloggen** (in neuem Tab/Inkognito):
   - E-Mail: `max.manager@test-gmbh.de`
   - Passwort: `MaxManager123`
   - Udos Antrag genehmigen

6. **Als Udo zurück**: Genehmigte Benachrichtigung sehen!

7. **Weiter experimentieren** mit verschiedenen Szenarien

---

**Viel Spaß beim Testen!** 🧪

---

*Zuletzt aktualisiert: November 2025*
*Version: 1.0*
