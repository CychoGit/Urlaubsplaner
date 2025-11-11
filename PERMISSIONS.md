# 🔐 Berechtigungsmatrix - Team Urlaubsplaner

## Rollen-Hierarchie

```
tenant_admin (System-Administrator)
    └── admin (Organisations-Administrator)
        └── employee (Mitarbeiter)
```

---

## Frontend-Routen

| Route | tenant_admin | admin | employee | Beschreibung |
|-------|--------------|-------|----------|--------------|
| `/` (Dashboard) | ✅ | ✅ | ✅ | Dashboard mit Kalender, eigene Stats |
| `/requests` | ✅ | ✅ | ✅ | Eigene Urlaubsanträge verwalten |
| `/calendar` | ✅ | ✅ | ✅ | Team-Kalender anzeigen |
| `/team` | ✅ | ✅ | ✅ | Team-Übersicht |
| `/settings/user` | ✅ | ✅ | ✅ | Eigene Benutzereinstellungen |
| `/settings/organization` | ✅ | ✅ | ❌ | **Organisationseinstellungen** |
| `/admin/users` | ✅ | ✅ | ❌ | **Benutzer genehmigen** |
| `/tenant-admin` | ✅ | ❌ | ❌ | **System-Administration** |
| `/analytics` | ✅ | ✅ | ❌ | **Detaillierte Analytics** |

---

## Backend API-Endpunkte

### 🔓 Öffentlich (nur Authentifizierung erforderlich)

| Methode | Endpunkt | tenant_admin | admin | employee | Beschreibung |
|---------|----------|--------------|-------|----------|--------------|
| GET | `/api/auth/user` | ✅ | ✅ | ✅ | Eigenes Profil |
| POST | `/api/auth/logout` | ✅ | ✅ | ✅ | Logout |
| GET | `/api/team` | ✅ | ✅ | ✅ | Team-Mitglieder (eigene Org) |
| GET | `/api/calendar` | ✅ | ✅ | ✅ | Kalender (eigene Org) |
| GET | `/api/users/balance` | ✅ | ✅ | ✅ | Eigener Urlaubssaldo |
| GET | `/api/organizations/:id` | ✅ | ✅ | ✅ | Eigene Organisation (read-only für employees) |

### 📝 Eigene Daten (Alle Benutzer)

| Methode | Endpunkt | tenant_admin | admin | employee | Bedingung |
|---------|----------|--------------|-------|----------|-----------|
| POST | `/api/vacation-requests` | ✅ | ✅ | ✅ | Eigene Anträge erstellen |
| GET | `/api/vacation-requests` | ✅ | ✅ | ✅ | Eigene Anträge anzeigen |
| PATCH | `/api/vacation-requests/:id` | ✅ | ✅ | ✅ | Nur eigene, status=pending |
| DELETE | `/api/vacation-requests/:id` | ✅ | ✅ | ✅ | Nur eigene, status=pending |
| PATCH | `/api/users/:id/settings` | ✅ | ✅ | ✅ | Nur eigene Einstellungen |

### 👥 Organisation verwalten (Admin + Tenant Admin)

| Methode | Endpunkt | tenant_admin | admin | employee | Zusatzbedingungen |
|---------|----------|--------------|-------|----------|-------------------|
| GET | `/api/vacation-requests/pending` | ✅ | ✅ | ❌ | Eigene Org |
| PATCH | `/api/vacation-requests/:id/status` | ✅ | ✅ | ❌ | Eigene Org, kein Self-Approval |
| PATCH | `/api/organizations/:id/settings` | ✅ | ✅ | ❌ | Nur eigene Org |
| GET | `/api/admin/pending-users` | ✅ | ✅ | ❌ | Eigene Org |
| PATCH | `/api/admin/users/:id/approve` | ✅ | ✅ | ❌ | Eigene Org |
| PATCH | `/api/admin/users/:id/reject` | ✅ | ✅ | ❌ | Eigene Org |
| GET | `/api/stats` | ✅ | ✅ | ❌ | Eigene Org |
| GET | `/api/team-coverage-analysis` | ✅ | ✅ | ❌ | Eigene Org |

### 🏢 System-Administration (Nur Tenant Admin)

| Methode | Endpunkt | tenant_admin | admin | employee | Beschreibung |
|---------|----------|--------------|-------|----------|--------------|
| POST | `/api/organizations` | ✅ | ❌ | ❌ | Neue Organisation erstellen |
| GET | `/api/organizations` | ✅ | ❌ | ❌ | Alle Organisationen auflisten |
| DELETE | `/api/organizations/:id` | ✅ | ❌ | ❌ | Organisation löschen |
| PATCH | `/api/admin/users/:id/role` | ✅ | ❌ | ❌ | Rolle ändern |
| PATCH | `/api/admin/users/:id/status` | ✅ | ❌ | ❌ | Status ändern |

---

## Sicherheits-Regeln

### ✅ Erlaubt

1. **Mitarbeiter:**
   - Eigene Urlaubsanträge erstellen/bearbeiten (nur wenn status=pending)
   - Eigenes Profil anzeigen/bearbeiten
   - Team-Kalender und Team-Übersicht ansehen
   - Eigenen Urlaubssaldo einsehen
   - Eigene Organisation lesen (z.B. für Urlaubssaldo-Tracking Feature)

2. **Admin:**
   - Alles was Mitarbeiter dürfen
   - Urlaubsanträge der eigenen Organisation genehmigen/ablehnen (außer eigene)
   - Neue Benutzer der eigenen Organisation genehmigen
   - Organisationseinstellungen der eigenen Organisation ändern
   - Analytics und Statistiken der eigenen Organisation einsehen

3. **Tenant Admin:**
   - Alles was Admin dürfen
   - Neue Organisationen erstellen/löschen
   - Benutzer-Rollen ändern (admin ↔ employee)
   - System-weite Administration

### ❌ Verboten

1. **Mitarbeiter dürfen NICHT:**
   - Urlaubsanträge genehmigen/ablehnen
   - Organisationseinstellungen ändern
   - Neue Benutzer genehmigen
   - Analytics/Stats ansehen
   - Admin-Seiten besuchen

2. **Admin darf NICHT:**
   - Organisationen erstellen/löschen
   - Benutzer-Rollen ändern
   - Zugriff auf andere Organisationen
   - Eigene Urlaubsanträge genehmigen

3. **Alle dürfen NICHT:**
   - Cross-Organization Zugriffe
   - Self-Approval von Urlaubsanträgen
   - Fremde Benutzerprofile bearbeiten

---

## Implementierungs-Checkliste

### Backend-Middleware
- [ ] `requireRole(['admin', 'tenant_admin'])` - Middleware für Admin-Funktionen
- [ ] `requireTenantAdmin()` - Middleware für Tenant-Admin-exklusive Funktionen
- [ ] `requireSameOrganization()` - Middleware für Org-Validierung
- [ ] `preventSelfApproval()` - Middleware gegen Self-Approval

### Frontend-Guards
- [ ] `ProtectedRoute` - HOC für rollenbasierte Route-Protection
- [ ] `useRequireRole()` - Hook für Komponenten-Level-Guards
- [ ] Navigation-Filter basierend auf Benutzer-Rolle

### API-Endpoints (zu sichern)
- [ ] `/api/organizations/:id/settings` - PATCH
- [ ] `/api/organizations/:id` - GET
- [ ] `/api/admin/*` - Alle Admin-Endpunkte
- [ ] `/api/stats` - GET
- [ ] `/api/team-coverage-analysis` - GET
