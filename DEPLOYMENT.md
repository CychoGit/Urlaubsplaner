# 🚀 Produktions-Deployment auf Debian Server

Diese Anleitung beschreibt die Installation und Konfiguration des **Team Urlaubsplaner** auf einem Debian-basierten Linux-Server (Debian 11/12, Ubuntu 20.04/22.04/24.04) für den Produktionseinsatz.

## 📋 Inhaltsverzeichnis

1. [Server-Voraussetzungen](#server-voraussetzungen)
2. [Systemvorbereitung](#systemvorbereitung)
3. [PostgreSQL Installation](#postgresql-installation)
4. [Node.js Installation](#nodejs-installation)
5. [Anwendung einrichten](#anwendung-einrichten)
6. [Systemd Service einrichten](#systemd-service-einrichten)
7. [Nginx Reverse Proxy](#nginx-reverse-proxy)
8. [SSL/TLS mit Let's Encrypt](#ssltls-mit-lets-encrypt)
9. [Firewall-Konfiguration](#firewall-konfiguration)
10. [Backup-Strategie](#backup-strategie)
11. [Updates und Wartung](#updates-und-wartung)
12. [Monitoring](#monitoring)
13. [Troubleshooting](#troubleshooting)

---

## Server-Voraussetzungen

### Minimale Hardware-Anforderungen
- **CPU:** 2 Cores
- **RAM:** 2 GB (4 GB empfohlen)
- **Storage:** 20 GB SSD
- **Netzwerk:** Stabile Internetverbindung

### Empfohlene Hardware für Produktionsbetrieb
- **CPU:** 4 Cores
- **RAM:** 8 GB
- **Storage:** 50 GB SSD
- **Netzwerk:** 100 Mbit/s oder höher

### Betriebssystem
- Debian 11 (Bullseye) oder 12 (Bookworm)
- Ubuntu 20.04 LTS, 22.04 LTS oder 24.04 LTS
- Andere Debian-basierte Distributionen

### Domain & DNS
- Eine registrierte Domain (z.B. `urlaub.ihre-firma.de`)
- DNS A-Record zeigt auf die Server-IP-Adresse

---

## Systemvorbereitung

### 1. System aktualisieren

```bash
# Als root oder mit sudo
sudo apt update
sudo apt upgrade -y
```

### 2. Erforderliche Pakete installieren

```bash
sudo apt install -y \
  curl \
  wget \
  git \
  build-essential \
  ufw \
  certbot \
  python3-certbot-nginx
```

### 3. Dedicated User erstellen

Aus Sicherheitsgründen sollte die Anwendung **nicht** als root laufen:

```bash
# Neuen Benutzer erstellen
sudo adduser --system --group --home /opt/urlaubsplaner urlaubsplaner

# Home-Verzeichnis erstellen falls nicht vorhanden
sudo mkdir -p /opt/urlaubsplaner
sudo chown urlaubsplaner:urlaubsplaner /opt/urlaubsplaner
```

---

## PostgreSQL Installation

### 1. PostgreSQL installieren

```bash
# PostgreSQL und Contrib-Pakete installieren
sudo apt install -y postgresql postgresql-contrib

# PostgreSQL-Dienst starten und aktivieren
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Version prüfen (sollte 13+ sein)
psql --version
```

### 2. Datenbank und Benutzer erstellen

```bash
# Als postgres Benutzer wechseln
sudo -u postgres psql

# In der PostgreSQL-Konsole:
```

```sql
-- Datenbank erstellen
CREATE DATABASE team_vacation_planner;

-- Datenbank-Benutzer mit Passwort erstellen
-- WICHTIG: Dies ist NICHT der Super-Admin der Anwendung!
-- Dies ist ein technischer User für die Datenbank-Verbindung.
CREATE USER vacation_admin WITH ENCRYPTED PASSWORD 'IhrSehrSicheresPasswort123!';

-- Alle Rechte auf die Datenbank erteilen
GRANT ALL PRIVILEGES ON DATABASE team_vacation_planner TO vacation_admin;

-- Benutzer zum Superuser machen (für Schema-Migrationen mit Drizzle)
ALTER USER vacation_admin WITH SUPERUSER;

-- PostgreSQL verlassen
\q
```

**Hinweis:** Der Tenant Admin (Super-Admin der Anwendung) wird beim ersten Start automatisch erstellt und ist unabhängig von diesem Datenbank-User!

**Wichtig - Automatische Datenbank-Erkennung:** Die Anwendung erkennt automatisch, ob sie mit einer Neon-Datenbank (wie in Replit) oder einer lokalen PostgreSQL-Datenbank verbunden ist. Sie müssen keine speziellen Konfigurationen vornehmen - die App wählt automatisch den richtigen Datenbank-Treiber basierend auf der DATABASE_URL.

### 3. PostgreSQL Remote-Zugriff (optional)

Falls Sie von außerhalb auf die Datenbank zugreifen möchten:

```bash
# PostgreSQL-Konfiguration bearbeiten
sudo nano /etc/postgresql/*/main/postgresql.conf
```

Ändern Sie:
```conf
listen_addresses = 'localhost'  # nur lokal
# oder
listen_addresses = '*'  # von überall (Vorsicht!)
```

Bearbeiten Sie auch:
```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

Fügen Sie hinzu:
```conf
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    team_vacation_planner  vacation_admin  0.0.0.0/0        scram-sha-256
```

PostgreSQL neu starten:
```bash
sudo systemctl restart postgresql
```

---

## Node.js Installation

### Methode 1: NodeSource Repository (empfohlen)

```bash
# Node.js 20.x LTS installieren
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Version prüfen
node --version  # sollte v20.x.x sein
npm --version   # sollte 10.x.x sein
```

### Methode 2: NVM (Node Version Manager)

```bash
# Als urlaubsplaner User
sudo -u urlaubsplaner -i

# NVM installieren
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# NVM laden
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Node.js LTS installieren
nvm install --lts
nvm use --lts

# Zurück zum root/admin User
exit
```

---

## Anwendung einrichten

### 1. Repository klonen

```bash
# Als urlaubsplaner User
sudo -u urlaubsplaner -i

# Nach /opt/urlaubsplaner wechseln
cd /opt/urlaubsplaner

# Repository klonen
git clone https://github.com/CychoGit/TeamUrlaubplaner.git app

# In das App-Verzeichnis wechseln
cd app
```

### 2. Dependencies installieren

```bash
# NPM-Pakete installieren
npm install --production

# Zurück zum root/admin User
exit
```

### 3. Umgebungsvariablen konfigurieren

```bash
# .env Datei erstellen
sudo -u urlaubsplaner nano /opt/urlaubsplaner/app/.env
```

Fügen Sie folgende Konfiguration ein:

```env
# Datenbank-Konfiguration
DATABASE_URL="postgresql://vacation_admin:IhrSehrSicheresPasswort123!@localhost:5432/team_vacation_planner"
PGHOST="localhost"
PGPORT="5432"
PGUSER="vacation_admin"
PGPASSWORD="IhrSehrSicheresPasswort123!"
PGDATABASE="team_vacation_planner"

# Session-Secret (WICHTIG: Generieren Sie einen eigenen!)
SESSION_SECRET="94f8a7d6b3e2c1f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5"

# Server-Konfiguration
PORT="5000"
NODE_ENV="production"

# Optional: Externe Domain für Cookies
COOKIE_DOMAIN="urlaub.ihre-firma.de"
```

**Session-Secret generieren:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Kopieren Sie die Ausgabe und ersetzen Sie den `SESSION_SECRET` Wert.

### 4. Datenbank-Schema initialisieren

```bash
# Als urlaubsplaner User
sudo -u urlaubsplaner -i
cd /opt/urlaubsplaner/app

# Schema in die Datenbank pushen
npm run db:push

# Bei Warnungen mit --force
npm run db:push --force

# Zurück zum root User
exit
```

### 5. Build für Produktion erstellen

```bash
# Als urlaubsplaner User
sudo -u urlaubsplaner -i
cd /opt/urlaubsplaner/app

# Production Build
npm run build

# Testen ob Start funktioniert
npm start

# Strg+C zum Beenden
exit
```

---

## Systemd Service einrichten

Systemd stellt sicher, dass die Anwendung automatisch startet und bei Crashes neu gestartet wird.

### 1. Service-Datei erstellen

```bash
sudo nano /etc/systemd/system/urlaubsplaner.service
```

Fügen Sie folgende Konfiguration ein:

```ini
[Unit]
Description=Team Urlaubsplaner - Vacation Management System
Documentation=https://github.com/CychoGit/TeamUrlaubplaner
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=urlaubsplaner
Group=urlaubsplaner
WorkingDirectory=/opt/urlaubsplaner/app
Environment="NODE_ENV=production"
EnvironmentFile=/opt/urlaubsplaner/app/.env

# Start-Kommando
ExecStart=/usr/bin/npm start

# Restart-Strategie
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Sicherheits-Hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/urlaubsplaner/app

# Resource Limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
```

### 2. Service aktivieren und starten

```bash
# Systemd neu laden
sudo systemctl daemon-reload

# Service aktivieren (automatischer Start beim Boot)
sudo systemctl enable urlaubsplaner

# Service starten
sudo systemctl start urlaubsplaner

# Status prüfen
sudo systemctl status urlaubsplaner

# Logs anschauen
sudo journalctl -u urlaubsplaner -f
```

### 3. Service-Management-Befehle

```bash
# Service starten
sudo systemctl start urlaubsplaner

# Service stoppen
sudo systemctl stop urlaubsplaner

# Service neu starten
sudo systemctl restart urlaubsplaner

# Service-Status prüfen
sudo systemctl status urlaubsplaner

# Logs anzeigen
sudo journalctl -u urlaubsplaner -n 100 --no-pager

# Live-Logs folgen
sudo journalctl -u urlaubsplaner -f
```

---

## Nginx Reverse Proxy

Nginx dient als Reverse Proxy, terminiert SSL/TLS und leitet Anfragen an die Node.js-Anwendung weiter.

### 1. Nginx installieren

```bash
sudo apt install -y nginx

# Nginx starten und aktivieren
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Nginx-Konfiguration erstellen

```bash
sudo nano /etc/nginx/sites-available/urlaubsplaner
```

Fügen Sie folgende Konfiguration ein:

```nginx
# HTTP -> HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name urlaub.ihre-firma.de;

    # Let's Encrypt Challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect alle anderen Anfragen zu HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name urlaub.ihre-firma.de;

    # SSL-Zertifikate (werden später von Let's Encrypt erstellt)
    ssl_certificate /etc/letsencrypt/live/urlaub.ihre-firma.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/urlaub.ihre-firma.de/privkey.pem;

    # SSL-Konfiguration (Mozilla Intermediate)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logging
    access_log /var/log/nginx/urlaubsplaner-access.log;
    error_log /var/log/nginx/urlaubsplaner-error.log;

    # Client Body Size (für Datei-Uploads)
    client_max_body_size 10M;

    # Proxy zu Node.js App
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        
        # WebSocket Support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Standard Proxy Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Cache Bypass
        proxy_cache_bypass $http_upgrade;
    }

    # Static Assets Caching (optional, falls statische Assets über Nginx serviert werden)
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$ {
        proxy_pass http://localhost:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Wichtig:** Ersetzen Sie `urlaub.ihre-firma.de` mit Ihrer echten Domain!

### 3. Konfiguration aktivieren

```bash
# Symlink in sites-enabled erstellen
sudo ln -s /etc/nginx/sites-available/urlaubsplaner /etc/nginx/sites-enabled/

# Default-Site deaktivieren (optional)
sudo rm /etc/nginx/sites-enabled/default

# Nginx-Konfiguration testen
sudo nginx -t

# Nginx neu laden (aber noch NICHT neu starten, SSL-Zertifikat fehlt noch!)
# sudo systemctl reload nginx
```

---

## SSL/TLS mit Let's Encrypt

### 1. Temporäre HTTP-Konfiguration

Erstellen Sie temporär eine vereinfachte Nginx-Config ohne SSL:

```bash
sudo nano /etc/nginx/sites-available/urlaubsplaner-temp
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name urlaub.ihre-firma.de;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Aktivieren Sie die temporäre Config:

```bash
sudo rm /etc/nginx/sites-enabled/urlaubsplaner
sudo ln -s /etc/nginx/sites-available/urlaubsplaner-temp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 2. Let's Encrypt Zertifikat erhalten

```bash
# Certbot ausführen
sudo certbot --nginx -d urlaub.ihre-firma.de

# Folgen Sie den Anweisungen:
# - Email-Adresse eingeben
# - Terms of Service akzeptieren
# - Optional: Email-Benachrichtigungen von EFF
```

### 3. Vollständige HTTPS-Konfiguration aktivieren

```bash
# Zurück zur vollständigen Config
sudo rm /etc/nginx/sites-enabled/urlaubsplaner-temp
sudo ln -s /etc/nginx/sites-available/urlaubsplaner /etc/nginx/sites-enabled/

# Nginx testen und neu laden
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Automatische Zertifikats-Erneuerung

Certbot richtet automatisch einen Cron-Job oder Systemd-Timer ein. Testen Sie die Erneuerung:

```bash
# Dry-Run Test
sudo certbot renew --dry-run

# Manuell erneuern (falls nötig)
sudo certbot renew
```

---

## Firewall-Konfiguration

### UFW (Uncomplicated Firewall) einrichten

```bash
# UFW Regeln setzen
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH erlauben (WICHTIG: Vor dem Aktivieren!)
sudo ufw allow 22/tcp

# HTTP und HTTPS erlauben
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Optional: PostgreSQL von bestimmter IP
# sudo ufw allow from 203.0.113.5 to any port 5432

# UFW aktivieren
sudo ufw enable

# Status prüfen
sudo ufw status verbose
```

---

## Backup-Strategie

### 1. Datenbank-Backup-Script erstellen

```bash
sudo nano /opt/urlaubsplaner/backup-db.sh
```

```bash
#!/bin/bash

# Konfiguration
BACKUP_DIR="/opt/urlaubsplaner/backups"
DB_NAME="team_vacation_planner"
DB_USER="vacation_admin"
DB_HOST="localhost"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

# Backup-Verzeichnis erstellen
mkdir -p $BACKUP_DIR

# Datenbank-Backup erstellen
PGPASSWORD="IhrSehrSicheresPasswort123!" pg_dump \
    -h $DB_HOST \
    -U $DB_USER \
    -d $DB_NAME \
    | gzip > $BACKUP_FILE

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup erstellt: $BACKUP_FILE"
```

Ausführbar machen:

```bash
sudo chmod +x /opt/urlaubsplaner/backup-db.sh
sudo chown urlaubsplaner:urlaubsplaner /opt/urlaubsplaner/backup-db.sh
```

### 2. Automatisches Backup mit Cron

```bash
# Crontab als urlaubsplaner User bearbeiten
sudo -u urlaubsplaner crontab -e
```

Fügen Sie hinzu (täglich um 2 Uhr):

```cron
0 2 * * * /opt/urlaubsplaner/backup-db.sh >> /opt/urlaubsplaner/backup.log 2>&1
```

### 3. Backup wiederherstellen

```bash
# Backup-Datei dekomprimieren und in Datenbank importieren
gunzip < /opt/urlaubsplaner/backups/db_backup_20250101_020000.sql.gz | \
PGPASSWORD="IhrSehrSicheresPasswort123!" psql \
    -h localhost \
    -U vacation_admin \
    -d team_vacation_planner
```

---

## Feature-Konfiguration

### Urlaubssaldo-Tracking (Optional)

Das **Urlaubssaldo-Tracking** ist ein optionales Feature mit zweistufigem Gating, das keine speziellen Umgebungsvariablen benötigt.

**Standard-Einstellungen nach Installation:**
- Organisations-Ebene: `showVacationBalance` = `false` (deaktiviert)
- Benutzer-Ebene: `showVacationBalance` = `false` (deaktiviert)

**Funktionsweise:**
1. **Organisations-Ebene**: Administratoren aktivieren das Feature in Organisationseinstellungen (`/settings/organization`)
2. **Benutzer-Ebene**: Mitarbeiter aktivieren es individuell in Benutzereinstellungen (`/settings/user`)
3. **Dashboard-Anzeige**: Urlaubssaldo-Karte wird **NUR** angezeigt, wenn **BEIDE** Einstellungen aktiviert sind

**Keine zusätzliche Konfiguration erforderlich:**
- Feature-Flags werden in der Datenbank gespeichert
- Keine Umgebungsvariablen notwendig
- Jederzeit über die Benutzeroberfläche steuerbar

Weitere Details: [README.md - Urlaubssaldo-Tracking](../README.md#urlaubssaldo-tracking-optionales-feature)

---

## Updates und Wartung

### Anwendung aktualisieren

```bash
# Als urlaubsplaner User
sudo -u urlaubsplaner -i
cd /opt/urlaubsplaner/app

# Neueste Version holen
git fetch origin
git pull origin main

# Dependencies aktualisieren
npm install --production

# Neuen Build erstellen
npm run build

# Datenbank-Schema aktualisieren (falls nötig)
npm run db:push

# Zurück zum root User
exit

# Service neu starten
sudo systemctl restart urlaubsplaner

# Status prüfen
sudo systemctl status urlaubsplaner
```

### System-Updates

```bash
# Regelmäßig System aktualisieren
sudo apt update
sudo apt upgrade -y

# Bei Kernel-Updates neu starten
sudo reboot
```

---

## Monitoring

### 1. Logs überwachen

```bash
# Anwendungs-Logs
sudo journalctl -u urlaubsplaner -f

# Nginx-Logs
sudo tail -f /var/log/nginx/urlaubsplaner-access.log
sudo tail -f /var/log/nginx/urlaubsplaner-error.log

# PostgreSQL-Logs
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

### 2. Ressourcen-Überwachung

```bash
# CPU & RAM
htop

# Disk Usage
df -h

# Service-Status
sudo systemctl status urlaubsplaner nginx postgresql
```

### 3. Einfaches Monitoring-Script

```bash
sudo nano /opt/urlaubsplaner/monitor.sh
```

```bash
#!/bin/bash

echo "=== Team Urlaubsplaner Status ==="
echo "Zeitpunkt: $(date)"
echo ""

# Service-Status
echo "--- Services ---"
systemctl is-active urlaubsplaner && echo "✓ App läuft" || echo "✗ App läuft NICHT"
systemctl is-active nginx && echo "✓ Nginx läuft" || echo "✗ Nginx läuft NICHT"
systemctl is-active postgresql && echo "✓ PostgreSQL läuft" || echo "✗ PostgreSQL läuft NICHT"
echo ""

# Disk Space
echo "--- Disk Space ---"
df -h / | tail -1
echo ""

# Memory
echo "--- Memory ---"
free -h | grep Mem
echo ""

# Last 5 errors
echo "--- Letzte 5 Fehler ---"
journalctl -u urlaubsplaner -p err -n 5 --no-pager
```

Ausführbar machen:

```bash
sudo chmod +x /opt/urlaubsplaner/monitor.sh
```

Täglich per E-Mail verschicken (optional):

```bash
sudo crontab -e
```

```cron
0 8 * * * /opt/urlaubsplaner/monitor.sh | mail -s "Urlaubsplaner Status" admin@ihre-firma.de
```

---

## Troubleshooting

### Service startet nicht

```bash
# Logs prüfen
sudo journalctl -u urlaubsplaner -n 50 --no-pager

# Manuell starten und Output sehen
sudo -u urlaubsplaner -i
cd /opt/urlaubsplaner/app
npm start
```

### Datenbank-Verbindung fehlgeschlagen

```bash
# PostgreSQL läuft?
sudo systemctl status postgresql

# Verbindung testen
PGPASSWORD="IhrSehrSicheresPasswort123!" psql -h localhost -U vacation_admin -d team_vacation_planner

# PostgreSQL-Logs prüfen
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

### Nginx 502 Bad Gateway

```bash
# App läuft?
sudo systemctl status urlaubsplaner

# Port 5000 aktiv?
sudo ss -tlnp | grep 5000

# Nginx-Error-Log
sudo tail -f /var/log/nginx/urlaubsplaner-error.log
```

### SSL-Zertifikat Probleme

```bash
# Zertifikat prüfen
sudo certbot certificates

# Erneuern
sudo certbot renew --force-renewal

# Nginx neu laden
sudo systemctl reload nginx
```

### Hoher RAM-Verbrauch

```bash
# Node.js-Prozess finden
ps aux | grep node

# RAM-Limit setzen in systemd service
sudo nano /etc/systemd/system/urlaubsplaner.service
```

Hinzufügen:
```ini
[Service]
MemoryLimit=1G
```

Dann:
```bash
sudo systemctl daemon-reload
sudo systemctl restart urlaubsplaner
```

---

## Performance-Optimierung

### 1. Node.js Production-Tuning

In `/opt/urlaubsplaner/app/.env`:

```env
# Production-Optimierungen
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=2048"
```

### 2. PostgreSQL-Tuning

```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```

Empfohlene Änderungen für 4GB RAM Server:

```conf
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 5MB
min_wal_size = 1GB
max_wal_size = 4GB
```

PostgreSQL neu starten:

```bash
sudo systemctl restart postgresql
```

### 3. Nginx-Caching (optional)

Für statische Assets kann Nginx-Caching hinzugefügt werden. Siehe Nginx-Konfiguration oben.

---

## Sicherheits-Checkliste

- ✅ Firewall (UFW) aktiviert und konfiguriert
- ✅ SSH mit Key-Auth (Passwort-Auth deaktiviert)
- ✅ Dedicated User (urlaubsplaner) ohne root-Rechte
- ✅ SSL/TLS mit Let's Encrypt aktiviert
- ✅ Starke Passwörter für Datenbank
- ✅ SESSION_SECRET mit Crypto-Random generiert
- ✅ PostgreSQL nur lokal erreichbar (oder IP-beschränkt)
- ✅ Security Headers in Nginx konfiguriert
- ✅ Regelmäßige System-Updates
- ✅ Backup-Strategie implementiert
- ✅ Logs werden überwacht
- ✅ Fail2ban für SSH (optional, empfohlen)

---

## Support & Dokumentation

- **README:** `README.md` - Vollständige Feature-Übersicht
- **API-Dokumentation:** `README.md` - API-Endpunkte
- **Benutzer-Handbücher:**
  - `docs/HANDBUCH_TENANT_ADMIN.md`
  - `docs/HANDBUCH_ADMIN.md`
  - `docs/HANDBUCH_MITARBEITER.md`

---

**Viel Erfolg mit Ihrer Produktions-Installation!** 🚀

Bei Fragen oder Problemen öffnen Sie bitte ein Issue auf GitHub oder kontaktieren Sie den Support.
