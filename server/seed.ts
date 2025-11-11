import { storage } from "./storage";
import { hashPassword } from "./authUtils";
import { generateHolidaysForYears } from "./holidays";

export async function seedInitialTenantAdmin() {
  // Check if tenant admin already exists
  const existingAdmin = await storage.getUserByEmail("tenantadmin@system.local");
  
  if (existingAdmin) {
    console.log("Tenant Admin already exists, skipping seed");
    return;
  }

  // Create system organization for tenant admin
  let systemOrg = await storage.getOrganizationByDomain("system.local");
  if (!systemOrg) {
    systemOrg = await storage.createOrganization({
      name: "System Administration",
      domain: "system.local",
    });
  }

  // Create tenant admin user
  const hashedPassword = await hashPassword("TenantAdmin");
  await storage.createUser({
    email: "tenantadmin@system.local",
    password: hashedPassword,
    firstName: "Tenant",
    lastName: "Administrator",
    organizationId: systemOrg.id,
    role: "tenant_admin",
    status: "approved",
  });

  console.log("✓ Initial Tenant Admin created successfully");
  console.log("  Email: tenantadmin@system.local");
  console.log("  Password: TenantAdmin");
}

export async function seedTestOrganization() {
  // Check if test organization already exists
  let testOrg = await storage.getOrganizationByDomain("test-gmbh.de");
  
  if (!testOrg) {
    // Create Test GmbH organization
    testOrg = await storage.createOrganization({
      name: "Test GmbH",
      domain: "test-gmbh.de",
      defaultVacationDays: 30,
    });
    console.log("✓ Test GmbH organization created");
  } else {
    console.log("✓ Test GmbH organization already exists");
  }

  // Create organization admin: Max Manager
  const existingMax = await storage.getUserByEmail("max.manager@test-gmbh.de");
  if (!existingMax || existingMax.organizationId !== testOrg.id) {
    const maxPassword = await hashPassword("MaxManager123");
    await storage.createUser({
      email: "max.manager@test-gmbh.de",
      password: maxPassword,
      firstName: "Max",
      lastName: "Manager",
      organizationId: testOrg.id,
      role: "admin",
      status: "approved",
    });
    console.log("  ✓ Admin: Max Manager (max.manager@test-gmbh.de / MaxManager123)");
  } else {
    console.log("  ✓ Admin Max Manager already exists");
  }

  // Create employee: Udo User
  const existingUdo = await storage.getUserByEmail("udo.user@test-gmbh.de");
  if (!existingUdo || existingUdo.organizationId !== testOrg.id) {
    const udoPassword = await hashPassword("UdoUser123");
    await storage.createUser({
      email: "udo.user@test-gmbh.de",
      password: udoPassword,
      firstName: "Udo",
      lastName: "User",
      organizationId: testOrg.id,
      role: "employee",
      status: "approved",
    });
    console.log("  ✓ Mitarbeiter: Udo User (udo.user@test-gmbh.de / UdoUser123)");
  } else {
    console.log("  ✓ Mitarbeiter Udo User already exists");
  }

  // Create employee: Bernd Benutzer
  const existingBernd = await storage.getUserByEmail("bernd.benutzer@test-gmbh.de");
  if (!existingBernd || existingBernd.organizationId !== testOrg.id) {
    const berndPassword = await hashPassword("BerndBenutzer123");
    await storage.createUser({
      email: "bernd.benutzer@test-gmbh.de",
      password: berndPassword,
      firstName: "Bernd",
      lastName: "Benutzer",
      organizationId: testOrg.id,
      role: "employee",
      status: "approved",
    });
    console.log("  ✓ Mitarbeiter: Bernd Benutzer (bernd.benutzer@test-gmbh.de / BerndBenutzer123)");
  } else {
    console.log("  ✓ Mitarbeiter Bernd Benutzer already exists");
  }

  // Create employee: Moni Mitarbeiter
  const existingMoni = await storage.getUserByEmail("moni.mitarbeiter@test-gmbh.de");
  if (!existingMoni || existingMoni.organizationId !== testOrg.id) {
    const moniPassword = await hashPassword("MoniMitarbeiter123");
    await storage.createUser({
      email: "moni.mitarbeiter@test-gmbh.de",
      password: moniPassword,
      firstName: "Moni",
      lastName: "Mitarbeiter",
      organizationId: testOrg.id,
      role: "employee",
      status: "approved",
    });
    console.log("  ✓ Mitarbeiter: Moni Mitarbeiter (moni.mitarbeiter@test-gmbh.de / MoniMitarbeiter123)");
  } else {
    console.log("  ✓ Mitarbeiter Moni Mitarbeiter already exists");
  }

  console.log("✓ Test GmbH seed data completed successfully");
}

export async function seedHolidays() {
  // Check if holidays already exist
  const existingHolidays = await storage.getHolidays(2025, 2030);
  
  if (existingHolidays && existingHolidays.length > 0) {
    console.log("✓ Holidays already seeded for years 2025-2030");
    return;
  }
  
  // Generate German holidays for 2025-2030
  const holidays = generateHolidaysForYears(2025, 2030);
  
  // Insert holidays into database
  for (const holiday of holidays) {
    await storage.createHoliday(holiday);
  }
  
  console.log(`✓ Seeded ${holidays.length} German holidays for years 2025-2030`);
}
