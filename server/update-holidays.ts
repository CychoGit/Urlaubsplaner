import { storage } from "./storage";
import { generateHolidaysForYears } from "./holidays";

async function updateHolidays() {
  console.log("Updating holidays with Heiligabend and Silvester...");
  
  // Delete existing holidays
  await storage.deleteAllHolidays();
  console.log("✓ Deleted existing holidays");
  
  // Generate new holidays including the two new ones
  const holidays = generateHolidaysForYears(2025, 2030);
  
  // Insert all holidays
  for (const holiday of holidays) {
    await storage.createHoliday(holiday);
  }
  
  console.log(`✓ Added ${holidays.length} holidays (including Heiligabend and Silvester)`);
  process.exit(0);
}

updateHolidays().catch((err) => {
  console.error("Error updating holidays:", err);
  process.exit(1);
});
