# 📚 Dokumentation - Team Urlaubsplaner

Willkommen zur Dokumentation des Team Urlaubsplaners!

---

## 🎯 Schnellstart

| Ich bin... | Ich lese... |
|------------|-------------|
| **Neuer Mitarbeiter** | → [HANDBUCH_MITARBEITER.md](./HANDBUCH_MITARBEITER.md) |
| **Organisations-Administrator** | → [HANDBUCH_ADMIN.md](./HANDBUCH_ADMIN.md) |
| **System-Administrator (Tenant Admin)** | → [HANDBUCH_TENANT_ADMIN.md](./HANDBUCH_TENANT_ADMIN.md) |
| **Entwickler / Tester** | → [TESTDATEN.md](./TESTDATEN.md) |

---

## 📖 Benutzerhandbücher

### 👤 [HANDBUCH_MITARBEITER.md](./HANDBUCH_MITARBEITER.md)

**Für:** Normale Mitarbeiter / Employees

**Inhalt:**
- ✅ Registrierung und Anmeldung
- ✅ Urlaubsantrag erstellen
- ✅ Eigene Anträge verwalten
- ✅ Team-Kalender nutzen
- ✅ Profil-Einstellungen
- ✅ FAQ für häufige Fragen

**Zielgruppe:** Jeder, der Urlaub beantragen möchte

---

### 👔 [HANDBUCH_ADMIN.md](./HANDBUCH_ADMIN.md)

**Für:** Organisations-Administratoren

**Inhalt:**
- ✅ Urlaubsanträge genehmigen/ablehnen
- ✅ Neue Benutzer freischalten
- ✅ Mitarbeiter verwalten
- ✅ Organisationseinstellungen (Urlaubsregeln, Feiertage, Logo)
- ✅ Analytics und Statistiken
- ✅ Best Practices für Team-Management

**Zielgruppe:** Team-Leiter, Abteilungsleiter, HR-Mitarbeiter mit Admin-Rechten

---

### 🔐 [HANDBUCH_TENANT_ADMIN.md](./HANDBUCH_TENANT_ADMIN.md)

**Für:** System-Administratoren (Tenant Admins)

**Inhalt:**
- ✅ Organisationen erstellen und verwalten
- ✅ Benutzer-Rollen ändern
- ✅ System-Administration
- ✅ Multi-Tenant-Management
- ✅ Sicherheit & DSGVO-Compliance
- ✅ Backup & Wartung

**Zielgruppe:** IT-Administratoren, System-Admins bei Self-Hosting

---

### 🧪 [TESTDATEN.md](./TESTDATEN.md)

**Für:** Entwickler, Tester, Neue Administratoren

**Inhalt:**
- ✅ Alle Test-Zugangsdaten (Tenant Admin, Test GmbH)
- ✅ Test-Szenarien zum Ausprobieren
- ✅ Quick Start Guide
- ✅ Development vs Production

**Zielgruppe:** Jeder, der das System kennenlernen oder testen möchte

---

## 🛠️ Technische Dokumentation

Für Installation, Deployment und Entwicklung siehe im Hauptverzeichnis:

| Dokument | Beschreibung |
|----------|--------------|
| **[../README.md](../README.md)** | Projekt-Übersicht und Features |
| **[../DEPLOYMENT.md](../DEPLOYMENT.md)** | Ausführliche Deployment-Anleitung |
| **[../PRODUCTION_SETUP_EXAMPLE.md](../PRODUCTION_SETUP_EXAMPLE.md)** | Produktions-Setup mit Beispielen |
| **[../DEPLOYMENT_SUCCESS_TEMPLATE.md](../DEPLOYMENT_SUCCESS_TEMPLATE.md)** | Checkliste für erfolgreiche Installation |
| **[../PERMISSIONS.md](../PERMISSIONS.md)** | Berechtigungs-Matrix aller Rollen |

---

## 🎭 Rollen-Übersicht

```
Tenant Admin (System-Administrator)
    └── Admin (Organisations-Administrator)
        └── Employee (Mitarbeiter)
```

### Tenant Admin
- 🏢 Verwaltet alle Organisationen
- 🎭 Ändert Benutzer-Rollen
- ⚙️ System-weite Einstellungen
- 📊 Zugriff auf alles

### Admin
- ✅ Urlaubsanträge seiner Organisation genehmigen
- 👥 Neue Benutzer seiner Organisation freischalten
- ⚙️ Organisationseinstellungen ändern
- 📊 Analytics seiner Organisation

### Employee
- 📝 Urlaubsanträge erstellen
- 📅 Team-Kalender ansehen
- 👥 Team-Übersicht
- ⚙️ Eigenes Profil bearbeiten

---

## 🚀 Los geht's!

### Neue Installation?

1. **Installation durchführen**: [../DEPLOYMENT.md](../DEPLOYMENT.md)
2. **Als Tenant Admin einloggen**: Siehe [TESTDATEN.md](./TESTDATEN.md)
3. **Erste Organisation erstellen**: [HANDBUCH_TENANT_ADMIN.md](./HANDBUCH_TENANT_ADMIN.md)
4. **Admin ernennen**: [HANDBUCH_TENANT_ADMIN.md](./HANDBUCH_TENANT_ADMIN.md)
5. **Mitarbeiter einladen**: [HANDBUCH_ADMIN.md](./HANDBUCH_ADMIN.md)

### Bestehende Installation?

- **Mitarbeiter**: [HANDBUCH_MITARBEITER.md](./HANDBUCH_MITARBEITER.md)
- **Admin**: [HANDBUCH_ADMIN.md](./HANDBUCH_ADMIN.md)
- **System-Admin**: [HANDBUCH_TENANT_ADMIN.md](./HANDBUCH_TENANT_ADMIN.md)

---

## 💡 Tipps

### Für neue Benutzer

1. Starten Sie mit [TESTDATEN.md](./TESTDATEN.md)
2. Loggen Sie sich als Test-Benutzer ein (Udo, Max, etc.)
3. Probieren Sie verschiedene Szenarien aus
4. Lesen Sie dann Ihr rollenspezifisches Handbuch

### Für Administratoren

1. Lesen Sie zuerst [HANDBUCH_MITARBEITER.md](./HANDBUCH_MITARBEITER.md) (Basis-Funktionen)
2. Dann [HANDBUCH_ADMIN.md](./HANDBUCH_ADMIN.md) (Admin-Funktionen)
3. Bei Bedarf [HANDBUCH_TENANT_ADMIN.md](./HANDBUCH_TENANT_ADMIN.md) (System-Administration)

---

## 📞 Support

Bei Fragen oder Problemen:

| Art | Kontakt |
|-----|---------|
| **Bugs melden** | GitHub Issues |
| **Features vorschlagen** | GitHub Issues |
| **Technischer Support** | Ihr IT-Team oder Administrator |
| **Fragen zur Nutzung** | Ihr Organisations-Administrator |

---

## 📝 Dokumentation beitragen

Die Dokumentation ist Teil des Open-Source-Projekts!

**Verbesserungen vorschlagen:**
1. Fork das Repository
2. Änderungen in `docs/` vornehmen
3. Pull Request erstellen

**Oder:**
- Issue auf GitHub erstellen mit Verbesserungsvorschlägen

---

## 📄 Lizenz

Die Dokumentation ist Teil des Team Urlaubsplaner Projekts.

---

**Viel Erfolg mit dem Team Urlaubsplaner!** 🎉

*Letzte Aktualisierung: November 2025*
