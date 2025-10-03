"use client";
import React, { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * SummaryComponent
 * - Accepts `datas` (Array of job objects)
 * - Filters: TYPE (Shiftly, Daily, Weekly, Monthly, Yearly), createdAt (date range), LINE_NAME
 * - Group By: TYPE or LINE_NAME
 * - Renders a Pie chart of counts by selected grouping after filters are applied
 */
const TYPE_OPTIONS = ["Shiftly", "Daily", "Weekly", "Monthly", "Yearly"]; // allowed types

function coerceDate(d) {
  // Accepts Date|string|number|null and returns a Date or null
  if (!d) return null;
  try {
    const dd = new Date(d);
    return isNaN(dd.getTime()) ? null : dd;
  } catch {
    return null;
  }
}

function endOfDay(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
}

const SummaryComponent = ({ datas = [] }) => {
  // --- UI State ---
  const [groupBy, setGroupBy] = useState("TYPE"); // "TYPE" | "LINE_NAME"
  const [selectedTypes, setSelectedTypes] = useState(new Set()); // empty = all
  const [selectedLines, setSelectedLines] = useState(new Set()); // empty = all
  const [startDate, setStartDate] = useState(""); // yyyy-mm-dd
  const [endDateStr, setEndDateStr] = useState(""); // yyyy-mm-dd

  // --- Unique LINE_NAMEs from incoming data ---
  const lineOptions = useMemo(() => {
    const s = new Set();
    for (const it of datas || []) {
      if (it?.LINE_NAME) s.add(String(it.LINE_NAME));
    }
    return Array.from(s).sort();
  }, [datas]);

  // --- Filtered data ---
  const filtered = useMemo(() => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDateStr ? endOfDay(endDateStr) : null;

    return (datas || []).filter((it) => {
      // TYPE filter
      const t = String(it?.TYPE ?? "");
      if (selectedTypes.size > 0 && !selectedTypes.has(t)) return false;

      // LINE_NAME filter
      const ln = String(it?.LINE_NAME ?? "");
      if (selectedLines.size > 0 && !selectedLines.has(ln)) return false;

      // createdAt filter
      const created = coerceDate(it?.createdAt);
      if (start && (!created || created < start)) return false;
      if (end && (!created || created > end)) return false;

      return true;
    });
  }, [datas, selectedTypes, selectedLines, startDate, endDateStr]);

  // --- Grouping ---
  const grouped = useMemo(() => {
    const map = new Map();
    for (const it of filtered) {
      const key = groupBy === "LINE_NAME" ? String(it?.LINE_NAME ?? "(no line)") : String(it?.TYPE ?? "(no type)");
      map.set(key, (map.get(key) || 0) + 1);
    }
    const labels = Array.from(map.keys());
    const values = labels.map((k) => map.get(k));
    return { labels, values };
  }, [filtered, groupBy]);

  const totalCount = filtered.length;

  const chartData = useMemo(() => ({
    labels: grouped.labels,
    datasets: [
      {
        label: `Jobs (${groupBy})`,
        data: grouped.values,
      },
    ],
  }), [grouped, groupBy]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const label = ctx?.label ?? "";
            const v = ctx?.parsed ?? 0;
            const pct = totalCount ? ((v / totalCount) * 100).toFixed(1) : "0.0";
            return `${label}: ${v} (${pct}%)`;
          },
        },
      },
    },
  }), [totalCount]);

  // --- Handlers ---
  const toggleType = (val) => {
    setSelectedTypes((prev) => {
      const n = new Set(prev);
      if (n.has(val)) n.delete(val);
      else n.add(val);
      return n;
    });
  };

  const toggleLine = (val) => {
    setSelectedLines((prev) => {
      const n = new Set(prev);
      if (n.has(val)) n.delete(val);
      else n.add(val);
      return n;
    });
  };

  const resetFilters = () => {
    setSelectedTypes(new Set());
    setSelectedLines(new Set());
    setStartDate("");
    setEndDateStr("");
  };

  return (
    <div className="flex flex-col gap-6 p-4 w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Summary (Pie)</h2>
        <div className="text-sm text-gray-600">Total: <span className="font-semibold">{totalCount}</span></div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Group By */}
        <div className="bg-white rounded-2xl shadow p-4">
          <label className="block text-sm font-medium mb-2">Group by</label>
          <select
            className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
          >
            <option value="TYPE">TYPE</option>
            <option value="LINE_NAME">LINE_NAME</option>
          </select>
        </div>

        {/* Type filter */}
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">TYPE</label>
            <button
              type="button"
              className="text-xs underline text-blue-600 hover:text-blue-800"
              onClick={() => setSelectedTypes(new Set())}
              title="Clear type filter"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((t) => (
              <label key={t} className="inline-flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1 border">
                <input
                  type="checkbox"
                  className="accent-blue-600"
                  checked={selectedTypes.has(t)}
                  onChange={() => toggleType(t)}
                />
                <span className="text-sm">{t}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div className="bg-white rounded-2xl shadow p-4">
          <label className="block text-sm font-medium mb-2">createdAt (range)</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              className="rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              type="date"
              className="rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={endDateStr}
              onChange={(e) => setEndDateStr(e.target.value)}
            />
          </div>
        </div>

        {/* LINE_NAME filter */}
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">LINE_NAME</label>
            <button
              type="button"
              className="text-xs underline text-blue-600 hover:text-blue-800"
              onClick={() => setSelectedLines(new Set())}
              title="Clear line filter"
            >
              Clear
            </button>
          </div>
          {lineOptions.length === 0 ? (
            <div className="text-sm text-gray-500">No LINE_NAMEs in data</div>
          ) : (
            <div className="max-h-44 overflow-auto pr-1 flex flex-col gap-2">
              {lineOptions.map((ln) => (
                <label key={ln} className="inline-flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1 border">
                  <input
                    type="checkbox"
                    className="accent-blue-600"
                    checked={selectedLines.has(ln)}
                    onChange={() => toggleLine(ln)}
                  />
                  <span className="text-sm">{ln}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reset */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={resetFilters}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 active:scale-95 transition shadow-sm"
        >
          Reset filters
        </button>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl shadow p-6">
        {grouped.labels.length === 0 ? (
          <div className="text-gray-500 text-sm">No data for current filters.</div>
        ) : (
          <Pie data={chartData} options={chartOptions} />
        )}
      </div>

      {/* Tabular breakdown */}
      <div className="bg-white rounded-2xl shadow p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-4">{groupBy}</th>
                <th className="py-2">Count</th>
              </tr>
            </thead>
            <tbody>
              {grouped.labels.map((label, idx) => (
                <tr key={label} className="border-t">
                  <td className="py-2 pr-4">{label}</td>
                  <td className="py-2">{grouped.values[idx]}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t font-medium">
                <td className="py-2 pr-4">Total</td>
                <td className="py-2">{totalCount}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SummaryComponent;
