import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  getOccupancyTrend,
  getRequestVolume,
  getRoomStatusBreakdown,
  getTurnaroundByHousekeeper,
} from "@/lib/analytics.functions";
import { formatDuration } from "@/lib/ops";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_COLORS: Record<string, string> = {
  vacant_clean: "#0F7B4F",
  clean: "#0F7B4F",
  vacant_dirty: "#B45309",
  dirty: "#B45309",
  occupied: "#004986",
  occupied_dnd: "#7C3AED",
  reserved: "#0E7490",
  out_of_order: "#64748B",
};

const REQUEST_COLORS = ["#004986", "#D4AF37", "#0F7B4F", "#B45309", "#7C3AED", "#0E7490"];

export function AnalyticsDashboard() {
  const fetchOccupancy = useServerFn(getOccupancyTrend);
  const fetchStatus = useServerFn(getRoomStatusBreakdown);
  const fetchTurnaround = useServerFn(getTurnaroundByHousekeeper);
  const fetchRequests = useServerFn(getRequestVolume);

  const [days, setDays] = useState(14);
  const [occupancy, setOccupancy] = useState<{ date: string; occupancy: number }[]>([]);
  const [status, setStatus] = useState<{ status: string; count: number }[]>([]);
  const [turnaround, setTurnaround] = useState<
    { name: string; avgSeconds: number; count: number }[]
  >([]);
  const [requests, setRequests] = useState<
    { type: string; count: number; resolved: number; avgResponseSeconds: number | null }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const [occ, stat, turn, req] = await Promise.all([
        fetchOccupancy({ data: { days } }),
        fetchStatus({ data: {} }),
        fetchTurnaround({ data: { days } }),
        fetchRequests({ data: { days } }),
      ]);
      if (!active) return;
      setOccupancy(occ);
      setStatus(stat);
      setTurnaround(turn);
      setRequests(req);
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, [days, fetchOccupancy, fetchStatus, fetchTurnaround, fetchRequests]);

  const statusData = useMemo(
    () =>
      status.map((s) => ({
        ...s,
        label: s.status.replace(/_/g, " "),
        fill: STATUS_COLORS[s.status] ?? "#94a3b8",
      })),
    [status],
  );

  const requestData = useMemo(
    () =>
      requests.map((r, i) => ({
        ...r,
        fill: REQUEST_COLORS[i % REQUEST_COLORS.length],
      })),
    [requests],
  );

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-xs font-semibold text-slate-400">
        Loading analytics…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Date Range Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            Operations Insights
          </p>
          <h2 className="mt-1 font-serif text-2xl font-bold text-[#004986]">
            Performance Reporting
          </h2>
        </div>

        <div className="flex gap-2">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                days === d
                  ? "bg-[#004986] text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Last {d} days
            </button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full space-y-4">
        <TabsList className="rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
          <TabsTrigger
            value="overview"
            className="rounded-lg px-4 text-xs font-bold data-[state=active]:bg-[#004986] data-[state=active]:text-white"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="housekeeping"
            className="rounded-lg px-4 text-xs font-bold data-[state=active]:bg-[#004986] data-[state=active]:text-white"
          >
            Housekeeping
          </TabsTrigger>
          <TabsTrigger
            value="requests"
            className="rounded-lg px-4 text-xs font-bold data-[state=active]:bg-[#004986] data-[state=active]:text-white"
          >
            Requests
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="rounded-2xl border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-base font-bold text-[#004986]">
                Occupancy Trend (%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={occupancy}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#64748B", fontSize: 11 }}
                      angle={-30}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: "#64748B", fontSize: 11 }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      formatter={(v: any) => [`${v}%`, "Occupancy"]}
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderColor: "#CBD5E1",
                        borderRadius: 12,
                        color: "#0F172A",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="occupancy"
                      stroke="#004986"
                      strokeWidth={3}
                      dot={{ fill: "#D4AF37", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-base font-bold text-[#004986]">
                Current Room Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) =>
                        percent ? `${name}: ${(percent * 100).toFixed(0)}%` : name
                      }
                      labelLine
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderColor: "#CBD5E1",
                        borderRadius: 12,
                        color: "#0F172A",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HOUSEKEEPING TAB */}
        <TabsContent value="housekeeping" className="space-y-4">
          <Card className="rounded-2xl border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-base font-bold text-[#004986]">
                Average Room Turnover Time (Minutes)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={turnaround.map((t) => ({
                      ...t,
                      minutes: Math.round(t.avgSeconds / 60),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 11 }} />
                    <YAxis
                      tick={{ fill: "#64748B", fontSize: 11 }}
                      label={{
                        value: "Minutes",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#64748B",
                        fontSize: 11,
                      }}
                    />
                    <Tooltip
                      formatter={(v: any, _name: any, item: any) => [
                        `${v} min (${item.payload.count} turns)`,
                        "Avg Turnover",
                      ]}
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderColor: "#CBD5E1",
                        borderRadius: 12,
                        color: "#0F172A",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    />
                    <Bar dataKey="minutes" fill="#004986" radius={[6, 6, 0, 0]}>
                      {turnaround.map((_, index) => (
                        <Cell key={`bar-${index}`} fill={index % 2 === 0 ? "#004986" : "#D4AF37"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REQUESTS TAB */}
        <TabsContent value="requests" className="space-y-4">
          <Card className="rounded-2xl border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-base font-bold text-[#004986]">
                Guest Request Volume &amp; Resolution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={requestData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="type" tick={{ fill: "#64748B", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#64748B", fontSize: 11 }} />
                    <Tooltip
                      formatter={(v: any, name: any, item: any) => [
                        name === "resolved"
                          ? `${v} resolved (${item.payload.avgResponseSeconds ? formatDuration(item.payload.avgResponseSeconds) : "n/a"} avg)`
                          : `${v} requests`,
                        name === "resolved" ? "Resolved" : "Total",
                      ]}
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderColor: "#CBD5E1",
                        borderRadius: 12,
                        color: "#0F172A",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#004986" name="Total Requests" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resolved" fill="#0F7B4F" name="Resolved" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
