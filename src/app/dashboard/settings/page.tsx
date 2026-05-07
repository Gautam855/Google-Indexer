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
  
  // New states for site management
  const [sites, setSites] = useState<any[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [metaTag, setMetaTag] = useState<string | null>(null);

  const fetchSites = async () => {
    if (!project.googleCredentials) return;
    setLoadingSites(true);
    try {
      const data = await fetchApi(`/api/google/sites?projectId=${project.id}`);
      if (data.sites) setSites(data.sites);
    } catch (err) {
      console.error("Failed to fetch sites", err);
    } finally {
      setLoadingSites(false);
    }
  };

  // Fetch sites when page loads if connected
  useState(() => {
    fetchSites();
  });

  const handleSaveCredentials = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await fetchApi(`/api/projects`, {
        method: "POST",
        body: { name: project.name, domain: project.domain, googleCredentials: googleCreds },
      });
      setMessage({ type: "success", text: "Credentials saved successfully" });
      refreshProjects();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Google account?")) return;
    setSaving(true);
    try {
      await fetchApi(`/api/google/sites`, {
        method: "DELETE",
        body: { projectId: project.id },
      });
      setMessage({ type: "success", text: "Google account disconnected successfully" });
      refreshProjects();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDomain = async (newDomain: string) => {
    setSaving(true);
    try {
      await fetchApi(`/api/google/sites`, {
        method: "PATCH",
        body: { projectId: project.id, domain: newDomain },
      });
      setMessage({ type: "success", text: "Project domain updated to: " + newDomain });
      refreshProjects();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
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
          <h2 className="text-lg font-semibold">Project Details</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Project Name</label>
            <div className="input-field bg-bg-primary cursor-default">{project.name}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Current Selected Property</label>
            <div className="input-field bg-bg-primary cursor-default font-mono text-xs truncate">{project.domain}</div>
          </div>
        </div>
      </div>

      {/* Google API */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-accent-light" />
            <h2 className="text-lg font-semibold">Google Search Console</h2>
          </div>
          {project.googleCredentials && (
            <button 
              onClick={handleDisconnect}
              disabled={saving}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Disconnect Account
            </button>
          )}
        </div>
        <p className="text-text-muted text-sm mb-6">
          Connect your Google account to manage Search Console properties and indexing.
        </p>

        {message && (
          <div className={`mb-6 p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
            {message.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            {message.text}
          </div>
        )}

        {project.googleCredentials ? (
          <div className="space-y-6">
            {/* 1. Property Selection Dropdown */}
            <div className="p-4 rounded-lg bg-bg-secondary/30 border border-border-primary/30">
              <label className="block text-sm font-medium mb-2">1. Select Verified Property</label>
              <div className="flex gap-2">
                <select 
                  className="input-field flex-1 text-sm bg-bg-primary"
                  value={project.domain}
                  onChange={(e) => handleUpdateDomain(e.target.value)}
                  disabled={loadingSites || saving}
                >
                  <option value="">-- Choose from Search Console --</option>
                  {sites.map((site) => (
                    <option key={site.siteUrl} value={site.siteUrl}>
                      {site.siteUrl}
                    </option>
                  ))}
                </select>
                <button 
                  onClick={fetchSites} 
                  disabled={loadingSites}
                  className="p-2 bg-bg-primary border border-border-primary rounded-lg hover:bg-bg-secondary transition-colors"
                  title="Refresh list"
                >
                  <Loader2 className={`w-4 h-4 ${loadingSites ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <p className="text-[10px] text-text-muted mt-2 italic">
                Don't see your site? Use the verification section below.
              </p>
            </div>

            {/* 2. Verification Section */}
            <div className="p-4 rounded-lg bg-bg-secondary/30 border border-border-primary/30">
              <h3 className="text-sm font-semibold mb-2">2. Verify New Domain</h3>
              <p className="text-xs text-text-muted mb-4">
                Verify <strong>{project.domain}</strong> if it's not already in your list.
              </p>
              
              <div className="space-y-4">
                {!metaTag ? (
                  <button 
                    onClick={async () => {
                      setMessage(null);
                      try {
                        const res = await fetchApi('/api/google/verify', {
                          method: 'POST',
                          body: { projectId: project.id, action: 'getToken' }
                        });
                        if (res.token) {
                          setMetaTag(res.token);
                        }
                      } catch (err: any) {
                        setMessage({ type: "error", text: err.message });
                      }
                    }}
                    className="btn-primary text-xs w-full sm:w-auto"
                  >
                    Get HTML Meta Tag
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-bg-primary border border-border-primary rounded-lg">
                      <p className="text-[11px] text-text-secondary mb-2 uppercase tracking-wider font-bold">Paste this in your &lt;head&gt;:</p>
                      <code className="block p-2 bg-black/40 text-accent-light rounded text-xs break-all border border-accent-light/20 select-all">
                        {metaTag}
                      </code>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={async () => {
                          setMessage(null);
                          setSaving(true);
                          try {
                            const res = await fetchApi('/api/google/verify', {
                              method: 'POST',
                              body: { projectId: project.id, action: 'verify' }
                            });
                            setMessage({ type: "success", text: res.message || "Domain verified successfully!" });
                            setMetaTag(null);
                            fetchSites();
                          } catch (err: any) {
                            setMessage({ type: "error", text: err.message });
                          } finally {
                            setSaving(false);
                          }
                        }}
                        className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-500"
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                        I've added the tag, Verify Now
                      </button>
                      <button onClick={() => setMetaTag(null)} className="text-xs text-text-muted hover:text-text-primary px-3">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <details className="mt-4 opacity-50 hover:opacity-100 transition-opacity">
              <summary className="text-xs text-text-muted cursor-pointer hover:text-text-primary mb-2">Advanced: Raw Credentials JSON</summary>
              <textarea
                value={googleCreds}
                onChange={(e) => setGoogleCreds(e.target.value)}
                rows={4}
                className="input-field resize-none font-mono text-[10px] bg-bg-primary"
                placeholder='{"client_id": "...", "client_secret": "...", "access_token": "...", "refresh_token": "..."}'
              />
              <button onClick={handleSaveCredentials} disabled={saving} className="btn-primary text-xs mt-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Update JSON
              </button>
            </details>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border-primary rounded-xl bg-bg-secondary/20">
            <button 
              onClick={() => window.location.href = `/api/auth/google?projectId=${project.id}`} 
              className="btn-primary bg-white text-black hover:bg-gray-100 flex items-center justify-center gap-2 px-8 py-3 shadow-lg hover:scale-105 transition-all"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Connect Google Account
            </button>
            <p className="text-xs text-text-muted mt-4">We only request access to Search Console and Indexing API.</p>
          </div>
        )}
      </div>

      {/* API Access Section stays same but maybe refined layout */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-accent-light" />
          <h2 className="text-lg font-semibold">API Integrations</h2>
        </div>
        <div className="space-y-2">
          {[
            { method: "POST", path: "/api/urls", desc: "Submit URLs" },
            { method: "POST", path: "/api/sitemaps", desc: "Generate Sitemaps" },
            { method: "POST", path: "/api/cron", desc: "Auto-Indexing" },
          ].map((ep) => (
            <div key={ep.path} className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary/50 border border-border-primary/50 group">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">{ep.method}</span>
                <code className="text-xs font-mono text-text-primary">{ep.path}</code>
              </div>
              <span className="text-xs text-text-muted group-hover:text-text-secondary">{ep.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
