"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

interface FetchOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export function useApi() {
  const { token } = useAuth();

  const fetchApi = useCallback(
    async (url: string, options: FetchOptions = {}) => {
      const headers: Record<string, string> = {
        ...options.headers,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      if (options.body && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }

      const res = await fetch(url, {
        method: options.method || "GET",
        headers,
        body: options.body
          ? options.body instanceof FormData
            ? options.body
            : JSON.stringify(options.body)
          : undefined,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      return res.json();
    },
    [token]
  );

  return { fetchApi };
}

export function useProjects() {
  const { fetchApi } = useApi();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState<any>(null);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchApi("/api/projects");
      setProjects(data.projects);
      if (data.projects.length > 0 && !activeProject) {
        setActiveProject(data.projects[0]);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchApi, activeProject]);

  useEffect(() => {
    loadProjects();
  }, []);

  return { projects, loading, activeProject, setActiveProject, loadProjects };
}

export function useStats(projectId: string | undefined) {
  const { fetchApi } = useApi();
  const [stats, setStats] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const data = await fetchApi(`/api/stats?projectId=${projectId}`);
      setStats(data.stats);
      setTrend(data.trend);
      setRecentLogs(data.recentLogs);
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchApi, projectId]);

  useEffect(() => {
    loadStats();
  }, [projectId]);

  return { stats, trend, recentLogs, loading, refresh: loadStats };
}
