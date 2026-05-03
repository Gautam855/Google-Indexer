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
          Connect your Google account to automatically enable Search Console & Indexing API.
          No need to manually go to Google Cloud or Search Console!
        </p>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
            {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        {project.googleCredentials ? (
          <div className="flex flex-col gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Successfully connected to Google
            </div>
            
            <details className="mt-2">
              <summary className="text-xs text-text-muted cursor-pointer hover:text-text-primary">View/Edit Raw Credentials JSON</summary>
              <textarea
                value={googleCreds}
                onChange={(e) => setGoogleCreds(e.target.value)}
                rows={6}
                className="input-field resize-none font-mono text-xs mt-2 mb-4"
                placeholder='{"client_id": "...", "client_secret": "...", "access_token": "...", "refresh_token": "..."}'
              />
              <button onClick={handleSaveCredentials} disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Raw Credentials
              </button>
            </details>
          </div>
        ) : (
          <button 
            onClick={() => window.location.href = `/api/auth/google?projectId=${project.id}`} 
            className="btn-primary bg-white text-black hover:bg-gray-100 flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Connect Google Account
          </button>
        )}
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
