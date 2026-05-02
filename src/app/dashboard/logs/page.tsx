"use client";

import { useState, useEffect, useCallback } from "react";
import { useProject } from "@/context/ProjectContext";
import { useApi } from "@/hooks/useApi";
import { ScrollText, RefreshCw, Loader2, FileCode2, CheckCircle2, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface LogItem {
  id: string;
  status: string;
  message: string;
  createdAt: string;
  sitemap?: { filename: string } | null;
}

export default function LogsPage() {
  const { project } = useProject();
  const { fetchApi } = useApi();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchApi(`/api/logs?projectId=${project.id}`);
      setLogs(data.logs);
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchApi, project.id]);

  useEffect(() => { loadLogs(); }, [project.id]);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Submission Logs</h1>
          <p className="text-text-secondary mt-1">{logs.length} log entries</p>
        </div>
        <button onClick={loadLogs} disabled={loading} className="btn-secondary text-sm">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 shimmer rounded-lg" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center">
            <ScrollText className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Logs Yet</h3>
            <p className="text-text-muted">Submit sitemaps to Google to see activity here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-primary/50">
            {logs.map((log, i) => (
              <div key={log.id} className="flex items-start gap-4 p-5 hover:bg-bg-hover/30 transition-colors slide-up" style={{ animationDelay: `${i * 0.02}s` }}>
                <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${log.status === "success" ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                  {log.status === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{log.message}</p>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-text-muted">
                    <span>{formatDate(log.createdAt)}</span>
                    {log.sitemap && (
                      <span className="flex items-center gap-1">
                        <FileCode2 className="w-3 h-3" /> {log.sitemap.filename}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`status-badge text-xs ${log.status === "success" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-red-400 bg-red-400/10 border-red-400/20"}`}>
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
