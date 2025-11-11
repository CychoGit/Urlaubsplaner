# 🏖️ Team Urlaubsplaner

Ein umfassendes **Multi-Tenant Urlaubsverwaltungssystem** mit Enterprise-Features für deutsche Teams und Organisationen.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

---

## 📋 Inhaltsverzeichnis

- [🎯 Projektübersicht](#-projektübersicht)
- [✨ Features](#-features)
- [🚀 Installation auf eigenem Server](#-installation-auf-eigenem-server)
- [🔧 Konfiguration](#-konfiguration)
- [👥 Benutzerverwaltung](#-benutzerverwaltung)
- [💻 Technologie-Stack](#-technologie-stack)
- [📁 Projektstruktur](#-projektstruktur)
- [🔐 Authentifizierung](#-authentifizierung)
- [🗄️ Datenbank](#️-datenbank)
- [📡 API-Endpunkte](#-api-endpunkte)
- [🚢 Produktiv-Deployment](#-produktiv-deployment)
- [🔧 Wartung & Troubleshooting](#-wartung--troubleshooting)
- [📄 Lizenz](#-lizenz)

---

## 🎯 Projektübersicht

Der **Team Urlaubsplaner** ist eine moderne, voll ausgestattete Webanwendung zur Verwaltung von Urlaubsanträgen und Teamplanung. Das System bietet Enterprise-Level Features für deutsche Unternehmen und Teams mit komplexen Anforderungen an Urlaubsmanagement.

### 🌟 Hauptmerkmale

- **🔐 Email/Passwort Authentifizierung** - Vollständig eigenständig, keine externen Abhängigkeiten
- **👥 Benutzer-Genehmigungsworkflow** - Administratoren genehmigen neue Registrierungen
- **🏢 Multi-Tenant Architektur** - Organisationsbasierte Datentrennung
- **👨‍💼 Rollenbasierte Zugriffskontrolle** - Tenant Admin, Admin und Mitarbeiter Rollen
- **📅 Intelligente Konfliktlösung** - Automatische Erkennung und Lösungsvorschläge
- **📊 Umfassende Analytics** - Detaillierte Berichte und Metriken
- **🔔 Echtzeit-Benachrichtigungen** - WebSocket-basierte Push-Notifications
- **📱 Responsive Design** - Optimiert für Desktop, Tablet und Mobile
- **🌍 Deutsche Benutzeroberfläche** - Vollständig in deutscher Sprache

---

## ✨ Features

### 📋 Kernfunktionen
- ✅ **Urlaubsantragsverwaltung** - Erstellen, Bearbeiten, Genehmigen und Löschen von Anträgen mit Duplikatsprüfung
- ✅ **Urlaubsantrag Stornierung** - Benutzer können eigene wartende und genehmigte Anträge löschen mit automatischer Saldo-Wiederherstellung
- ✅ **Intelligenter Kalender** - Visuelle Darstellung mit Namen auf Urlaubsbalken, Badge für Personenanzahl und Tooltip mit allen Details
- ✅ **Intelligente Urlaubsberechnung** - Automatischer Ausschluss von Wochenenden und deutschen Feiertagen bei der Berechnung der Urlaubstage
- ✅ **Deutsche Feiertage** - Vorkonfiguriert mit allen 9 bundesweiten Feiertagen (2025-2030) inkl. Gauss'scher Osterformel für bewegliche Feiertage
- ✅ **Optionales Urlaubssaldo-Tracking** - Zweistufiges Gating (Organisation + Benutzer) ermöglicht flexible Kontrolle über Saldo-Anzeige und Tracking
- ✅ **Saldoverwaltung** - Flexible Urlaubstage-Verwaltung mit Organisationsstandard und individuellen Anpassungen
- ✅ **Team-Dashboard** - Übersicht über alle Teammitglieder mit Echtzeit-Status
- ✅ **Benutzerregistrierung** - Selbstregistrierung mit Admin-Genehmigungsworkflow
- ✅ **Organisations-Branding** - Logo-Upload und individuelle Organisationsnamen mit flexiblem File Storage

### 🚀 Erweiterte Features
- ✅ **Multi-Step Wizard** - Dreistufiger Urlaubsantrag mit intuitiver Benutzerführung
- ✅ **Framer Motion Animationen** - Sanfte Hover-Effekte und Mikrointeraktionen
- ✅ **Optimierte Kalender-Visualisierung**:
  - Namen direkt auf Urlaubsbalken (max. 2 sichtbar)
  - Badge mit Gesamtzahl bei mehr als 2 Personen
  - Detaillierter Tooltip beim Hover mit allen Urlaubern und Status
  - Konfliktanzeige in Echtzeit
  - Filterung nach Status (nur genehmigte/wartende Anträge sichtbar)
  - **Farbcodierung**: Wochenenden (grau) und Feiertage (rot) visuell hervorgehoben
  - **Feiertags-Tooltips**: Anzeige des Feiertagsnamens beim Hover
- ✅ **Optimierte Navigation** - Hochkontrast Design für bessere Lesbarkeit
- ✅ **Individueller iCal-Export** - Jeder genehmigte Urlaubsantrag hat eigenen "In Kalender importieren" Button für direkten Import in Google Calendar, Outlook, Apple Calendar
- ✅ **CSV-Export** - Datenexport für Excel-Analyse und Reporting
- ✅ **Duplikatsprüfung** - Verhindert überlappende Urlaubsanträge mit klarer Fehlermeldung
- ✅ **Intelligente Konfliktlösung** - Teamabdeckung und Vorschläge
- ✅ **Push-Benachrichtigungen** - Echtzeit-Updates via WebSocket
- ✅ **Analytics-Dashboard** - Umfassende Berichte und Visualisierungen
- ✅ **Erweiterte Filterung** - Nach Abteilung, Zeitraum, Status

### 🛡️ Enterprise Features
- ✅ **Multi-Tenant Sicherheit** - Organisationsbasierte Isolierung
- ✅ **Audit-Logging** - Vollständige Aktivitätsverfolgung
- ✅ **Rollenbasierte Berechtigungen** - Granulare Zugriffskontrolle
- ✅ **Session-Management** - Sichere Authentifizierung mit bcrypt Passwort-Hashing
- ✅ **Benutzer-Genehmigungsworkflow** - Kontrollierte Zugangsverwaltung
- ✅ **Flexibles File Storage** - Automatische Erkennung zwischen Cloud Object Storage (Replit) und lokalem Dateisystem (Self-Hosted)
- ✅ **Automatische Datenbank-Erkennung** - Unterstützt sowohl Neon PostgreSQL (Cloud) als auch Standard PostgreSQL (Self-Hosted)
- ✅ **Test-Daten inklusive** - Test GmbH Organisation mit 4 Beispiel-Benutzern wird automatisch installiert

---

## 🚀 Installation auf eigenem Server

### Voraussetzungen

Stellen Sie sicher, dass folgende Software auf Ihrem Server installiert ist:

- **Node.js** v18.0 oder höher ([Download](https://nodejs.org/))
- **PostgreSQL** v14.0 oder höher ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))
- **npm** oder **yarn** (kommt mit Node.js)

### Schritt 1: Repository klonen

```bash
# Repository von GitHub klonen
git clone https://github.com/CychoGit/TeamUrlaubplaner.git

# In das Projektverzeichnis wechseln
cd TeamUrlaubplaner
```

### Schritt 2: Abhängigkeiten installieren

```bash
# NPM-Pakete installieren
npm install
```

Dies installiert alle erforderlichen Dependencies für Frontend und Backend.

### Schritt 3: PostgreSQL-Datenbank einrichten

#### 3.1 PostgreSQL-Datenbank erstellen

```bash
# Mit PostgreSQL verbinden (als postgres User)
sudo -u postgres psql

# Neue Datenbank erstellen
CREATE DATABASE team_vacation_planner;

# Neuen Datenbank-Benutzer erstellen
# WICHTIG: Dies ist ein technischer User für die DB-Verbindung,
# NICHT der Super-Admin der Anwendung!
CREATE USER vacation_admin WITH ENCRYPTED PASSWORD 'IhrSicheresPasswort';

# Berechtigungen erteilen
GRANT ALL PRIVILEGES ON DATABASE team_vacation_planner TO vacation_admin;

# PostgreSQL verlassen
\q
```

**Hinweis:** Der Tenant Admin (Super-Admin) der Anwendung wird beim ersten Start automatisch erstellt.

**Wichtig - Automatische Datenbank-Erkennung:** Die Anwendung erkennt automatisch, ob sie mit einer Neon-Datenbank (Cloud) oder einer lokalen PostgreSQL-Datenbank verbunden ist und wählt den passenden Datenbank-Treiber. Sie müssen keine speziellen Konfigurationen vornehmen - die App funktioniert sowohl in der Cloud als auch auf Ihrem eigenen Server.

#### 3.2 Umgebungsvariablen konfigurieren

Erstellen Sie eine `.env` Datei im Hauptverzeichnis des Projekts:

```bash
# .env Datei erstellen
touch .env
```

Fügen Sie folgende Umgebungsvariablen hinzu:

```env
# Datenbank-Konfiguration
DATABASE_URL="postgresql://vacation_admin:IhrSicheresPasswort@localhost:5432/team_vacation_planner"
PGHOST="localhost"
PGPORT="5432"
PGUSER="vacation_admin"
PGPASSWORD="IhrSicheresPasswort"
PGDATABASE="team_vacation_planner"

# Session-Sicherheit (WICHTIG: Ändern Sie diesen Wert!)
SESSION_SECRET="generieren-sie-einen-langen-zufaelligen-string-hier"

# Server-Konfiguration
PORT="5000"
NODE_ENV="production"
```

**WICHTIG:** Generieren Sie einen sicheren Session-Secret:

```bash
# Sicheren Random-String generieren
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Schritt 4: Datenbank-Schema initialisieren

```bash
# Datenbank-Schema in die PostgreSQL-Datenbank pushen
npm run db:push

# Bei Warnungen können Sie mit --force fortfahren
npm run db:push --force
```

Dies erstellt alle notwendigen Tabellen:
- `users` - Benutzer und Authentifizierung
- `organizations` - Organisationen/Mandanten
- `vacation_requests` - Urlaubsanträge
- `notifications` - Benachrichtigungen
- `sessions` - Session-Verwaltung

### Schritt 5: Anwendung starten

#### Entwicklungsmodus

```bash
# Entwicklungsserver starten (mit Hot Reload)
npm run dev
```

Die Anwendung ist nun unter `http://localhost:5000` erreichbar.

#### Produktionsmodus

```bash
# Build für Produktion erstellen
npm run build

# Produktionsserver starten
npm start
```

### Schritt 6: Erste Anmeldung und Test-Daten

#### System-Administrator (Tenant Admin)

Das System erstellt automatisch beim ersten Start einen Tenant Administrator:

**Login-Daten:**
- **E-Mail:** `tenantadmin@system.local`
- **Passwort:** `TenantAdmin`
- **Rolle:** Tenant Admin (kann Organisationen erstellen)

⚠️ **WICHTIG:** Ändern Sie das Tenant Admin Passwort nach der ersten Anmeldung!

#### Test-Organisation (Test GmbH)

Das System erstellt automatisch beim ersten Start eine Test-Organisation mit Beispiel-Benutzern (sowohl in Entwicklung als auch in Produktion):

**Test GmbH - Organisations-Administrator:**
- **E-Mail:** `max.manager@test-gmbh.de`
- **Passwort:** `MaxManager123`
- **Name:** Max Manager
- **Rolle:** Admin der Test GmbH Organisation

**Test GmbH - Mitarbeiter:**
1. **Udo User**
   - E-Mail: `udo.user@test-gmbh.de`
   - Passwort: `UdoUser123`
   
2. **Bernd Benutzer**
   - E-Mail: `bernd.benutzer@test-gmbh.de`
   - Passwort: `BerndBenutzer123`
   
3. **Moni Mitarbeiter**
   - E-Mail: `moni.mitarbeiter@test-gmbh.de`
   - Passwort: `MoniMitarbeiter123`

**Hinweis:**
- Die Test GmbH dient als Beispiel und zum Testen der Funktionen
- Sie können die Test GmbH über das Tenant Admin Panel löschen, wenn Sie sie nicht benötigen
- Erstellen Sie über das Tenant Admin Panel Ihre eigenen Organisationen für den produktiven Einsatz

#### Initial Setup als Tenant Admin:

1. **Tenant Admin Login:**
   - Öffnen Sie `http://localhost:5000/login`
   - Melden Sie sich mit den obigen Zugangsdaten an
   - Navigieren Sie zu `/tenant-admin`

2. **Organisation erstellen:**
   - Klicken Sie auf "Organisation erstellen"
   - Geben Sie Name und Domain ein (z.B. "Meine Firma GmbH", "firma.local")
   - Die Organisation wird sofort erstellt

3. **Organisation Administrator erstellen:**
   - Wählen Sie die neu erstellte Organisation aus
   - Füllen Sie das Admin-Formular aus
   - Der Administrator kann sich sofort anmelden

#### Workflow für Mitarbeiter:

1. **Mitarbeiter-Registrierung:**
   - Neue Benutzer öffnen `/register`
   - Wählen Sie die Organisation aus dem Dropdown
   - Registrierung erfolgt mit Status "pending"

2. **Admin genehmigt Mitarbeiter:**
   - Organisation Admin navigiert zu `/admin/users`
   - Sieht ausstehende Benutzer seiner Organisation
   - Genehmigt Benutzer durch Klick auf "Genehmigen"

3. **Mitarbeiter kann sich anmelden:**
   - Nach Genehmigung ist Login möglich
   - Zugriff auf Urlaubsanträge und Team-Kalender

---

## 🔧 Konfiguration

### Umgebungsvariablen

Alle verfügbaren Umgebungsvariablen:

| Variable | Beschreibung | Pflicht | Standard |
|----------|--------------|---------|----------|
| `DATABASE_URL` | PostgreSQL Verbindungs-URL | ✅ Ja | - |
| `PGHOST` | PostgreSQL Host | ✅ Ja | localhost |
| `PGPORT` | PostgreSQL Port | ✅ Ja | 5432 |
| `PGUSER` | PostgreSQL Benutzername | ✅ Ja | - |
| `PGPASSWORD` | PostgreSQL Passwort | ✅ Ja | - |
| `PGDATABASE` | PostgreSQL Datenbankname | ✅ Ja | - |
| `SESSION_SECRET` | Geheimer Schlüssel für Sessions | ✅ Ja | - |
| `PORT` | Server-Port | ❌ Nein | 5000 |
| `NODE_ENV` | Umgebung (development/production) | ❌ Nein | development |

### Urlaubssaldo-Tracking (Optionales Feature)

Das **Urlaubssaldo-Tracking** ist ein optionales Feature mit zweistufigem Gating-Mechanismus für maximale Flexibilität:

#### Wie es funktioniert

Das Feature erfordert **zwei unabhängige Aktivierungen**:

1. **Organisations-Ebene** (durch Admin): Organisation aktiviert das Feature in Organisationseinstellungen (`/settings/organization`)
2. **Benutzer-Ebene** (durch Mitarbeiter): Jeder Benutzer aktiviert es individuell in Benutzereinstellungen (`/settings/user`)

**Dashboard-Anzeige:**
- Die Urlaubssaldo-Karte auf dem Dashboard wird **NUR** angezeigt, wenn **BEIDE** Einstellungen aktiviert sind
- Organisation = ✅ UND Benutzer = ✅ → Saldo-Karte wird angezeigt
- Sonst → Saldo-Karte wird ausgeblendet

#### Standard-Einstellungen

| Ebene | Standard | Beschreibung |
|-------|----------|--------------|
| **Organisation** | `false` (deaktiviert) | Admins müssen Feature bewusst aktivieren |
| **Benutzer** | `false` (deaktiviert) | Mitarbeiter entscheiden selbst |

#### Anwendungsfälle

**Warum zweistufiges Gating?**

- **Datenschutz**: Organisationen, die Saldo-Daten nicht anzeigen möchten, können das Feature org-weit deaktivieren
- **Benutzer-Wahl**: Selbst wenn die Organisation es aktiviert, können Mitarbeiter individuell entscheiden
- **Flexibilität**: Ermöglicht schrittweise Einführung oder A/B-Testing innerhalb einer Organisation

**Beispiel-Szenarien:**

| Org-Setting | User-Setting | Dashboard-Anzeige | Szenario |
|-------------|--------------|-------------------|----------|
| ✅ Aktiviert | ✅ Aktiviert | ✅ Saldo sichtbar | Standard-Nutzung |
| ✅ Aktiviert | ❌ Deaktiviert | ❌ Saldo verborgen | Benutzer möchte keine Saldo-Anzeige |
| ❌ Deaktiviert | ✅ Aktiviert | ❌ Saldo verborgen | Organisation hat Feature nicht freigegeben |
| ❌ Deaktiviert | ❌ Deaktiviert | ❌ Saldo verborgen | Feature nicht genutzt |

#### Konfiguration

**Als Administrator** (Organisationseinstellungen):
1. Navigieren Sie zu **Einstellungen** → **Organisation**
2. Finden Sie den Abschnitt **"Urlaubssaldo-Tracking"**
3. Aktivieren/Deaktivieren Sie den Toggle
4. Speichern Sie die Änderungen

**Als Mitarbeiter** (Benutzereinstellungen):
1. Navigieren Sie zu **Einstellungen** → **Mein Profil**
2. Finden Sie den Abschnitt **"Urlaubssaldo-Tracking"**
3. Aktivieren/Deaktivieren Sie den Toggle
4. Speichern Sie die Änderungen

Weitere Details siehe [Organisations-Admin Handbuch](docs/HANDBUCH_ADMIN.md#urlaubssaldo-tracking) und [Mitarbeiter Handbuch](docs/HANDBUCH_MITARBEITER.md#urlaubssaldo-tracking)

### Port-Konfiguration

Standardmäßig läuft die Anwendung auf Port 5000. Um einen anderen Port zu verwenden:

```env
PORT=8080
```

### Sicherheitseinstellungen

**Session-Konfiguration:**
- Sessions werden in PostgreSQL gespeichert
- Session-Gültigkeit: 7 Tage
- Cookies sind HTTP-only und in Produktion nur über HTTPS

**Passwort-Sicherheit:**
- Passwörter werden mit bcrypt gehashed (10 Runden)
- Mindestlänge: 8 Zeichen
- Passwörter werden niemals im Klartext gespeichert

---

## 👥 Benutzerverwaltung

### 📚 Benutzer-Handbücher

**→ Vollständige Dokumentation: [docs/README.md](docs/README.md)**

Detaillierte deutsche Handbücher für jede Rolle:

- **[Mitarbeiter Handbuch](docs/HANDBUCH_MITARBEITER.md)** - Für Teammitglieder
  - Registrierung und Anmeldung
  - Urlaubsanträge stellen und verwalten
  - iCal-Export für Kalender-Integration
  - Team-Übersicht nutzen
  - Einstellungen anpassen

- **[Organisations-Admin Handbuch](docs/HANDBUCH_ADMIN.md)** - Für Team-Administratoren
  - Mitarbeiter genehmigen
  - Urlaubsanträge verwalten
  - Organisations-Branding anpassen (Logo & Name)
  - Analytics und Berichte einsehen
  - Best Practices für Team-Management

- **[Tenant-Admin Handbuch](docs/HANDBUCH_TENANT_ADMIN.md)** - Für System-Administratoren
  - Organisationen erstellen und verwalten
  - Organisationsadministratoren einrichten
  - Multi-Tenant-Management
  - System-weite Übersicht

- **[Testdaten & Demo-Accounts](docs/TESTDATEN.md)** - Für Entwickler & Tester
  - Alle Login-Daten (Tenant Admin, Test GmbH)
  - Test-Szenarien zum Ausprobieren
  - Quick Start Guide

### Rollensystem

Das System implementiert eine **drei-stufige Hierarchie** für Multi-Tenant-Verwaltung:

| Rolle | Beschreibung | Berechtigungen |
|-------|--------------|----------------|
| **Tenant Admin** | System-Administrator | Organisationen erstellen, Organisation Admins ernennen, Zugriff auf Tenant-Panel (`/tenant-admin`), **kann KEINE Urlaubsanträge erstellen**, kann Urlaubsanträge genehmigen/ablehnen (inkl. eigene) |
| **Admin** | Organisations-Administrator | Mitarbeiter genehmigen, Urlaubsanträge seiner Organisation genehmigen/ablehnen (inkl. **eigene Anträge**), **Organisations-Branding anpassen** (Logo & Name), Analytics für seine Organisation einsehen, Urlaubsanträge erstellen |
| **Employee** | Mitarbeiter | Urlaubsanträge erstellen, Team-Kalender einsehen, eigenes Profil verwalten, kann **eigene Anträge NICHT genehmigen** |

### Multi-Tenant Architektur

```
Tenant Admin (tenantadmin@system.local)
  └─ Kann Organisationen erstellen
  └─ Kann Organisation Admins für jede Organisation ernennen
     
Organisation Admin (z.B. admin@firma-a.de)
  └─ Sieht nur Benutzer seiner Organisation
  └─ Genehmigt Mitarbeiter seiner Organisation
  └─ Genehmigt Urlaubsanträge seiner Organisation
     
Employee (z.B. mitarbeiter@firma-a.de)
  └─ Kann nur Daten seiner Organisation sehen
  └─ Stellt Urlaubsanträge
  └─ Sieht Team-Kalender seiner Organisation
```

### Benutzer-Genehmigungsworkflow

**Für Tenant Admin:**
1. Login mit `tenantadmin@system.local` / `TenantAdmin`
2. Organisation erstellen über `/tenant-admin`
3. Admin für Organisation erstellen
4. Admin erhält Status "approved" und kann sich sofort anmelden

**Für Organisation Admin:**
1. Tenant Admin erstellt Admin-Account
2. Admin meldet sich an
3. Admin navigiert zu `/admin/users`
4. Admin sieht nur pending Users seiner Organisation
5. Admin genehmigt Mitarbeiter

**Für Mitarbeiter:**
1. Mitarbeiter öffnet `/register`
2. Wählt Organisation aus Dropdown
3. Registrierung erfolgt mit Status "pending"
4. Admin seiner Organisation genehmigt ihn
5. Mitarbeiter kann sich anmelden

### Status-Verwaltung

Benutzer können folgende Status haben:

- **pending** - Wartet auf Admin-Genehmigung
- **approved** - Genehmigt und aktiv
- **suspended** - Temporär deaktiviert

---

## 💻 Technologie-Stack

### 🎨 Frontend

| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| **React** | ^18.0 | UI-Framework mit Hooks |
| **TypeScript** | ^5.0 | Statische Typisierung |
| **Vite** | ^4.0 | Build-Tool mit HMR |
| **TanStack Query** | ^5.0 | Server State Management |
| **Wouter** | ^3.0 | Lightweight Routing |
| **Tailwind CSS** | ^3.0 | Utility-First CSS |
| **Shadcn/ui** | Latest | Komponentenbibliothek |
| **Radix UI** | Latest | Zugängliche UI-Primitives |
| **React Hook Form** | ^7.0 | Formular-Management |
| **Zod** | ^3.0 | Schema-Validierung |
| **Framer Motion** | Latest | Animationen |
| **Date-fns** | ^2.0 | Datum/Zeit-Utilities |
| **Recharts** | ^2.0 | Datenvisualisierung |
| **Lucide React** | Latest | Icon-Bibliothek |

### 🔧 Backend

| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| **Node.js** | ^18.0 | JavaScript Runtime |
| **Express.js** | ^4.0 | Web-Framework |
| **TypeScript** | ^5.0 | Statische Typisierung |
| **Drizzle ORM** | Latest | Type-Safe ORM |
| **PostgreSQL** | ^14.0 | Relationale Datenbank |
| **Passport.js** | ^0.6 | Authentifizierung |
| **Passport Local** | ^1.0 | Email/Passwort Strategie |
| **bcryptjs** | ^2.4 | Passwort-Hashing |
| **Express Session** | ^1.17 | Session Management |
| **connect-pg-simple** | Latest | PostgreSQL Session Store |
| **WebSocket (ws)** | ^8.0 | Echtzeit-Kommunikation |
| **ICS** | ^3.0 | Kalender-Export |

---

## 📁 Projektstruktur

```
team-vacation-planner/
├── 📁 client/                    # Frontend-Anwendung
│   ├── 📁 src/
│   │   ├── 📁 components/        # Wiederverwendbare UI-Komponenten
│   │   │   ├── 📁 ui/            # Shadcn/ui Basis-Komponenten
│   │   │   ├── navbar.tsx        # Haupt-Navigation
│   │   │   ├── calendar.tsx      # Kalender-Komponente
│   │   │   ├── vacation-request-form.tsx
│   │   │   └── ...
│   │   ├── 📁 pages/             # Seiten-Komponenten
│   │   │   ├── login.tsx         # Login-Seite
│   │   │   ├── register.tsx      # Registrierungs-Seite
│   │   │   ├── dashboard.tsx     # Haupt-Dashboard
│   │   │   ├── requests.tsx      # Antragsübersicht
│   │   │   ├── admin-users.tsx   # Benutzerverwaltung (Admin)
│   │   │   ├── analytics.tsx     # Analytics-Dashboard
│   │   │   └── settings.tsx      # Benutzereinstellungen
│   │   ├── 📁 hooks/             # Custom React Hooks
│   │   │   ├── useAuth.ts        # Authentifizierung
│   │   │   └── use-toast.ts      # Toast-Benachrichtigungen
│   │   ├── 📁 lib/               # Utility-Funktionen
│   │   │   ├── queryClient.ts    # TanStack Query Setup
│   │   │   └── utils.ts          # Allgemeine Utilities
│   │   └── App.tsx               # Haupt-App-Komponente
│   └── index.html                # HTML-Template
├── 📁 server/                    # Backend-Anwendung
│   ├── index.ts                  # Server-Einstiegspunkt
│   ├── routes.ts                 # API-Route-Definitionen
│   ├── storage.ts                # Datenbank-Interface
│   ├── localAuth.ts              # Passport Local Authentifizierung
│   ├── authUtils.ts              # Passwort-Hashing und Utilities
│   ├── notificationService.ts    # WebSocket-Benachrichtigungen
│   └── vite.ts                   # Vite-Integration
├── 📁 shared/                    # Geteilte Typen & Schemas
│   └── schema.ts                 # Drizzle-Schema & Zod-Validierung
├── .env                          # Umgebungsvariablen (nicht in Git!)
├── package.json                  # NPM-Konfiguration
├── drizzle.config.ts            # Drizzle-ORM-Konfiguration
├── tailwind.config.ts           # Tailwind-CSS-Konfiguration
├── tsconfig.json                # TypeScript-Konfiguration
└── README.md                    # Diese Datei
```

---

## 🔐 Authentifizierung

### Email/Passwort Authentifizierung

Die Anwendung verwendet Passport.js mit Local Strategy für sichere Email/Passwort-Authentifizierung:

**Registrierung:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@beispiel.de",
  "password": "sicheres-passwort",
  "firstName": "Max",
  "lastName": "Mustermann",
  "organizationName": "Meine Firma GmbH" // optional
}
```

**Login:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@beispiel.de",
  "password": "sicheres-passwort"
}
```

**Logout:**
```http
POST /api/auth/logout
```

**Aktuellen Benutzer abrufen:**
```http
GET /api/auth/user
```

### Session Management

- **Session Store:** PostgreSQL mit `connect-pg-simple`
- **Session-Sicherheit:** Signierte Cookies mit `SESSION_SECRET`
- **Session-Gültigkeit:** 7 Tage
- **Automatische Bereinigung:** Abgelaufene Sessions werden automatisch entfernt

### Passwort-Sicherheit

- **Hashing-Algorithmus:** bcrypt mit 10 Salt Rounds
- **Mindestanforderungen:** 8 Zeichen
- **Speicherung:** Niemals im Klartext, nur Hash in Datenbank

### Autorisierung & Zugriffskontrolle

Das System implementiert mehrschichtige Sicherheitsmaßnahmen für kritische Operationen:

#### Urlaubsantrag-Erstellung
- **Tenant Admin Einschränkung:** `tenant_admin` Benutzer können **keine** Urlaubsanträge erstellen
  - **Frontend:** "Urlaub beantragen" Button wird für tenant_admin ausgeblendet
  - **Backend:** POST `/api/vacation-requests` gibt 403 Fehler für tenant_admin zurück
- **Rollenberechtigung:** Nur `admin` und `employee` Rollen dürfen Urlaubsanträge erstellen

#### Urlaubsgenehmigungen
- **Rollenbasierte Autorisierung:** Nur `admin` und `tenant_admin` Rollen dürfen Urlaubsanträge genehmigen oder ablehnen
- **Self-Approval Regeln:**
  - **Admins und Tenant Admins:** Dürfen ihre **eigenen** Urlaubsanträge genehmigen
  - **Employees:** Können ihre **eigenen** Anträge **nicht** genehmigen (403 Fehler)
- **Cross-Tenant Protection:** Organisationsübergreifende Zugriffe werden strikt verhindert - Admins können nur Anträge ihrer eigenen Organisation verwalten
- **Frontend-Guards:** Genehmigungsworkflow-Widgets sind nur für berechtigte Rollen sichtbar
- **Backend-Validation:** Alle kritischen API-Endpunkte validieren Rollen, Self-Approval und Organisationszugehörigkeit

#### Implementierte Schutzmechanismen
1. **UI-Layer:** 
   - Urlaubsantrag-Button wird für tenant_admin ausgeblendet
   - Genehmigungskontrollen nur für admin/tenant_admin sichtbar
2. **API-Layer:** 
   - Backend-Endpunkte prüfen Benutzerrolle vor jeder Operation
   - Tenant admins werden bei Urlaubsantrag-Erstellung blockiert
   - Employees werden bei Self-Approval blockiert
3. **Data-Layer:** Organisationsbasierte Datenisolierung auf Datenbankebene
4. **Business-Logic:** Rollenbasierte Self-Approval-Prüfung (Admins erlaubt, Employees verboten)

---

## 🗄️ Datenbank

### Schema-Übersicht

```sql
-- Haupttabellen
├── 🏢 organizations           # Unternehmen/Teams
├── 👤 users                   # Benutzer mit Rollen und Authentifizierung
├── 📋 vacation_requests       # Urlaubsanträge
├── 🔔 notifications          # Benachrichtigungen
├── 🎉 holidays                # Deutsche Feiertage (2025-2030)
└── 🔐 sessions               # Session-Daten
```

### Wichtige Tabellen

#### Users (Benutzer)
```typescript
users: {
  id: varchar().primaryKey().default(sql`gen_random_uuid()`),
  email: varchar().notNull().unique(),
  password: varchar(),                    // bcrypt Hash
  firstName: varchar(),
  lastName: varchar(),
  role: varchar().$type<'tenant_admin' | 'admin' | 'employee'>(),
  status: varchar().$type<'pending' | 'approved' | 'suspended'>(),
  organizationId: varchar().references(() => organizations.id),
  approvedBy: varchar().references(() => users.id),
  approvedAt: timestamp(),
  // Urlaubssaldo
  annualAllowance: integer().default(25),
  usedDays: real().default(0),
  // Erweiterte Profile
  skills: varchar().array(),
  department: varchar(),
  // Zeitstempel
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow()
}
```

### Datenbank-Commands

```bash
# Schema-Änderungen anwenden
npm run db:push

# Bei Problemen mit Force-Update
npm run db:push --force

# Datenbank-Studio öffnen (optional, für Entwicklung)
npm run db:studio
```

---

## 📡 API-Endpunkte

### 🔐 Authentifizierung & Benutzerverwaltung

```http
POST   /api/auth/register                 # Neuen Benutzer registrieren (mit organizationId)
POST   /api/auth/login                    # Anmelden
POST   /api/auth/logout                   # Abmelden
GET    /api/auth/user                     # Aktuellen Benutzer abrufen

GET    /api/users/pending                 # Ausstehende Benutzer (Admin, nur eigene Organisation)
POST   /api/users/:userId/approve         # Benutzer genehmigen (Admin)
PATCH  /api/users/:userId/role            # Benutzerrolle ändern (Admin)
PATCH  /api/users/:userId/status          # Benutzerstatus ändern (Admin)
```

### 🏢 Tenant Administration

```http
GET    /api/organizations                          # Alle Organisationen (öffentlich, für Registrierung)
GET    /api/tenant/organizations                   # Alle Organisationen (Tenant Admin)
POST   /api/tenant/organizations                   # Organisation erstellen (Tenant Admin)
POST   /api/tenant/organizations/:id/admin         # Admin für Organisation erstellen (Tenant Admin)
```

### 📋 Urlaubsanträge

```http
GET    /api/vacation-requests                    # Alle Anträge
POST   /api/vacation-requests                    # Neuen Antrag erstellen
GET    /api/vacation-requests/pending            # Wartende Anträge (Admin)
PATCH  /api/vacation-requests/:id/status         # Antrag genehmigen/ablehnen
DELETE /api/vacation-requests/:id                # Antrag löschen (nur eigene)
GET    /api/vacation-requests/:id/export/ical    # Einzelnen Antrag als iCal exportieren
GET    /api/vacation-requests/export/csv         # Alle eigenen Anträge als CSV exportieren
```

### 📊 Analytics & Berichte

```http
GET    /api/analytics/overview              # Allgemeine Statistiken
GET    /api/analytics/team-usage           # Team-Nutzungsstatistiken
GET    /api/analytics/trends               # Verlaufsdaten und Trends
```

### 👥 Team & Benutzer

```http
GET    /api/team                          # Teammitglieder
GET    /api/users/balance                 # Persönliches Urlaubssaldo
GET    /api/users/balance/all             # Alle Salden (Admin)
PUT    /api/users/:id/balance             # Saldo aktualisieren (Admin)
```

### 🎉 Feiertage & Kalender

```http
GET    /api/holidays                      # Deutsche Feiertage abrufen (optional: ?startYear=2025&endYear=2026)
GET    /api/calendar                      # Kalenderansicht mit Urlaubsanträgen
```

**Hinweis zur Urlaubsberechnung:**
- Wochenenden (Samstag/Sonntag) werden automatisch von den Urlaubstagen ausgeschlossen
- Deutsche bundesweite Feiertage werden nicht vom Urlaubskonto abgezogen
- Die Datenbank enthält vorkonfigurierte Feiertage für 2025-2030
- Bewegliche Feiertage (Ostern, Pfingsten, etc.) werden mit der Gauss'schen Osterformel berechnet

### 🔔 Benachrichtigungen

```http
GET    /api/notifications                 # Benachrichtigungen abrufen
PUT    /api/notifications/:id/read        # Als gelesen markieren
WS     /api/notifications/ws              # WebSocket-Verbindung
```

---

## 🚢 Produktiv-Deployment

### Vorbereitung für Produktion

1. **Umgebungsvariablen für Produktion konfigurieren:**

⚠️ **WICHTIG:** Setzen Sie `NODE_ENV=production` um die automatische Erstellung von Test-Accounts zu deaktivieren:

```env
# .env Datei für Produktion
NODE_ENV=production
SESSION_SECRET="sehr-langer-zufaelliger-string"
DATABASE_URL="postgresql://..."
PORT=5000
```

**Generieren Sie einen sicheren Session-Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

2. **Tenant Admin Passwort ändern (falls bereits entwickelt):**

Falls Sie die Anwendung bereits im Entwicklungsmodus gestartet haben, ändern Sie das Tenant Admin Passwort:

```bash
# Neues bcrypt Hash generieren
node -e "console.log(require('bcryptjs').hashSync('IhrNeuesStarkesPasswort', 10))"

# In Datenbank aktualisieren
psql $DATABASE_URL -c "UPDATE users SET password = 'neuer-bcrypt-hash' WHERE email = 'tenantadmin@system.local';"
```

3. **Build erstellen:**
```bash
npm run build
```

4. **Datenbank migrieren:**
```bash
npm run db:push
```

**Hinweis zu Test-Daten:**
- In Produktion (`NODE_ENV=production`) werden **keine** Test-Organisationen oder Test-Benutzer erstellt
- Nur der Tenant Admin wird automatisch angelegt
- Erstellen Sie Ihre Organisationen über das Tenant Admin Panel (`/tenant-admin`)

### Mit PM2 (empfohlen)

[PM2](https://pm2.keymetrics.io/) ist ein Production Process Manager für Node.js:

```bash
# PM2 global installieren
npm install -g pm2

# Anwendung mit PM2 starten
pm2 start npm --name "vacation-planner" -- start

# PM2 konfigurieren, um beim Systemstart zu starten
pm2 startup
pm2 save

# Logs anzeigen
pm2 logs vacation-planner

# Status prüfen
pm2 status

# Neustart
pm2 restart vacation-planner
```

### Mit Systemd (Linux)

Erstellen Sie eine Systemd Service-Datei: `/etc/systemd/system/vacation-planner.service`

```ini
[Unit]
Description=Team Vacation Planner
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/pfad/zum/team-vacation-planner
Environment="NODE_ENV=production"
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Service aktivieren:
```bash
sudo systemctl enable vacation-planner
sudo systemctl start vacation-planner
sudo systemctl status vacation-planner
```

### Mit Docker

Erstellen Sie eine `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

Docker Container bauen und starten:
```bash
# Build
docker build -t vacation-planner .

# Run
docker run -d \
  -p 5000:5000 \
  --env-file .env \
  --name vacation-planner \
  vacation-planner
```

### Reverse Proxy mit Nginx

Beispiel Nginx-Konfiguration:

```nginx
server {
    listen 80;
    server_name urlaub.ihredomäne.de;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket Support
    location /api/notifications/ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

SSL mit Let's Encrypt:
```bash
sudo certbot --nginx -d urlaub.ihredomäne.de
```

---

## 🔧 Wartung & Troubleshooting

### Häufige Probleme

#### Problem: "Failed to deserialize user out of session"
**Lösung:** Alte Sessions löschen
```sql
-- In PostgreSQL
TRUNCATE TABLE sessions;
```

#### Problem: Datenbank-Verbindungsfehler
**Lösung:** Prüfen Sie die DATABASE_URL und PostgreSQL-Status
```bash
# PostgreSQL-Status prüfen
sudo systemctl status postgresql

# PostgreSQL neu starten
sudo systemctl restart postgresql

# Verbindung testen
psql -h localhost -U vacation_admin -d team_vacation_planner
```

#### Problem: Port bereits in Verwendung
**Lösung:** Ändern Sie den Port in der .env Datei
```env
PORT=8080
```

### Logs überprüfen

```bash
# PM2 Logs
pm2 logs vacation-planner

# Systemd Logs
sudo journalctl -u vacation-planner -f

# Docker Logs
docker logs vacation-planner -f
```

### Backup & Wiederherstellung

**Datenbank-Backup erstellen:**
```bash
pg_dump -U vacation_admin -d team_vacation_planner > backup_$(date +%Y%m%d).sql
```

**Datenbank wiederherstellen:**
```bash
psql -U vacation_admin -d team_vacation_planner < backup_20250101.sql
```

### Updates einspielen

```bash
# Code aktualisieren
git pull origin main

# Dependencies aktualisieren
npm install

# Build neu erstellen
npm run build

# Datenbank-Schema aktualisieren
npm run db:push

# Anwendung neu starten
pm2 restart vacation-planner
# oder
sudo systemctl restart vacation-planner
```

---

## 📊 Monitoring & Performance

### Empfohlene Monitoring-Tools

- **PM2 Monitoring:** `pm2 monit`
- **PostgreSQL Monitoring:** pgAdmin, pg_stat_statements
- **Application Performance:** New Relic, DataDog
- **Uptime Monitoring:** UptimeRobot, Pingdom

### Performance-Optimierung

1. **Datenbank-Indizes:** Automatisch von Drizzle ORM erstellt
2. **Session-Cleanup:** Läuft automatisch via connect-pg-simple
3. **Caching:** TanStack Query im Frontend
4. **Gzip-Kompression:** In Nginx aktivieren

---

## 🤝 Beitragen

Contributions sind willkommen! Bitte erstellen Sie einen Pull Request oder öffnen Sie ein Issue.

---

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

---

## 📞 Support

Bei Fragen oder Problemen:
- Öffnen Sie ein Issue auf GitHub
- Konsultieren Sie die [Troubleshooting-Sektion](#-wartung--troubleshooting)

---

**Viel Erfolg mit Ihrem Team Urlaubsplaner! 🎉**
