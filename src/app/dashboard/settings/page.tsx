"use client";

import { useState } from "react";
import { useProject } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import { Settings, Save, Key, Globe, User, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const { project, refreshProjects } = useProject();
  const { user } = useAuth();
  const { fetchApi } = useApi();

  const [googleCreds, setGoogleCreds] = useState(project.googleCredentials || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSaveCredentials = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // For now, store directly - in production use encrypted storage
      await fetchApi(`/api/projects`, {
        method: "POST",
        body: { name: project.name, domain: project.domain, googleCredentials: googleCreds },
      });
      setMessage({ type: "success", text: "Credentials saved successfully" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-text-secondary mt-1">Manage project configuration and API credentials</p>
      </div>

      {/* User Info */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-accent-light" />
          <h2 className="text-lg font-semibold">Account</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Name</label>
            <div className="input-field bg-bg-primary cursor-default">{user?.name}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Email</label>
            <div className="input-field bg-bg-primary cursor-default">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-5 h-5 text-accent-light" />
          <h2 className="text-lg font-semibold">Project</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Project Name</label>
            <div className="input-field bg-bg-primary cursor-default">{project.name}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Domain</label>
            <div className="input-field bg-bg-primary cursor-default">{project.domain}</div>
          </div>
        </div>
      </div>

      {/* Google API */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <Key className="w-5 h-5 text-accent-light" />
          <h2 className="text-lg font-semibold">Google Search Console API</h2>
        </div>
        <p className="text-text-muted text-sm mb-6">
          Paste your Google OAuth credentials JSON to enable direct sitemap submission.
          Without credentials, the system runs in simulated mode.
        </p>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
            {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        <textarea
          value={googleCreds}
          onChange={(e) => setGoogleCreds(e.target.value)}
          rows={6}
          className="input-field resize-none font-mono text-xs mb-4"
          placeholder='{"client_id": "...", "client_secret": "...", "access_token": "...", "refresh_token": "..."}'
        />

        <button onClick={handleSaveCredentials} disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Credentials
        </button>
      </div>

      {/* API Info */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-5 h-5 text-accent-light" />
          <h2 className="text-lg font-semibold">API Access</h2>
        </div>
        <p className="text-text-muted text-sm mb-4">Use these endpoints for external integrations.</p>
        <div className="space-y-3">
          {[
            { method: "POST", path: "/api/urls", desc: "Add URLs (JSON or CSV)" },
            { method: "POST", path: "/api/sitemaps", desc: "Generate sitemaps" },
            { method: "POST", path: "/api/submit", desc: "Submit to Google" },
            { method: "POST", path: "/api/cron", desc: "Trigger full pipeline" },
            { method: "GET", path: "/api/stats?projectId=ID", desc: "Get statistics" },
          ].map((ep) => (
            <div key={ep.path} className="flex items-center gap-3 p-3 rounded-lg bg-bg-secondary/50 border border-border-primary/50">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${ep.method === "GET" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"}`}>
                {ep.method}
              </span>
              <code className="text-sm text-text-primary font-mono flex-1">{ep.path}</code>
              <span className="text-xs text-text-muted hidden sm:block">{ep.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
