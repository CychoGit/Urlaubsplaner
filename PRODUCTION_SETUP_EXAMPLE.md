# 📝 Produktions-Setup Beispiel

Diese Datei zeigt ein Beispiel für ein produktives Setup des Team Urlaubsplaner auf einem Linux-Server.

> ⚠️ **WICHTIG**: Dies ist ein Beispiel mit Platzhaltern. Ersetzen Sie alle Werte durch Ihre eigenen!

## 📋 Übersicht

- **Server**: RHEL 10 / Ubuntu 22.04 / Debian 12
- **Domain**: `urlaub.ihre-firma.de`
- **Datenbank**: PostgreSQL 16
- **Webserver**: Nginx als Reverse Proxy
- **SSL/TLS**: SAP CA / Let's Encrypt

---

## 1. PostgreSQL Datenbank Setup

### Datenbank erstellen

```bash
sudo -u postgres psql
```

```sql
-- Datenbank-User erstellen
CREATE USER vacation_admin WITH PASSWORD 'IhrSicheresPasswort2025';

-- Datenbank erstellen
CREATE DATABASE team_vacation_planner OWNER vacation_admin;

-- Rechte vergeben
GRANT ALL PRIVILEGES ON DATABASE team_vacation_planner TO vacation_admin;

-- Verbindung testen
\q
```

### Verbindung testen

```bash
PGPASSWORD='IhrSicheresPasswort2025' psql -U vacation_admin -d team_vacation_planner -h localhost
```

### ⚠️ Häufiger Fehler: Authentifizierung

Falls `peer authentication failed` auftritt:

```bash
sudo nano /var/lib/pgsql/data/pg_hba.conf
# ODER bei Debian/Ubuntu:
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Ändern Sie:
```
# Von:
local   all             all                                     peer

# Zu:
local   all             all                                     md5
```

Dann PostgreSQL neu starten:
```bash
sudo systemctl restart postgresql
```

---

## 2. Umgebungsvariablen (.env)

Erstellen Sie die `.env` Datei:

```bash
cd /opt/urlaubsplaner/app
nano .env
```

**Inhalt** (mit Ihren eigenen Werten):

```env
# ============================================
# PostgreSQL Datenbank-Konfiguration
# ============================================
DATABASE_URL="postgresql://vacation_admin:IhrSicheresPasswort2025@localhost:5432/team_vacation_planner"
PGHOST="localhost"
PGPORT="5432"
PGUSER="vacation_admin"
PGPASSWORD="IhrSicheresPasswort2025"
PGDATABASE="team_vacation_planner"

# ============================================
# Session & Sicherheit
# ============================================
# Generieren Sie einen zufälligen String mit:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
SESSION_SECRET="IHR_GENERIERTER_SESSION_SECRET_HIER"

# ============================================
# Server-Konfiguration
# ============================================
PORT="5000"
NODE_ENV="production"
```

### SESSION_SECRET generieren

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 3. Systemd Service einrichten

Erstellen Sie den Service:

```bash
sudo nano /etc/systemd/system/urlaubsplaner.service
```

**Inhalt**:

```ini
[Unit]
Description=Team Urlaubsplaner - Vacation Management System
Documentation=https://github.com/IhrUsername/TeamUrlaubplaner
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=ihrbenutzername
Group=ihrbenutzername
WorkingDirectory=/opt/urlaubsplaner/app

# Node.js Path (passen Sie an Ihr System an)
Environment="NODE_ENV=production"
Environment="PATH=/home/ihrbenutzername/.nvm/versions/node/vXX.XX.X/bin:/usr/local/bin:/usr/bin:/bin"

# Umgebungsvariablen aus .env Datei
EnvironmentFile=/opt/urlaubsplaner/app/.env

# Start-Befehl
ExecStart=/home/ihrbenutzername/.nvm/versions/node/vXX.XX.X/bin/npm start

# Restart-Strategie
Restart=always
RestartSec=10

# Sicherheit
NoNewPrivileges=true
PrivateTmp=true

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=urlaubsplaner

[Install]
WantedBy=multi-user.target
```

### Service aktivieren und starten

```bash
# Service neu laden
sudo systemctl daemon-reload

# Service aktivieren (Autostart)
sudo systemctl enable urlaubsplaner

# Service starten
sudo systemctl start urlaubsplaner

# Status prüfen
sudo systemctl status urlaubsplaner

# Logs ansehen
sudo journalctl -u urlaubsplaner -f
```

---

## 4. Nginx Reverse Proxy

### Nginx installieren

```bash
sudo apt install -y nginx
# ODER auf RHEL:
sudo dnf install -y nginx
```

### Nginx-Konfiguration erstellen

```bash
sudo nano /etc/nginx/conf.d/urlaubsplaner.conf
```

**Inhalt**:

```nginx
# HTTP zu HTTPS Weiterleitung
server {
    listen 80;
    listen [::]:80;
    server_name urlaub.ihre-firma.de;

    # Redirect zu HTTPS
    return 301 https://$host$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name urlaub.ihre-firma.de;

    # SSL Zertifikate
    ssl_certificate /etc/nginx/ssl/urlaubsplaner.crt;
    ssl_certificate_key /etc/nginx/ssl/urlaubsplaner.key;

    # SSL Konfiguration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/urlaubsplaner-access.log;
    error_log /var/log/nginx/urlaubsplaner-error.log;

    # Client Body Size (für Uploads)
    client_max_body_size 10M;

    # Proxy zu Node.js
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;

        # WebSocket Support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard Proxy Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static Assets Caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$ {
        proxy_pass http://localhost:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Nginx testen und neu starten

```bash
# Konfiguration testen
sudo nginx -t

# Nginx neu laden
sudo systemctl reload nginx

# Nginx Status prüfen
sudo systemctl status nginx
```

---

## 5. SSL/TLS Zertifikat

### Option A: Let's Encrypt (öffentliche Domain)

```bash
sudo certbot --nginx -d urlaub.ihre-firma.de
```

### Option B: Self-Signed Certificate (für Tests)

```bash
sudo mkdir -p /etc/nginx/ssl

sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/urlaubsplaner.key \
  -out /etc/nginx/ssl/urlaubsplaner.crt \
  -subj "/C=DE/ST=Germany/L=IhreStadt/O=IhreFirma/CN=urlaub.ihre-firma.de"
```

### Option C: Firmen-interne CA

1. CSR (Certificate Signing Request) erstellen:

```bash
sudo openssl req -new -newkey rsa:2048 -nodes \
  -keyout /etc/nginx/ssl/urlaubsplaner.key \
  -out /etc/nginx/ssl/urlaubsplaner.csr \
  -subj "/C=DE/ST=Germany/L=IhreStadt/O=IhreFirma/CN=urlaub.ihre-firma.de"
```

2. CSR bei Ihrer IT-Abteilung einreichen

3. Signiertes Zertifikat in `/etc/nginx/ssl/urlaubsplaner.crt` speichern

---

## 6. Firewall konfigurieren

```bash
# HTTP
sudo firewall-cmd --permanent --add-service=http
# ODER: sudo ufw allow 80/tcp

# HTTPS
sudo firewall-cmd --permanent --add-service=https
# ODER: sudo ufw allow 443/tcp

# Firewall neu laden
sudo firewall-cmd --reload
# ODER: sudo ufw enable
```

---

## 7. Feature-Konfiguration (Optional)

### Urlaubssaldo-Tracking

Das System enthält ein optionales **Urlaubssaldo-Tracking** Feature mit zweistufigem Gating:

**Standard nach Installation:**
- Organisations-Ebene: Deaktiviert (`showVacationBalance: false`)
- Benutzer-Ebene: Deaktiviert (`showVacationBalance: false`)

**Aktivierung:**
1. Als Administrator: Organisationseinstellungen → Urlaubssaldo-Tracking aktivieren
2. Als Mitarbeiter: Benutzereinstellungen → Urlaubssaldo-Tracking aktivieren
3. Dashboard zeigt Saldo-Karte nur wenn beide aktiviert sind

**Keine zusätzliche Konfiguration erforderlich** - wird über die Datenbank gesteuert.

---

## 8. Erster Admin-Benutzer

Der **Tenant Admin** wird beim ersten Start automatisch erstellt:

- **Email**: `tenantadmin@system.local`
- **Passwort**: `TenantAdmin`

**⚠️ WICHTIG**: Ändern Sie das Passwort nach dem ersten Login!

---

## 9. Troubleshooting

### Logs ansehen

```bash
# Anwendungs-Logs
sudo journalctl -u urlaubsplaner -f

# Nginx Logs
sudo tail -f /var/log/nginx/urlaubsplaner-error.log
sudo tail -f /var/log/nginx/urlaubsplaner-access.log
```

### Häufige Probleme

#### 1. Database Connection Failed

**Lösung**: Prüfen Sie:
- PostgreSQL läuft: `sudo systemctl status postgresql`
- Passwort in `.env` korrekt
- `pg_hba.conf` auf `md5` statt `peer`

#### 2. Session/Cookie Probleme nach Login

**Symptom**: 404 nach erfolgreichem Login

**Lösung**: Express muss dem Proxy vertrauen. In `server/index.ts`:

```typescript
app.set('trust proxy', 1);
```

#### 3. Permission Denied Fehler

**Lösung**: Berechtigungen prüfen:

```bash
sudo chown -R ihrbenutzername:ihrbenutzername /opt/urlaubsplaner/app
sudo chmod -R 755 /opt/urlaubsplaner/app
```

---

## 10. Backup-Strategie

### Datenbank Backup

```bash
# Manuelles Backup
pg_dump -U vacation_admin team_vacation_planner > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup wiederherstellen
psql -U vacation_admin team_vacation_planner < backup_20250101_120000.sql
```

### Automatisches tägliches Backup

Erstellen Sie ein Cron-Job:

```bash
crontab -e
```

Fügen Sie hinzu:
```
0 2 * * * pg_dump -U vacation_admin team_vacation_planner > /backup/urlaubsplaner_$(date +\%Y\%m\%d).sql
```

---

## 11. Updates durchführen

```bash
cd /opt/urlaubsplaner/app

# Änderungen pullen
git pull

# Dependencies aktualisieren
npm install --omit=dev

# Neu bauen
npm run build

# Service neu starten
sudo systemctl restart urlaubsplaner
```

---

## ✅ Checkliste für Go-Live

- [ ] PostgreSQL installiert und konfiguriert
- [ ] Datenbank und User erstellt
- [ ] `.env` Datei mit sicheren Secrets erstellt
- [ ] Anwendung gebaut (`npm run build`)
- [ ] Systemd Service konfiguriert und gestartet
- [ ] Nginx installiert und konfiguriert
- [ ] SSL/TLS Zertifikat installiert
- [ ] Firewall konfiguriert (Ports 80, 443 offen)
- [ ] DNS A-Record zeigt auf Server
- [ ] Erster Login funktioniert
- [ ] Admin-Passwort geändert
- [ ] Backup-Strategie eingerichtet

---

## 📚 Weitere Ressourcen

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Ausführliche Deployment-Anleitung
- [README.md](./README.md) - Allgemeine Projekt-Dokumentation
- [.env.example](./.env.example) - Beispiel für Umgebungsvariablen
