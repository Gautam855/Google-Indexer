"use client";

import { useState, useEffect, useCallback } from "react";
import { useProject } from "@/context/ProjectContext";
import { useApi } from "@/hooks/useApi";
import { FileCode2, Loader2, ExternalLink, Zap, Send } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/utils";

interface SitemapItem {
  id: string;
  filename: string;
  urlCount: number;
  filePath: string;
  createdAt: string;
}

export default function SitemapsPage() {
  const { project } = useProject();
  const { fetchApi } = useApi();
  const [sitemaps, setSitemaps] = useState<SitemapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadSitemaps = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchApi(`/api/sitemaps?projectId=${project.id}`);
      setSitemaps(data.sitemaps);
    } catch (err) {
      console.error("Failed to load sitemaps:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchApi, project.id]);

  useEffect(() => { loadSitemaps(); }, [project.id]);

  const handleGenerate = async () => {
    setGenerating(true);
    setMessage(null);
    try {
      const data = await fetchApi("/api/sitemaps", { method: "POST", body: { projectId: project.id } });
      setMessage(data.message);
      loadSitemaps();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const data = await fetchApi("/api/submit", { method: "POST", body: { projectId: project.id } });
      setMessage(data.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const totalUrls = sitemaps.reduce((sum, s) => sum + s.urlCount, 0);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Sitemaps</h1>
          <p className="text-text-secondary mt-1">{sitemaps.length} sitemaps &bull; {formatNumber(totalUrls)} URLs</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleGenerate} disabled={generating} className="btn-primary text-sm">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Generate
          </button>
          <button onClick={handleSubmit} disabled={submitting || sitemaps.length === 0} className="btn-secondary text-sm">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit to Google
          </button>
        </div>
      </div>

      {message && <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 text-accent-light text-sm">{message}</div>}

      {sitemaps.length > 0 && (
        <div className="glass-card p-6 pulse-glow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center">
                <FileCode2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">sitemap_index.xml</h3>
                <p className="text-text-muted text-sm">Master index &bull; {sitemaps.length} sitemaps</p>
              </div>
            </div>
            <a href={`/sitemaps/${project.id}/sitemap_index.xml`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
              <ExternalLink className="w-4 h-4" /> View
            </a>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="glass-card p-6 h-40 shimmer" />)}
        </div>
      ) : sitemaps.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <FileCode2 className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Sitemaps Yet</h3>
          <p className="text-text-muted mb-6">Upload URLs and generate sitemaps to start.</p>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary">
            <Zap className="w-4 h-4" /> Generate Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sitemaps.map((s, i) => (
            <div key={s.id} className="glass-card p-6 slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FileCode2 className="w-5 h-5 text-accent-light" />
                </div>
                <a href={s.filePath} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-accent-light">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <h4 className="font-semibold text-sm mb-1">{s.filename}</h4>
              <p className="text-text-muted text-xs mb-3">{formatNumber(s.urlCount)} URLs</p>
              <div className="text-xs text-text-muted">{formatDate(s.createdAt)}</div>
              <div className="mt-3 h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-full" style={{ width: `${(s.urlCount / 250) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
