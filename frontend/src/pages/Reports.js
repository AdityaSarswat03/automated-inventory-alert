import React, { useState } from "react";
import { generateReport } from "../api";

const STORAGE_KEY = "inv_reports_history";

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function Reports() {
  const [fmt, setFmt] = useState("csv");
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState(loadHistory);

  const handleGenerate = async () => {
    setGenerating(true);
    setMessage("");
    try {
      const res = await generateReport(fmt);
      const entry = {
        filename: res.data.filename,
        format: res.data.format.toUpperCase(),
        date: res.data.generated_at,
        records: res.data.record_count,
      };
      const updated = [entry, ...history];
      setHistory(updated);
      saveHistory(updated);
      setMessage(
        `✅ Report generated — ${entry.records} records → ${entry.filename}`
      );
    } catch (err) {
      setMessage(
        "❌ Failed to generate report: " +
          (err.response?.data?.detail || err.message)
      );
    } finally {
      setGenerating(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  return (
    <div className="page">
      <h1 className="page-title">Reports</h1>

      <div className="card">
        <h2 className="card-title">Generate Stock Report</h2>
        <div className="report-controls">
          <select
            className="filter-select"
            value={fmt}
            onChange={(e) => setFmt(e.target.value)}
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? "Generating…" : "Generate Report"}
          </button>
        </div>
        {message && <p className="report-msg">{message}</p>}
      </div>

      <div className="card">
        <div className="card-header-row">
          <h2 className="card-title">
            Report History{" "}
            <span className="title-count">({history.length})</span>
          </h2>
          {history.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearHistory}>
              Clear
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="empty-msg">No reports generated yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Filename</th>
                  <th>Format</th>
                  <th>Records</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r, i) => (
                  <tr key={i}>
                    <td className="cell-id">{i + 1}</td>
                    <td className="cell-mono">{r.filename}</td>
                    <td>
                      <span
                        className={`badge ${
                          r.format === "CSV"
                            ? "badge-blue"
                            : "badge-purple"
                        }`}
                      >
                        {r.format}
                      </span>
                    </td>
                    <td className="cell-num">{r.records}</td>
                    <td className="cell-date">
                      {new Date(r.date).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
