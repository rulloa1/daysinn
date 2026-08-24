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
import { getOccupancyTrend, getRequestVolume, getRoomStatusBreakdown, getTurnaroundByHousekeeper } from "@/lib/analytics.functions";
import { formatDuration } from "@/lib/ops";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_COLORS: Record<string, string> = {
  vacant_clean: "#10b981",
  vacant_dirty: "#f59e0b",
  occupied: "#3b82f6",
  occupied_dnd: "#ef4444",
  reserved: "#8b5cf6",
  out_of_order: "#64748b",
};

const REQUEST_COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

export function AnalyticsDashboard() {
  const fetchOccupancy = useServerFn(getOccupancyTrend);
  const fetchStatus = useServerFn(getRoomStatusBreakdown);
  const fetchTurnaround = useServerFn(getTurnaroundByHousekeeper);
  const fetchRequests = useServerFn(getRequestVolume);

  const [days, setDays] = useState(14);
  const [occupancy, setOccupancy] = useState<{ date: string; occupancy: number }[]>([]);
  const [status, setStatus] = useState<{ status: string; count: number }[]>([]);
  const [turnaround, setTurnaround] = useState<{ name: string; avgSeconds: number; count: number }[]>([]);
  const [requests, setRequests] = useState<{ type: string; count: number; resolved: number; avgResponseSeconds: number | null }[]>([]);
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
      <div className="flex h-48 items-center justify-center text-sm text-cream/60">
        Loading analytics…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="signage text-cream/80">Operations analytics</h2>
        <div className="flex gap-2">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded px-3 py-1 text-xs ${
                days === d
                  ? "bg-amber text-ink"
                  : "border border-cream/20 bg-cream/5 text-cream/70 hover:bg-cream/10"
              }`}
            >
              Last {d} days
            </button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-cream/5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="housekeeping">Housekeeping</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="border-cream/10 bg-cream/[0.04]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-cream/80">Occupancy trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={occupancy}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} unit="%" domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                    <Line type="monotone" dataKey="occupancy" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-cream/10 bg-cream/[0.04]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-cream/80">Room status breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80} label>
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-cream/10 bg-cream/[0.04]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-cream/80">Key metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-cream/10 pb-2">
                  <span className="text-cream/60">Total rooms</span>
                  <span className="text-cream">{status.reduce((a, s) => a + s.count, 0)}</span>
                </div>
                <div className="flex justify-between border-b border-cream/10 pb-2">
                  <span className="text-cream/60">Occupied / DND</span>
                  <span className="text-cream">
                    {(status.find((s) => s.status === "occupied")?.count ?? 0) +
                      (status.find((s) => s.status === "occupied_dnd")?.count ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-cream/10 pb-2">
                  <span className="text-cream/60">Clean & vacant</span>
                  <span className="text-cream">{status.find((s) => s.status === "vacant_clean")?.count ?? 0}</span>
                </div>
                <div className="flex justify-between border-b border-cream/10 pb-2">
                  <span className="text-cream/60">Open requests</span>
                  <span className="text-cream">{requests.reduce((a, r) => a + r.count - r.resolved, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cream/60">Avg turnover</span>
                  <span className="text-cream">
                    {formatDuration(
                      turnaround.length > 0
                        ? Math.round(turnaround.reduce((a, t) => a + t.avgSeconds, 0) / turnaround.length)
                        : null,
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="housekeeping" className="space-y-4">
          <Card className="border-cream/10 bg-cream/[0.04]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-cream/80">Turnaround time by housekeeper</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={turnaround} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={(v) => formatDuration(v)} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} width={100} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }}
                      formatter={(value: number) => [formatDuration(value), "Average"]}
                    />
                    <Bar dataKey="avgSeconds" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card className="border-cream/10 bg-cream/[0.04]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-cream/80">Request volume by category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={requestData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="type" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                    <Legend />
                    <Bar dataKey="count" name="Total" fill="#3b82f6" />
                    <Bar dataKey="resolved" name="Resolved" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {requests.map((r) => (
              <Card key={r.type} className="border-cream/10 bg-cream/[0.04]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-cream/80">{r.type}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-cream/60">Total</span>
                    <span className="text-cream">{r.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/60">Resolved</span>
                    <span className="text-cream">{r.resolved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/60">Avg response</span>
                    <span className="text-cream">{formatDuration(r.avgResponseSeconds)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
