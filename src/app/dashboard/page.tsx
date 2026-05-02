"use client";

import { useState, useEffect, useCallback } from "react";
import { useProject } from "@/context/ProjectContext";
import { useApi } from "@/hooks/useApi";
import {
  Link2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  FileCode2,
  TrendingUp,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { formatNumber, formatDate } from "@/lib/utils";

interface Stats {
  total: number;
  pending: number;
  submitted: number;
  indexed: number;
  failed: number;
  sitemaps: number;
}

interface TrendItem {
  date: string;
  total: number;
  submitted: number;
  indexed: number;
  failed: number;
}

interface LogItem {
  id: string;
  status: string;
  message: string;
  createdAt: string;
  sitemap?: { filename: string } | null;
}

export default function DashboardPage() {
  const { project } = useProject();
  const { fetchApi } = useApi();
  const [stats, setStats] = useState<Stats | null>(null);
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const [recentLogs, setRecentLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchApi(`/api/stats?projectId=${project.id}`);
      setStats(data.stats);
      setTrend(data.trend);
      setRecentLogs(data.recentLogs);
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchApi, project.id]);

  useEffect(() => {
    setLoading(true);
    loadStats();
  }, [project.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 shimmer rounded-lg" />
            <div className="h-4 w-64 shimmer rounded-lg mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-6 h-32 shimmer" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card h-80 shimmer" />
          <div className="glass-card h-80 shimmer" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total URLs",
      value: stats?.total || 0,
      icon: Link2,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Pending",
      value: stats?.pending || 0,
      icon: Clock,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Submitted",
      value: stats?.submitted || 0,
      icon: Send,
      color: "from-accent to-purple-500",
      bgColor: "bg-accent/10",
    },
    {
      label: "Indexed",
      value: stats?.indexed || 0,
      icon: CheckCircle2,
      color: "from-emerald-500 to-green-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Failed",
      value: stats?.failed || 0,
      icon: AlertTriangle,
      color: "from-red-500 to-rose-500",
      bgColor: "bg-red-500/10",
    },
  ];

  const indexingRate =
    stats && stats.total > 0
      ? ((stats.indexed / stats.total) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-text-secondary mt-1">
            Overview of your indexing pipeline for{" "}
            <span className="text-accent-light font-medium">{project.name}</span>
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="glass-card p-5 slide-up"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}
              >
                <card.icon className="w-5 h-5 text-white" />
              </div>
              {card.label === "Indexed" && (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {indexingRate}%
                </span>
              )}
            </div>
            <div className="text-2xl font-bold">{formatNumber(card.value)}</div>
            <div className="text-text-muted text-xs mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickAction
          icon={Zap}
          label="Generate Sitemaps"
          desc="Create XML sitemaps from pending URLs"
          projectId={project.id}
          endpoint="/api/sitemaps"
          fetchApi={fetchApi}
          onComplete={loadStats}
        />
        <QuickAction
          icon={Send}
          label="Submit to Google"
          desc="Submit sitemaps to Search Console"
          projectId={project.id}
          endpoint="/api/submit"
          fetchApi={fetchApi}
          onComplete={loadStats}
        />
        <QuickAction
          icon={RefreshCw}
          label="Run Cron Job"
          desc="Regenerate, resubmit, and check status"
          projectId={project.id}
          endpoint="/api/cron"
          fetchApi={fetchApi}
          onComplete={loadStats}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission Trend */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-1">URL Submission Trend</h3>
          <p className="text-text-muted text-sm mb-6">Last 30 days</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(v) => v.split("-").slice(1).join("/")}
                />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#16161f",
                    border: "1px solid #2a2a3a",
                    borderRadius: "10px",
                    color: "#f1f5f9",
                    fontSize: "13px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#gradTotal)"
                  name="URLs Added"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Indexing Rate */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-1">Indexing Progress</h3>
          <p className="text-text-muted text-sm mb-6">Status breakdown by day</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(v) => v.split("-").slice(1).join("/")}
                />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#16161f",
                    border: "1px solid #2a2a3a",
                    borderRadius: "10px",
                    color: "#f1f5f9",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="submitted" stackId="a" fill="#6366f1" name="Submitted" radius={[0, 0, 0, 0]} />
                <Bar dataKey="indexed" stackId="a" fill="#10b981" name="Indexed" radius={[0, 0, 0, 0]} />
                <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Failed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-1">Recent Submission Logs</h3>
        <p className="text-text-muted text-sm mb-6">Latest activity from your project</p>
        {recentLogs.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <ScrollIcon className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>No submission logs yet. Upload URLs and generate sitemaps to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-bg-secondary/50 border border-border-primary/50"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    log.status === "success" ? "bg-emerald-400" : "bg-red-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary truncate">{log.message}</div>
                  <div className="text-xs text-text-muted mt-1 flex items-center gap-3">
                    <span>{formatDate(log.createdAt)}</span>
                    {log.sitemap && (
                      <span className="flex items-center gap-1">
                        <FileCode2 className="w-3 h-3" />
                        {log.sitemap.filename}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`status-badge text-xs ${
                    log.status === "success"
                      ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                      : "text-red-400 bg-red-400/10 border-red-400/20"
                  }`}
                >
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper placeholder icon
function ScrollIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h12a2 2 0 002-2v-2H10v2a2 2 0 01-2 2z" />
      <path d="M6 13V3a2 2 0 012-2h8l4 4v6" />
      <path d="M14 1v4a1 1 0 001 1h4" />
    </svg>
  );
}

// Quick Action component
function QuickAction({
  icon: Icon,
  label,
  desc,
  projectId,
  endpoint,
  fetchApi,
  onComplete,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  projectId: string;
  endpoint: string;
  fetchApi: (url: string, opts?: any) => Promise<any>;
  onComplete: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const execute = async () => {
    setLoading(true);
    setResult(null);
    try {
      const data = await fetchApi(endpoint, {
        method: "POST",
        body: { projectId },
      });
      setResult(data.message || "Success!");
      onComplete();
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
      setTimeout(() => setResult(null), 5000);
    }
  };

  return (
    <button
      onClick={execute}
      disabled={loading}
      className="glass-card p-5 text-left hover:border-accent/30 transition-all group"
    >
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5 text-accent-light" />
        <span className="text-sm font-semibold">{label}</span>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-accent ml-auto" />
        ) : (
          <ArrowUpRight className="w-4 h-4 text-text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
      <p className="text-text-muted text-xs">{desc}</p>
      {result && (
        <p className="text-xs mt-2 text-accent-light truncate">{result}</p>
      )}
    </button>
  );
}
