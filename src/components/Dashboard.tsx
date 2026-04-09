import React, { useMemo, useState, useRef } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { parseCSV, ParsedData } from "../data";
import {
  Upload,
  Settings2,
  BarChart3,
  Hash,
  List,
  Calendar,
} from "lucide-react";

const COLORS = [
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

export default function Dashboard() {
  const [dataset, setDataset] = useState<ParsedData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const parsedData = parseCSV(text);
        setDataset(parsedData);
      }
    };
    reader.readAsText(file);
  };

  const { data, columns } = dataset || { data: [], columns: [] };

  const columnTypes = useMemo(() => {
    const types: Record<string, 'number' | 'date' | 'string'> = {};
    columns.forEach(col => {
      const sample = data.map(d => d[col]).filter(v => v !== null && v !== undefined && v !== '');
      if (sample.length === 0) { types[col] = 'string'; return; }
      
      const isNumber = sample.every(v => typeof v === 'number');
      if (isNumber) { types[col] = 'number'; return; }
      
      const isDate = sample.every(v => {
        if (typeof v === 'number') return false;
        const d = new Date(v);
        return !isNaN(d.getTime());
      });
      if (isDate) { types[col] = 'date'; return; }
      
      types[col] = 'string';
    });
    return types;
  }, [data, columns]);

  const numericCols = columns.filter(c => columnTypes[c] === 'number');
  const dateCols = columns.filter(c => columnTypes[c] === 'date');
  const stringCols = columns.filter(c => columnTypes[c] === 'string');

  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLineAxis, setSelectedLineAxis] = useState<string>('');

  // Initialize selections when dataset changes
  React.useEffect(() => {
    if (columns.length > 0) {
      setSelectedMetric(numericCols.length > 0 ? numericCols[0] : 'Count');
      setSelectedCategory(stringCols.length > 0 ? stringCols[0] : columns[0]);
      setSelectedLineAxis(dateCols.length > 0 ? dateCols[0] : columns[0]);
    }
  }, [columns]);

  if (!dataset) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans text-slate-900">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Upload className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
            Upload Data
          </h1>
          <p className="text-slate-500 mb-8">
            Upload any CSV file to instantly generate a dynamic dashboard. We'll automatically detect columns and data types.
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            ref={fileInputRef}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
          >
            Select CSV File
          </button>
        </div>
      </div>
    );
  }

  const metricValue = (row: any) => selectedMetric === 'Count' ? 1 : (Number(row[selectedMetric]) || 0);

  const totalMetric = data.reduce((sum, row) => sum + metricValue(row), 0);
  const avgMetric = data.length > 0 ? totalMetric / data.length : 0;
  const uniqueCategories = new Set(data.map(row => row[selectedCategory])).size;

  const timeSeriesData = selectedLineAxis ? data.reduce((acc, row) => {
    let d = row[selectedLineAxis];
    if (columnTypes[selectedLineAxis] === 'date') {
      try {
        d = new Date(d).toISOString().split('T')[0];
      } catch(e) {}
    } else {
      d = String(d);
    }
    if (!d) return acc;
    const existing = acc.find(item => item.date === d);
    if (existing) {
      existing.value += metricValue(row);
    } else {
      acc.push({ date: d, value: metricValue(row) });
    }
    return acc;
  }, [] as {date: string, value: number}[]).sort((a, b) => {
    if (columnTypes[selectedLineAxis] === 'number') {
      return Number(a.date) - Number(b.date);
    }
    return a.date.localeCompare(b.date);
  }) : [];

  const categoryData = selectedCategory ? data.reduce((acc, row) => {
    const cat = String(row[selectedCategory] || 'Unknown');
    const existing = acc.find(item => item.name === cat);
    if (existing) {
      existing.value += metricValue(row);
    } else {
      acc.push({ name: cat, value: metricValue(row) });
    }
    return acc;
  }, [] as {name: string, value: number}[]).sort((a, b) => b.value - a.value) : [];

  const topCategories = categoryData.slice(0, 10);

  const formatValue = (val: number) => {
    if (selectedMetric === 'Count') return val.toLocaleString();
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Dynamic Dashboard
            </h1>
            <p className="text-slate-500 mt-1">
              Visualizing {data.length} rows from your uploaded file.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all ring-[6px] ring-slate-200">
              <Hash className="w-4 h-4 text-slate-500" />
              <select 
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="text-sm text-slate-700 bg-transparent outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="Count">Row Count</option>
                {numericCols.map(c => <option key={c} value={c}>{c} (Sum)</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all ring-[6px] ring-slate-200">
              <List className="w-4 h-4 text-slate-500" />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm text-slate-700 bg-transparent outline-none cursor-pointer max-w-[150px] truncate"
              >
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all ring-[6px] ring-slate-200">
              <Calendar className="w-4 h-4 text-slate-500" />
              <select 
                value={selectedLineAxis}
                onChange={(e) => setSelectedLineAxis(e.target.value)}
                className="text-sm text-slate-700 bg-transparent outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="">No Line Chart</option>
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button
              onClick={() => setDataset(null)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              Upload New
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 ring-[6px] ring-slate-200">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500">
                Total {selectedMetric}
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {formatValue(totalMetric)}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 ring-[6px] ring-slate-200">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <Settings2 className="w-8 h-8" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500">Average {selectedMetric}</p>
              <p className="text-2xl font-bold text-slate-900">{formatValue(avgMetric)}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 ring-[6px] ring-slate-200">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-xl shrink-0">
              <List className="w-8 h-8" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500">
                Unique {selectedCategory}s
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {uniqueCategories.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time Series */}
          {selectedLineAxis && timeSeriesData.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ring-[6px] ring-slate-200 lg:col-span-2">
              <h2 className="text-lg font-semibold mb-6">{selectedMetric} over {selectedLineAxis}</h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timeSeriesData}
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      tickFormatter={(val) => selectedMetric === 'Count' ? val : val.toLocaleString(undefined, { notation: 'compact' })}
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatValue(value), selectedMetric]}
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#0ea5e9"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: "#0ea5e9", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ring-[6px] ring-slate-200">
            <h2 className="text-lg font-semibold mb-6">Top 10 {selectedCategory} by {selectedMetric}</h2>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topCategories}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    tickFormatter={(val) => selectedMetric === 'Count' ? val : val.toLocaleString(undefined, { notation: 'compact' })}
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatValue(value), selectedMetric]}
                    cursor={{ fill: "#f1f5f9" }}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                    {topCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ring-[6px] ring-slate-200">
            <h2 className="text-lg font-semibold mb-6">{selectedMetric} Distribution by {selectedCategory}</h2>
            <div className="h-[350px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {topCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatValue(value), selectedMetric]}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Raw Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ring-[6px] ring-slate-200">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold">Raw Data (First 100 rows)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  {columns.map(col => (
                    <th key={col} scope="col" className="px-6 py-4 font-medium whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 100).map((row, idx) => (
                  <tr key={idx} className="bg-white border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    {columns.map(col => (
                      <td key={col} className="px-6 py-4 whitespace-nowrap">
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
