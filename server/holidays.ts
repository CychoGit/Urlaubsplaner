import type { InsertHoliday } from "@shared/schema";

// Calculate Easter Sunday using the Gauss Easter algorithm
function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
}

// Add days to a date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate German public holidays for a given year
export function generateGermanHolidays(year: number): Omit<InsertHoliday, 'id' | 'createdAt'>[] {
  const holidays: Omit<InsertHoliday, 'id' | 'createdAt'>[] = [];
  
  // Calculate Easter for this year
  const easter = calculateEaster(year);
  
  // Fixed holidays
  holidays.push({
    name: "Neujahr",
    date: formatDate(new Date(year, 0, 1)),
    year,
    isNational: "true",
    state: null,
  });
  
  holidays.push({
    name: "Tag der Arbeit",
    date: formatDate(new Date(year, 4, 1)),
    year,
    isNational: "true",
    state: null,
  });
  
  holidays.push({
    name: "Tag der Deutschen Einheit",
    date: formatDate(new Date(year, 9, 3)),
    year,
    isNational: "true",
    state: null,
  });
  
  holidays.push({
    name: "Heiligabend",
    date: formatDate(new Date(year, 11, 24)),
    year,
    isNational: "true",
    state: null,
  });
  
  holidays.push({
    name: "1. Weihnachtstag",
    date: formatDate(new Date(year, 11, 25)),
    year,
    isNational: "true",
    state: null,
  });
  
  holidays.push({
    name: "2. Weihnachtstag",
    date: formatDate(new Date(year, 11, 26)),
    year,
    isNational: "true",
    state: null,
  });
  
  holidays.push({
    name: "Silvester",
    date: formatDate(new Date(year, 11, 31)),
    year,
    isNational: "true",
    state: null,
  });
  
  // Movable holidays (based on Easter)
  holidays.push({
    name: "Karfreitag",
    date: formatDate(addDays(easter, -2)),
    year,
    isNational: "true",
    state: null,
  });
  
  holidays.push({
    name: "Ostermontag",
    date: formatDate(addDays(easter, 1)),
    year,
    isNational: "true",
    state: null,
  });
  
  holidays.push({
    name: "Christi Himmelfahrt",
    date: formatDate(addDays(easter, 39)),
    year,
    isNational: "true",
    state: null,
  });
  
  holidays.push({
    name: "Pfingstmontag",
    date: formatDate(addDays(easter, 50)),
    year,
    isNational: "true",
    state: null,
  });
  
  return holidays;
}

// Generate holidays for multiple years
export function generateHolidaysForYears(startYear: number, endYear: number): Omit<InsertHoliday, 'id' | 'createdAt'>[] {
  const allHolidays: Omit<InsertHoliday, 'id' | 'createdAt'>[] = [];
  
  for (let year = startYear; year <= endYear; year++) {
    const yearHolidays = generateGermanHolidays(year);
    allHolidays.push(...yearHolidays);
  }
  
  return allHolidays;
}

// Check if a date is a weekend (Saturday or Sunday)
export function isWeekend(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

// Calculate business days between two dates (excluding weekends and holidays)
export function calculateBusinessDays(
  startDate: string,
  endDate: string,
  holidays: string[]
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let businessDays = 0;
  
  const current = new Date(start);
  while (current <= end) {
    const dateStr = formatDate(current);
    
    // Skip weekends and holidays
    if (!isWeekend(current) && !holidays.includes(dateStr)) {
      businessDays++;
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return businessDays;
}
