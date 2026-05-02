"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import { ProjectContext, type Project } from "@/context/ProjectContext";
import {
  LayoutDashboard, Link2, FileCode2, Settings, LogOut, Zap,
  ChevronDown, Plus, Loader2, Menu, X, ScrollText,
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, logout } = useAuth();
  const { fetchApi } = useApi();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [projectDropdown, setProjectDropdown] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDomain, setNewProjectDomain] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadProjects();
  }, [user]);

  const loadProjects = async () => {
    try {
      const data = await fetchApi("/api/projects");
      setProjects(data.projects);
      if (data.projects.length > 0 && !activeProject) {
        const stored = localStorage.getItem("activeProjectId");
        const found = data.projects.find((p: Project) => p.id === stored);
        setActiveProject(found || data.projects[0]);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  const selectProject = (project: Project) => {
    setActiveProject(project);
    localStorage.setItem("activeProjectId", project.id);
    setProjectDropdown(false);
  };

  const createProject = async () => {
    if (!newProjectName || !newProjectDomain) return;
    setCreating(true);
    try {
      await fetchApi("/api/projects", { method: "POST", body: { name: newProjectName, domain: newProjectDomain } });
      setNewProjectName(""); setNewProjectDomain(""); setShowNewProject(false);
      await loadProjects();
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/urls", icon: Link2, label: "URLs" },
    { href: "/dashboard/sitemaps", icon: FileCode2, label: "Sitemaps" },
    { href: "/dashboard/logs", icon: ScrollText, label: "Logs" },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-bg-secondary border-r border-border-primary flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-primary">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
            <span className="text-lg font-bold">IndexForge</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
        </div>

        {/* Project selector */}
        <div className="px-4 py-4 border-b border-border-primary">
          <div className="relative">
            <button onClick={() => setProjectDropdown(!projectDropdown)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-bg-hover border border-border-primary hover:border-text-muted transition-colors text-sm">
              <div className="text-left truncate">
                <div className="font-medium truncate">{activeProject?.name || "Select Project"}</div>
                <div className="text-text-muted text-xs truncate">{activeProject?.domain || "No project"}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0 ml-2" />
            </button>
            {projectDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border-primary rounded-lg shadow-2xl overflow-hidden z-50">
                {projects.map((p) => (
                  <button key={p.id} onClick={() => selectProject(p)} className={`w-full text-left px-4 py-3 hover:bg-bg-hover transition-colors text-sm ${activeProject?.id === p.id ? "bg-accent/10 text-accent-light" : ""}`}>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-text-muted text-xs">{p.domain}</div>
                  </button>
                ))}
                <button onClick={() => { setShowNewProject(true); setProjectDropdown(false); }} className="w-full text-left px-4 py-3 hover:bg-bg-hover text-sm border-t border-border-primary text-accent-light flex items-center gap-2">
                  <Plus className="w-4 h-4" /> New Project
                </button>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button key={item.href} onClick={() => { router.push(item.href); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? "bg-accent/10 text-accent-light border border-accent/20" : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"}`}>
                <item.icon className="w-5 h-5" /> {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-border-primary">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-white text-sm font-bold">{user.name.charAt(0).toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-xs text-text-muted truncate">{user.email}</div>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen">
        <header className="sticky top-0 z-30 flex items-center gap-4 px-6 py-4 bg-bg-primary/80 backdrop-blur-xl border-b border-border-primary">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-text-secondary hover:text-text-primary"><Menu className="w-5 h-5" /></button>
          <div className="flex-1" />
          {activeProject && <div className="text-sm text-text-secondary"><span className="text-text-muted">Project:</span> <span className="font-medium text-text-primary">{activeProject.name}</span></div>}
        </header>
        <div className="p-6 lg:p-8">
          {activeProject ? (
            <ProjectContext.Provider value={{ project: activeProject, refreshProjects: loadProjects }}>
              {children}
            </ProjectContext.Provider>
          ) : (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="text-text-muted text-lg mb-4">No project selected</div>
              <button onClick={() => setShowNewProject(true)} className="btn-primary"><Plus className="w-4 h-4" /> Create a Project</button>
            </div>
          )}
        </div>
      </main>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card p-8 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-6">Create New Project</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-text-secondary mb-2">Project Name</label><input type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="input-field" placeholder="My SEO Campaign" /></div>
              <div><label className="block text-sm font-medium text-text-secondary mb-2">Domain</label><input type="text" value={newProjectDomain} onChange={(e) => setNewProjectDomain(e.target.value)} className="input-field" placeholder="https://example.com" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowNewProject(false)} className="btn-secondary">Cancel</button>
              <button onClick={createProject} disabled={creating || !newProjectName || !newProjectDomain} className="btn-primary">{creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
