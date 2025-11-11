# 📋 Installations-Checkliste

Bevor Sie mit der Installation beginnen, sammeln Sie folgende Informationen:

## ✏️ Werte, die Sie anpassen müssen

### 1. Domain & Server
- [ ] **Ihre Domain:** `_______________________` (z.B. `urlaub.meine-firma.de`)
- [ ] **Server-IP:** `_______________________` (z.B. `203.0.113.45`)
- [ ] **DNS A-Record gesetzt:** Domain zeigt auf Server-IP

### 2. PostgreSQL Datenbank
**WICHTIG:** Dies ist ein technischer Datenbank-User, NICHT der Super-Admin der Anwendung!
- [ ] **Datenbankname:** `team_vacation_planner` (Standard, oder eigener Name)
- [ ] **DB-Benutzer:** `vacation_admin` (technischer User für DB-Verbindung)
- [ ] **DB-Passwort:** `_______________________` (Starkes Passwort generieren!)

### 3. Session Secret
- [ ] **Session-Secret generieren:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Notieren: `_______________________`

### 4. Git Repository
- [x] **GitHub Username:** `CychoGit`
- [x] **Repository-URL:** `https://github.com/CychoGit/TeamUrlaubplaner.git`

---

## 🔧 Dateien, die angepasst werden müssen

### 1. `.env` Datei erstellen
```bash
cp .env.example .env
nano .env
```

**Zu ersetzen:**
- `IhrSicheresPasswort` → Ihr DB-Passwort
- `generieren-sie-einen-langen-zufaelligen-string-hier` → Ihr Session-Secret

### 2. Nginx-Konfiguration
```bash
nano /etc/nginx/sites-available/urlaubsplaner
```

**Zu ersetzen (3 Stellen):**
- `urlaub.ihre-firma.de` → Ihre echte Domain

### 3. Git Repository klonen

**Git Repository klonen:**
```bash
git clone https://github.com/CychoGit/TeamUrlaubplaner.git app
cd app
```

**Falls Sie lokal entwickeln:**
```bash
# Kopieren Sie das Projekt-Verzeichnis direkt auf den Server
scp -r ./team-vacation-planner user@server-ip:/opt/urlaubsplaner/
```

### 4. Systemd Service
```bash
nano /etc/systemd/system/urlaubsplaner.service
```

**Optional zu ersetzen:**
- `https://github.com/IHR-USERNAME/team-vacation-planner` in Zeile 3 (Documentation)

---

## ✅ Schnell-Ersetzung mit sed

Falls Sie alle Platzhalter auf einmal ersetzen möchten:

```bash
# Ihre Domain hier eintragen
IHRE_DOMAIN="urlaub.meine-firma.de"

# Nginx-Konfiguration anpassen
sudo sed -i "s/urlaub\.ihre-firma\.de/$IHRE_DOMAIN/g" /etc/nginx/sites-available/urlaubsplaner
```

---

## 📝 Installations-Schritte (Kurzfassung)

1. **Server vorbereiten**
   - System aktualisieren: `sudo apt update && sudo apt upgrade -y`
   - Basis-Pakete installieren: `sudo apt install -y curl wget git build-essential ufw certbot python3-certbot-nginx`
   
2. **PostgreSQL installieren**
   - Installation: `sudo apt install -y postgresql postgresql-contrib`
   - Service starten: `sudo systemctl start postgresql && sudo systemctl enable postgresql`
   - Datenbank erstellen (siehe DEPLOYMENT.md Abschnitt "PostgreSQL Installation")

3. **Node.js installieren**
   - NodeSource Repository: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -`
   - Installation: `sudo apt install -y nodejs`
   - Verifizieren: `node --version` (sollte v20.x.x sein)

4. **Anwendung installieren**
   - Benutzer erstellen: `sudo adduser --system --group --home /opt/urlaubsplaner urlaubsplaner`
   - Repository klonen: `git clone https://github.com/CychoGit/TeamUrlaubplaner.git app`
   - Dependencies: `npm install --production`
   - Build: `npm run build`
   - `.env` Datei erstellen und konfigurieren
   - Datenbank-Schema: `npm run db:push`

5. **Systemd Service**
   - Service-Datei kopieren und anpassen
   - Service aktivieren und starten

6. **Nginx & SSL**
   - Nginx installieren: `sudo apt install -y nginx`
   - Nginx-Config kopieren und Domain anpassen
   - Let's Encrypt SSL-Zertifikat: `sudo certbot --nginx -d ihre-domain.de`
   - Nginx neu laden: `sudo systemctl reload nginx`

7. **Firewall konfigurieren**
   - UFW aktivieren: `sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable`

8. **Testen**
   - `https://ihre-domain.de` aufrufen
   - Mit Tenant-Admin anmelden
   
9. **Feature-Verifikation (Optional)**
   - Als Admin: Organisationseinstellungen → Urlaubssaldo-Tracking Feature testen
   - Als Mitarbeiter: Benutzereinstellungen → Urlaubssaldo-Tracking Feature testen
   - Dashboard prüfen: Saldo-Karte wird nur angezeigt wenn beide aktiviert

---

## 🎯 Benötigen Sie die Werte?

**Was Sie noch anpassen müssen:**
- Ihre Domain in der Nginx-Konfiguration (z.B. `urlaub.ihre-firma.de`)
- Datenbankpasswort in der `.env` Datei
- Session-Secret in der `.env` Datei generieren

**Das Repository ist bereits korrekt konfiguriert:**
✅ `https://github.com/CychoGit/TeamUrlaubplaner.git`

---

## 📞 Alternative: Lokale Installation via SCP (ohne Git)

Falls Sie das Projekt direkt vom lokalen Rechner hochladen möchten:

```bash
# Auf Ihrem lokalen Rechner (wo das Projekt ist)
tar -czf urlaubsplaner.tar.gz ./TeamUrlaubplaner

# Auf den Server hochladen
scp urlaubsplaner.tar.gz user@server-ip:/tmp/

# Auf dem Server
sudo -u urlaubsplaner -i
mkdir -p /opt/urlaubsplaner
cd /opt/urlaubsplaner
tar -xzf /tmp/urlaubsplaner.tar.gz
mv TeamUrlaubplaner app
cd app
npm install --production
npm run build
```

Dann weiter mit Schritt 3 aus der DEPLOYMENT.md.
