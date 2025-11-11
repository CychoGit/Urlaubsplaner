import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ExportData {
  headers: string[];
  rows: string[][];
  filename: string;
}

// Export data as CSV
export const exportToCSV = (data: ExportData) => {
  try {
    // Create CSV content with BOM for proper UTF-8 handling in Excel
    const BOM = '\uFEFF';
    const csvContent = [
      data.headers.join(','),
      ...data.rows.map(row => 
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma, newline, or quote
          const escaped = String(cell).replace(/"/g, '""');
          return /[,"\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
        }).join(',')
      )
    ].join('\n');

    // Create and download the file
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${data.filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('CSV Export failed:', error);
    return false;
  }
};

// Transform vacation usage data for export
export const prepareUsageDataForExport = (usageData: any[], dateRange: any) => {
  const headers = [
    'Mitarbeiter',
    'Abteilung', 
    'Genutzte Tage',
    'Verbleibende Tage',
    'Gesamt Tage',
    'Auslastung (%)',
    'Status'
  ];

  const rows = usageData.map(emp => [
    emp.name || '',
    emp.department || 'Unbekannt',
    emp.usedDays?.toString() || '0',
    emp.remainingDays?.toString() || '0',
    emp.totalDays?.toString() || '0',
    emp.utilizationRate?.toFixed(1) || '0.0',
    emp.utilizationRate > 80 ? 'Hoch' : emp.utilizationRate > 50 ? 'Mittel' : 'Niedrig'
  ]);

  return {
    headers,
    rows,
    filename: `Urlaubsnutzung_${format(new Date(dateRange.startDate), 'yyyy-MM-dd')}_bis_${format(new Date(dateRange.endDate), 'yyyy-MM-dd')}`
  };
};

// Transform department comparison data for export
export const prepareDepartmentDataForExport = (departmentData: any[], dateRange: any) => {
  const headers = [
    'Abteilung',
    'Mitarbeiter Gesamt',
    'Anträge Gesamt',
    'Genehmigte Anträge',
    'Urlaubstage Gesamt',
    'Ø Tage pro Mitarbeiter',
    'Auslastung (%)',
    'Genehmigungsrate (%)',
    'Bearbeitungszeit (h)'
  ];

  const rows = departmentData.map(dept => [
    dept.department || '',
    dept.totalEmployees?.toString() || '0',
    dept.totalRequests?.toString() || '0',
    dept.approvedRequests?.toString() || '0',
    dept.totalDays?.toString() || '0',
    dept.averageDaysPerEmployee?.toFixed(1) || '0.0',
    dept.utilizationRate?.toFixed(1) || '0.0',
    dept.approvalRate?.toFixed(1) || '0.0',
    dept.averageProcessingTime?.toFixed(1) || '0.0'
  ]);

  return {
    headers,
    rows,
    filename: `Abteilungsvergleich_${format(new Date(dateRange.startDate), 'yyyy-MM-dd')}_bis_${format(new Date(dateRange.endDate), 'yyyy-MM-dd')}`
  };
};

// Transform trends data for export
export const prepareTrendsDataForExport = (trendsData: any[]) => {
  const headers = [
    'Zeitraum',
    'Anträge',
    'Urlaubstage',
    'Genehmigungsrate (%)',
    'Bearbeitungszeit (h)',
    'Trend'
  ];

  const rows = trendsData.map(trend => [
    trend.period || '',
    trend.requestCount?.toString() || '0',
    trend.totalDays?.toString() || '0',
    trend.approvalRate?.toFixed(1) || '0.0',
    trend.averageProcessingTime?.toFixed(1) || '0.0',
    trend.requestCount > (trendsData[0]?.requestCount || 0) ? 'Steigend' : 'Fallend'
  ]);

  return {
    headers,
    rows,
    filename: `Urlaubstrends_${format(new Date(), 'yyyy-MM-dd')}`
  };
};

// Transform overview data for export
export const prepareOverviewDataForExport = (overviewData: any, dateRange: any) => {
  const headers = [
    'Kennzahl',
    'Wert',
    'Einheit',
    'Status'
  ];

  const rows = [
    ['Mitarbeiter Gesamt', overviewData.totalEmployees?.toString() || '0', 'Personen', 'Aktiv'],
    ['Anträge Gesamt', overviewData.totalRequests?.toString() || '0', 'Anträge', 'Alle'],
    ['Genehmigte Anträge', overviewData.approvedRequests?.toString() || '0', 'Anträge', 'Genehmigt'],
    ['Urlaubstage Gesamt', overviewData.totalVacationDays?.toString() || '0', 'Tage', 'Alle'],
    ['Auslastung', overviewData.utilizationRate?.toFixed(1) || '0.0', '%', overviewData.utilizationRate > 70 ? 'Hoch' : 'Normal'],
    ['Genehmigungsrate', overviewData.approvalRate?.toFixed(1) || '0.0', '%', overviewData.approvalRate > 90 ? 'Schnell' : 'Normal'],
    ['Konfliktrate', overviewData.conflictRate?.toFixed(1) || '0.0', '%', overviewData.conflictRate < 5 ? 'Niedrig' : 'Hoch'],
    ['Bearbeitungszeit', overviewData.averageProcessingTime?.toFixed(1) || '0.0', 'Stunden', 'Durchschnitt']
  ];

  return {
    headers,
    rows,
    filename: `Urlaubs_Übersicht_${format(new Date(dateRange.startDate), 'yyyy-MM-dd')}_bis_${format(new Date(dateRange.endDate), 'yyyy-MM-dd')}`
  };
};

// Transform coverage data for export
export const prepareCoverageDataForExport = (coverageData: any[], dateRange: any) => {
  const headers = [
    'Datum',
    'Wochentag',
    'Mitarbeiter Gesamt',
    'Im Urlaub',
    'Verfügbar',
    'Abdeckung (%)',
    'Bewertung'
  ];

  const rows = coverageData.slice(0, 100).map(day => [ // Limit to first 100 days to avoid huge files
    format(new Date(day.date), 'dd.MM.yyyy', { locale: de }),
    format(new Date(day.date), 'EEEE', { locale: de }),
    day.totalEmployees?.toString() || '0',
    day.onVacation?.toString() || '0',
    day.available?.toString() || '0',
    day.coveragePercentage?.toFixed(1) || '0.0',
    day.level === 'high' ? 'Hoch' : 
    day.level === 'medium' ? 'Mittel' : 
    day.level === 'low' ? 'Niedrig' : 'Kritisch'
  ]);

  return {
    headers,
    rows,
    filename: `Team_Abdeckung_${format(new Date(dateRange.startDate), 'yyyy-MM-dd')}_bis_${format(new Date(dateRange.endDate), 'yyyy-MM-dd')}`
  };
};

// Transform seasonal patterns for export
export const prepareSeasonalDataForExport = (seasonalData: any[]) => {
  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const headers = [
    'Monat',
    'Anträge',
    'Urlaubstage',
    'Popularität (%)',
    'Bewertung'
  ];

  const rows = seasonalData.map(pattern => [
    monthNames[pattern.month - 1] || '',
    pattern.requestCount?.toString() || '0',
    pattern.totalDays?.toString() || '0',
    pattern.popularityScore?.toFixed(1) || '0.0',
    pattern.popularityScore > 75 ? 'Sehr beliebt' :
    pattern.popularityScore > 50 ? 'Beliebt' : 'Normal'
  ]);

  return {
    headers,
    rows,
    filename: `Saisonale_Muster_${format(new Date(), 'yyyy')}`
  };
};

// Master export function that can export different data types
export const exportAnalyticsData = (
  dataType: 'overview' | 'team-usage' | 'departments' | 'trends' | 'coverage' | 'seasonal',
  data: any,
  dateRange: any,
  additionalData?: any
) => {
  let exportData: ExportData;

  switch (dataType) {
    case 'overview':
      exportData = prepareOverviewDataForExport(data, dateRange);
      break;
    case 'team-usage':
      exportData = prepareUsageDataForExport(data, dateRange);
      break;
    case 'departments':
      exportData = prepareDepartmentDataForExport(data, dateRange);
      break;
    case 'trends':
      exportData = prepareTrendsDataForExport(data);
      break;
    case 'coverage':
      exportData = prepareCoverageDataForExport(data, dateRange);
      break;
    case 'seasonal':
      exportData = prepareSeasonalDataForExport(data);
      break;
    default:
      throw new Error(`Unknown export data type: ${dataType}`);
  }

  return exportToCSV(exportData);
};