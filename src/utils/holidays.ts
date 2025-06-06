// Static holiday data for 2024/2025 for supported countries
// Format: { [countryCode]: { [YYYY-MM-DD]: holidayName } }

const holidays: Record<string, Record<string, string>> = {
  NL: {
    '2024-01-01': 'Nieuwjaarsdag',
    '2024-04-27': 'Koningsdag',
    '2024-05-05': 'Bevrijdingsdag',
    '2024-12-25': 'Eerste Kerstdag',
    '2024-12-26': 'Tweede Kerstdag',
    '2024-12-31': 'Oudjaarsdag',
    // ... add more Dutch holidays
  },
  DK: {
    '2024-01-01': 'Nytårsdag',
    '2024-12-25': 'Juledag',
    '2024-12-26': 'Anden juledag',
    // ... add more Danish holidays
  },
  BE: {
    '2024-01-01': 'Nieuwjaar',
    '2024-07-21': 'Nationale feestdag',
    '2024-12-25': 'Kerstmis',
    // ... add more Belgian holidays
  },
  DE: {
    '2024-01-01': 'Neujahr',
    '2024-10-03': 'Tag der Deutschen Einheit',
    '2024-12-25': 'Erster Weihnachtstag',
    '2024-12-26': 'Zweiter Weihnachtstag',
    // ... add more German holidays
  },
  SE: {
    '2024-01-01': 'Nyårsdagen',
    '2024-06-06': 'Sveriges nationaldag',
    '2024-12-25': 'Juldagen',
    // ... add more Swedish holidays
  },
  NO: {
    '2024-01-01': 'Nyttårsdag',
    '2024-05-17': 'Grunnlovsdag',
    '2024-12-25': 'Første juledag',
    // ... add more Norwegian holidays
  },
  LU: {
    '2024-01-01': 'Neijoerschdag',
    '2024-06-23': 'Nationalfeierdag',
    '2024-12-25': 'Chrëschtdag',
    // ... add more Luxembourg holidays
  },
};

const countryNames: Record<string, string> = {
  NL: 'the Netherlands',
  DK: 'Denmark',
  BE: 'Belgium',
  DE: 'Germany',
  SE: 'Sweden',
  NO: 'Norway',
  LU: 'Luxembourg',
};

export function getHolidaysForDate(date: Date): { country: string; name: string }[] {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const key = `${y}-${m}-${d}`;
  const result: { country: string; name: string }[] = [];
  for (const [country, days] of Object.entries(holidays)) {
    if (days[key]) {
      result.push({ country: countryNames[country], name: days[key] });
    }
  }
  return result;
}
