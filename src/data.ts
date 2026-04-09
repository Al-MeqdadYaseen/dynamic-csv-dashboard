import Papa from 'papaparse';

export interface ParsedData {
  data: Record<string, any>[];
  columns: string[];
}

export const parseCSV = (csvString: string): ParsedData => {
  const parsed = Papa.parse(csvString.trim(), {
    header: true,
    skipEmptyLines: true,
    transform: (value) => {
      if (/^\$?\s*-?[\d,]+(\.\d+)?$/.test(value)) {
        const num = parseFloat(value.replace(/[^0-9.-]+/g, ''));
        if (!isNaN(num)) return num;
      }
      return value;
    },
    dynamicTyping: true,
  });

  return {
    data: parsed.data as Record<string, any>[],
    columns: parsed.meta.fields || [],
  };
};
