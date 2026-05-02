"use client";

import { createContext, useContext } from "react";

export interface Project {
  id: string;
  name: string;
  domain: string;
  googleCredentials?: string;
  _count?: { urls: number; sitemaps: number };
}

interface ProjectContextType {
  project: Project;
  refreshProjects: () => Promise<void>;
}

export const ProjectContext = createContext<ProjectContextType | null>(null);

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within DashboardLayout");
  return ctx;
}
