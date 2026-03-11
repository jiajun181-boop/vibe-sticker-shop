"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function dayName(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return DAY_NAMES[d.getDay()];
}

const PRIORITY_DOT = {
  urgent: "bg-red-500",
  rush: "bg-amber-500",
  normal: "bg-gray-400",
};

const STATUS_BADGE = {
  queued: "bg-gray-100 text-gray-700",
  assigned: "bg-blue-100 text-blue-700",
  printing: "bg-yellow-100 text-yellow-700",
  quality_check: "bg-purple-100 text-purple-700",
  on_hold: "bg-red-100 text-red-600",
};

export default function ProductionSchedulePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/production/schedule")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[#999]">
        Loading schedule...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-red-600">
        Failed to load schedule
      </div>
    );
  }

  const { summary, overdue, today, scheduled, unscheduled, dailyLoad } = data;
  const maxDayCount = Math.max(1, ...dailyLoad.map((d) => d.count));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-black">Production Schedule</h1>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/admin/production"
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa]"
          >
            List View
          </Link>
          <Link
            href="/admin/production/board"
            className="rounded-[3px] border border-[#d0d0d0] px-3 py-1.5 text-xs font-medium text-black hover:bg-[#fafafa]"
          >
            Board View
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <div className="rounded-[3px] border border-gray-200 bg-gray-50 px-3 py-2 text-center">
          <p className="text-lg font-bold text-gray-700">{summary.totalActive}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Active Jobs</p>
        </div>
        <div className={`rounded-[3px] border px-3 py-2 text-center ${summary.overdueCount > 0 ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
          <p className={`text-lg font-bold ${summary.overdueCount > 0 ? "text-red-700" : "text-gray-500"}`}>{summary.overdueCount}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-red-500">Overdue</p>
        </div>
        <div className={`rounded-[3px] border px-3 py-2 text-center ${summary.rushCount > 0 ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-gray-50"}`}>
          <p className={`text-lg font-bold ${summary.rushCount > 0 ? "text-amber-700" : "text-gray-500"}`}>{summary.rushCount}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-amber-500">Rush</p>
        </div>
        <div className={`rounded-[3px] border px-3 py-2 text-center ${summary.missingArtwork > 0 ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-gray-50"}`}>
          <p className={`text-lg font-bold ${summary.missingArtwork > 0 ? "text-amber-700" : "text-gray-500"}`}>{summary.missingArtwork}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-amber-500">No Artwork</p>
        </div>
        <div className="rounded-[3px] border border-gray-200 bg-gray-50 px-3 py-2 text-center">
          <p className="text-lg font-bold text-gray-500">{summary.unscheduledCount}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Unscheduled</p>
        </div>
      </div>

      {/* Daily load chart */}
      {dailyLoad.length > 0 && (
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-[#999] uppercase tracking-wide mb-3">Daily Workload (14 days)</p>
          <div className="flex items-end gap-1" style={{ height: 80 }}>
            {dailyLoad.map((day) => {
              const pct = maxDayCount > 0 ? (day.count / maxDayCount) * 100 : 0;
              const isToday = day.date === new Date().toISOString().split("T")[0];
              const isWeekend = [0, 6].includes(new Date(day.date + "T00:00:00").getDay());
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5" title={`${day.date}: ${day.count} jobs (${day.rush} rush)`}>
                  <span className="text-[9px] text-[#999]">{day.count > 0 ? day.count : ""}</span>
                  <div
                    className={`w-full rounded-t-[2px] transition-all ${
                      day.rush > 0
                        ? "bg-amber-400"
                        : isToday
                          ? "bg-black"
                          : isWeekend
                            ? "bg-gray-200"
                            : "bg-gray-400"
                    }`}
                    style={{ height: `${Math.max(pct, day.count > 0 ? 8 : 2)}%` }}
                  />
                  <span className={`text-[9px] ${isToday ? "font-bold text-black" : "text-[#999]"}`}>
                    {dayName(day.date)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Overdue section */}
      {overdue.length > 0 && (
        <div className="rounded-[3px] border border-red-200 bg-red-50 shadow-sm">
          <div className="border-b border-red-200 px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
              Overdue ({overdue.length})
            </p>
          </div>
          <div className="divide-y divide-red-100">
            {overdue.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}

      {/* Today section */}
      <div className="rounded-[3px] border border-[#e0e0e0] bg-white shadow-sm">
        <div className="border-b border-[#e0e0e0] px-4 py-2.5 bg-[#fafafa]">
          <p className="text-xs font-semibold uppercase tracking-wide text-black">
            Today ({today.length})
          </p>
        </div>
        {today.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-[#999]">No jobs due today</p>
        ) : (
          <div className="divide-y divide-[#e0e0e0]">
            {today.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming days */}
      {Object.entries(scheduled).map(([date, dayJobs]) => (
        <div key={date} className="rounded-[3px] border border-[#e0e0e0] bg-white shadow-sm">
          <div className="border-b border-[#e0e0e0] px-4 py-2.5 bg-[#fafafa] flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-black">
              {dayName(date)} {formatDate(date)}
            </p>
            <span className="text-[10px] text-[#999]">{dayJobs.length} job{dayJobs.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="divide-y divide-[#e0e0e0]">
            {dayJobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </div>
        </div>
      ))}

      {/* Unscheduled */}
      {unscheduled.length > 0 && (
        <div className="rounded-[3px] border border-[#e0e0e0] bg-white shadow-sm">
          <div className="border-b border-[#e0e0e0] px-4 py-2.5 bg-amber-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Unscheduled ({unscheduled.length})
            </p>
          </div>
          <div className="divide-y divide-[#e0e0e0]">
            {unscheduled.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function JobRow({ job }) {
  return (
    <Link
      href={`/admin/production/${job.id}`}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#fafafa] transition-colors"
    >
      {/* Priority dot */}
      <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[job.priority] || PRIORITY_DOT.normal}`} />

      {/* Artwork thumbnail */}
      {job.artworkUrl ? (
        <img
          src={job.artworkUrl}
          alt=""
          className="h-8 w-8 shrink-0 rounded-[2px] border border-gray-200 object-cover"
        />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border border-amber-200 bg-amber-50">
          <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
      )}

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-black">{job.productName}</p>
          {job.isRush && (
            <span className="shrink-0 rounded-[2px] bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">RUSH</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-[#999]">
          {job.quantity > 0 && <span>Qty {job.quantity}</span>}
          {job.size && <span>{job.size}</span>}
          {job.material && <span>{job.material}</span>}
          {job.customerName && <span>{job.customerName}</span>}
          {job.assignedTo && <span>@ {job.assignedTo}</span>}
        </div>
      </div>

      {/* Status badge */}
      <span className={`shrink-0 rounded-[2px] px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[job.status] || "bg-gray-100 text-gray-600"}`}>
        {job.status.replace(/_/g, " ")}
      </span>
    </Link>
  );
}
