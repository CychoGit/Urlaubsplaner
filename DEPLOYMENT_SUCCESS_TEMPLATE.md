# ✅ Deployment Erfolgreich - Installationszusammenfassung

> 📋 **Vorlage**: Dies ist eine Vorlage zur Dokumentation Ihres erfolgreichen Deployments. Kopieren Sie diese Datei und füllen Sie Ihre eigenen Werte ein.

---

## 🎉 Status: Produktiv

**Installationsdatum**: [Datum einfügen]
**Installiert von**: [Ihr Name]
**Letztes Update**: [Datum einfügen]

---

## 🖥️ Server-Informationen

| Eigenschaft | Wert |
|-------------|------|
| **Hostname** | `ihr-server.ihre-firma.de` |
| **Betriebssystem** | RHEL 10 / Ubuntu 22.04 / Debian 12 |
| **IP-Adresse (intern)** | `10.x.x.x` |
| **IP-Adresse (extern)** | `203.0.113.10` (falls vorhanden) |
| **CPU** | 4 Cores |
| **RAM** | 8 GB |
| **Speicher** | 50 GB SSD |

---

## 🌐 Zugriff

| Service | URL / Details |
|---------|---------------|
| **Haupt-URL** | https://urlaub.ihre-firma.de |
| **Alternative URL** | https://10.x.x.x (nur intern) |
| **SSH Zugang** | `ssh benutzername@ihr-server.ihre-firma.de` |

---

## 🔐 Installierte Komponenten

### 1. PostgreSQL Datenbank

| Eigenschaft | Wert |
|-------------|------|
| **Version** | PostgreSQL 16.x |
| **Datenbank-Name** | `team_vacation_planner` |
| **Datenbank-User** | `vacation_admin` |
| **Port** | `5432` |
| **Host** | `localhost` |
| **Passwort** | ⚠️ Siehe `.env` Datei (nicht hier speichern!) |

**Status**: ✅ Läuft
**Prüfbefehl**: `sudo systemctl status postgresql`

### 2. Node.js Runtime

| Eigenschaft | Wert |
|-------------|------|
| **Version** | Node.js v22.x.x |
| **Installation via** | nvm |
| **Installationsort** | `/home/benutzername/.nvm/versions/node/v22.x.x` |

**Status**: ✅ Installiert
**Prüfbefehl**: `node --version`

### 3. Team Urlaubsplaner Application

| Eigenschaft | Wert |
|-------------|------|
| **Version** | [Git Tag/Branch] |
| **Installationsort** | `/opt/urlaubsplaner/app` |
| **Port** | `5000` (intern) |
| **User** | `benutzername` |

**Status**: ✅ Läuft
**Prüfbefehl**: `sudo systemctl status urlaubsplaner`

### 4. Nginx Reverse Proxy

| Eigenschaft | Wert |
|-------------|------|
| **Version** | nginx/1.26.x |
| **Config** | `/etc/nginx/conf.d/urlaubsplaner.conf` |
| **Ports** | 80 (HTTP), 443 (HTTPS) |

**Status**: ✅ Läuft
**Prüfbefehl**: `sudo systemctl status nginx`

### 5. SSL/TLS Zertifikat

| Eigenschaft | Wert |
|-------------|------|
| **Typ** | Let's Encrypt / SAP CA / Self-Signed |
| **Domain** | `urlaub.ihre-firma.de` |
| **Ausgestellt von** | [CA Name] |
| **Gültig bis** | [Datum] |
| **Zertifikat** | `/etc/nginx/ssl/urlaubsplaner.crt` |
| **Private Key** | `/etc/nginx/ssl/urlaubsplaner.key` |

**Status**: ✅ Aktiv
**Prüfbefehl**: `openssl x509 -in /etc/nginx/ssl/urlaubsplaner.crt -noout -dates`

---

## 📂 Wichtige Dateipfade

| Beschreibung | Pfad |
|--------------|------|
| **Anwendung** | `/opt/urlaubsplaner/app` |
| **Umgebungsvariablen** | `/opt/urlaubsplaner/app/.env` |
| **Systemd Service** | `/etc/systemd/system/urlaubsplaner.service` |
| **Nginx Config** | `/etc/nginx/conf.d/urlaubsplaner.conf` |
| **SSL Zertifikat** | `/etc/nginx/ssl/urlaubsplaner.crt` |
| **SSL Private Key** | `/etc/nginx/ssl/urlaubsplaner.key` |
| **PostgreSQL Config** | `/var/lib/pgsql/data/pg_hba.conf` (RHEL) <br> `/etc/postgresql/16/main/pg_hba.conf` (Debian/Ubuntu) |
| **Application Logs** | `sudo journalctl -u urlaubsplaner` |
| **Nginx Access Logs** | `/var/log/nginx/urlaubsplaner-access.log` |
| **Nginx Error Logs** | `/var/log/nginx/urlaubsplaner-error.log` |

---

## 👤 Admin-Zugang

| Eigenschaft | Wert |
|-------------|------|
| **Tenant Admin Email** | `tenantadmin@system.local` |
| **Standard-Passwort** | `TenantAdmin` |
| **Status** | ⚠️ Passwort beim ersten Login ändern! |

---

## 🔧 Konfigurationsdetails

### Umgebungsvariablen (.env)

```env
# Datenbank
DATABASE_URL="postgresql://vacation_admin:***@localhost:5432/team_vacation_planner"

# Session Secret
SESSION_SECRET="***" # 128 Zeichen langer Hex-String

# Server
PORT="5000"
NODE_ENV="production"
```

⚠️ **Echte Werte siehe**: `/opt/urlaubsplaner/app/.env` (nur auf dem Server!)

### Systemd Service

- **Service-Datei**: `/etc/systemd/system/urlaubsplaner.service`
- **Auto-Start**: ✅ Aktiviert
- **Restart-Policy**: Always (automatischer Neustart bei Fehler)

### Firewall

| Port | Protokoll | Service | Status |
|------|-----------|---------|--------|
| 80 | TCP | HTTP | ✅ Offen |
| 443 | TCP | HTTPS | ✅ Offen |
| 5000 | TCP | Node.js App | ❌ Nur intern |
| 5432 | TCP | PostgreSQL | ❌ Nur localhost |

---

## 🔄 Wichtige Befehle

### Service Management

```bash
# Anwendung starten/stoppen/neu starten
sudo systemctl start urlaubsplaner
sudo systemctl stop urlaubsplaner
sudo systemctl restart urlaubsplaner

# Status prüfen
sudo systemctl status urlaubsplaner

# Logs ansehen
sudo journalctl -u urlaubsplaner -f
```

### Nginx Management

```bash
# Nginx neu laden (ohne Downtime)
sudo systemctl reload nginx

# Nginx neu starten
sudo systemctl restart nginx

# Konfiguration testen
sudo nginx -t
```

### Datenbank Management

```bash
# Datenbank-Backup erstellen
pg_dump -U vacation_admin team_vacation_planner > backup_$(date +%Y%m%d).sql

# Datenbank wiederherstellen
psql -U vacation_admin team_vacation_planner < backup_20250101.sql

# Datenbank-Konsole öffnen
psql -U vacation_admin -d team_vacation_planner
```

### Updates durchführen

```bash
cd /opt/urlaubsplaner/app

# Code aktualisieren
git pull

# Dependencies installieren
npm install --omit=dev

# Neu bauen
npm run build

# Service neu starten
sudo systemctl restart urlaubsplaner
```

---

## 🐛 Troubleshooting

### Problem: Service startet nicht

**Lösung**:
```bash
# Logs prüfen
sudo journalctl -u urlaubsplaner -n 50

# Datenbank-Verbindung testen
psql -U vacation_admin -d team_vacation_planner -h localhost

# .env Datei prüfen
cat /opt/urlaubsplaner/app/.env
```

### Problem: 502 Bad Gateway

**Lösung**:
```bash
# Prüfen ob Node.js läuft
sudo systemctl status urlaubsplaner

# Prüfen ob Port 5000 erreichbar ist
curl http://localhost:5000
```

### Problem: SSL-Warnung im Browser

**Ursache**: Self-signed Zertifikat oder abgelaufenes Zertifikat

**Lösung**:
```bash
# Zertifikat-Gültigkeit prüfen
openssl x509 -in /etc/nginx/ssl/urlaubsplaner.crt -noout -dates

# Let's Encrypt erneuern
sudo certbot renew
```

---

## 📊 Monitoring & Maintenance

### Regelmäßige Checks (wöchentlich)

- [ ] Service läuft: `sudo systemctl status urlaubsplaner`
- [ ] Nginx läuft: `sudo systemctl status nginx`
- [ ] PostgreSQL läuft: `sudo systemctl status postgresql`
- [ ] Disk Space: `df -h`
- [ ] Error Logs prüfen: `sudo journalctl -u urlaubsplaner -p err -n 50`

### Regelmäßige Wartung (monatlich)

- [ ] System-Updates: `sudo apt update && sudo apt upgrade`
- [ ] Datenbank-Backup erstellen
- [ ] SSL-Zertifikat Gültigkeit prüfen
- [ ] Alte Logs bereinigen

---

## 🎓 Wichtige Erkenntnisse / Lessons Learned

### Gelöste Probleme während der Installation

1. **Problem**: [Beschreibung]
   **Lösung**: [Lösung]

2. **Problem**: Spezialzeichen im Passwort
   **Lösung**: Passwort ohne `!` und andere Sonderzeichen verwenden

3. **Problem**: Cookie-Session nach Login nicht persistent
   **Lösung**: `app.set('trust proxy', 1)` in `server/index.ts` hinzufügen

### Empfehlungen für zukünftige Installationen

- Passwörter ohne Spezialzeichen verwenden (oder korrekt escapen)
- `.env` Datei Berechtigungen: `chmod 600 .env`
- Regelmäßige Backups einrichten (Cronjob)
- Monitoring einrichten (z.B. Uptime-Kuma, Prometheus)

---

## 📞 Support & Kontakte

| Rolle | Name | Kontakt |
|-------|------|---------|
| **Administrator** | [Ihr Name] | [email@firma.de] |
| **Entwickler** | [Entwickler Name] | [dev@firma.de] |
| **IT-Support** | [IT-Team] | [it-support@firma.de] |

---

## 📝 Änderungshistorie

| Datum | Änderung | Durchgeführt von |
|-------|----------|------------------|
| 2025-xx-xx | Initiale Installation | [Ihr Name] |
| 2025-xx-xx | SSL-Zertifikat von SAP CA installiert | [Ihr Name] |
| 2025-xx-xx | Node.js Update auf v22.x | [Ihr Name] |

---

## ✅ Deployment Checklist

- [x] Server aufgesetzt
- [x] PostgreSQL installiert und konfiguriert
- [x] Node.js installiert (via nvm)
- [x] Anwendung geklont und gebaut
- [x] `.env` Datei mit Secrets erstellt
- [x] Systemd Service konfiguriert
- [x] Nginx Reverse Proxy eingerichtet
- [x] SSL/TLS Zertifikat installiert
- [x] Firewall konfiguriert
- [x] Erster Admin-Login erfolgreich
- [x] Admin-Passwort geändert
- [ ] Backup-Strategie eingerichtet
- [ ] Monitoring eingerichtet
- [ ] Dokumentation aktualisiert

---

**🎉 Deployment erfolgreich abgeschlossen!**

Stand: [Datum/Uhrzeit]
