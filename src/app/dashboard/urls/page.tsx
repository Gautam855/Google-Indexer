"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useProject } from "@/context/ProjectContext";
import { useApi } from "@/hooks/useApi";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Upload,
  Plus,
  Search,
  Filter,
  Trash2,
  Loader2,
  ExternalLink,
  FileUp,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Link2,
} from "lucide-react";
import { formatDate, getStatusColor } from "@/lib/utils";

interface UrlItem {
  id: string;
  url: string;
  status: string;
  attempts: number;
  lastSubmittedAt: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function UrlsPage() {
  const { project } = useProject();
  const { fetchApi } = useApi();

  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadUrls = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          projectId: project.id,
          page: page.toString(),
          limit: "50",
        });
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (searchQuery) params.set("search", searchQuery);

        const data = await fetchApi(`/api/urls?${params}`);
        setUrls(data.urls);
        setPagination(data.pagination);
      } catch (err) {
        console.error("Failed to load URLs:", err);
      } finally {
        setLoading(false);
      }
    },
    [fetchApi, project.id, statusFilter, searchQuery]
  );

  useEffect(() => {
    loadUrls(1);
  }, [project.id, statusFilter]);

  const handleSearch = () => {
    loadUrls(1);
  };

  const handleBulkUpload = async () => {
    if (!bulkText.trim()) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const data = await fetchApi("/api/urls", {
        method: "POST",
        body: { projectId: project.id, bulkText },
      });
      setUploadResult(data.message);
      setBulkText("");
      loadUrls(1);
      setTimeout(() => {
        setShowUpload(false);
        setUploadResult(null);
      }, 3000);
    } catch (err) {
      setUploadResult(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", project.id);

      const data = await fetchApi("/api/urls", {
        method: "POST",
        body: formData,
      });
      setUploadResult(data.message);
      loadUrls(1);
    } catch (err) {
      setUploadResult(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (urlId: string) => {
    setDeleting(urlId);
    try {
      await fetchApi(`/api/urls?id=${urlId}&projectId=${project.id}`, {
        method: "DELETE",
      });
      loadUrls(pagination.page);
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setDeleting(null);
    }
  };

  const handleExport = () => {
    const csv = [
      "URL,Status,Attempts,Last Submitted,Created",
      ...urls.map(
        (u: UrlItem) =>
          `"${u.url}","${u.status}",${u.attempts},"${u.lastSubmittedAt || ""}","${u.createdAt}"`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `urls-${project.name}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo<ColumnDef<UrlItem, any>[]>(
    () => [
      {
        accessorKey: "url",
        header: "URL",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 max-w-md">
            <a
              href={row.original.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-primary hover:text-accent-light transition-colors truncate"
              title={row.original.url}
            >
              {row.original.url}
            </a>
            <ExternalLink className="w-3 h-3 text-text-muted flex-shrink-0" />
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className={`status-badge ${getStatusColor(row.original.status)}`}>
            {row.original.status === "indexed" && <CheckCircle2 className="w-3 h-3" />}
            {row.original.status === "failed" && <AlertCircle className="w-3 h-3" />}
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: "attempts",
        header: "Attempts",
        cell: ({ row }) => (
          <span className="text-sm text-text-secondary">{row.original.attempts}</span>
        ),
      },
      {
        accessorKey: "lastSubmittedAt",
        header: "Last Submitted",
        cell: ({ row }) => (
          <span className="text-sm text-text-secondary">
            {formatDate(row.original.lastSubmittedAt)}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-sm text-text-secondary">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <button
            onClick={() => handleDelete(row.original.id)}
            disabled={deleting === row.original.id}
            className="p-2 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
          >
            {deleting === row.original.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        ),
      },
    ],
    [deleting]
  );

  const table = useReactTable({
    data: urls,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">URL Management</h1>
          <p className="text-text-secondary mt-1">
            {pagination.total} total URLs in this project
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="btn-secondary text-sm">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button onClick={() => setShowUpload(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" />
            Add URLs
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search URLs..."
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          {["all", "pending", "submitted", "indexed", "failed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                statusFilter === s
                  ? "bg-accent/20 text-accent-light border border-accent/30"
                  : "bg-bg-hover text-text-secondary hover:text-text-primary border border-transparent"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-border-primary">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border-primary/50">
                    {columns.map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 shimmer rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : urls.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-16 text-center">
                    <div className="text-text-muted">
                      <Link2 className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      <p>No URLs found. Upload some to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border-primary/50 hover:bg-bg-hover/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border-primary">
            <span className="text-sm text-text-muted">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadUrls(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg hover:bg-bg-hover text-text-secondary disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => loadUrls(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-lg hover:bg-bg-hover text-text-secondary disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Add URLs</h3>
              <button
                onClick={() => {
                  setShowUpload(false);
                  setUploadResult(null);
                }}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadResult && (
              <div className="mb-6 p-4 rounded-lg bg-accent/10 border border-accent/20 text-accent-light text-sm">
                {uploadResult}
              </div>
            )}

            {/* CSV Upload */}
            <div className="mb-6">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border-primary rounded-xl cursor-pointer hover:border-accent/50 transition-colors">
                <FileUp className="w-8 h-8 text-text-muted mb-2" />
                <span className="text-sm text-text-secondary">
                  Click to upload CSV file
                </span>
                <span className="text-xs text-text-muted mt-1">
                  One URL per line or comma-separated
                </span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-border-primary" />
              <span className="text-xs text-text-muted uppercase">or paste URLs</span>
              <div className="flex-1 h-px bg-border-primary" />
            </div>

            {/* Bulk text */}
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={8}
              className="input-field resize-none font-mono text-sm"
              placeholder={"https://example.com/page-1\nhttps://example.com/page-2\nhttps://example.com/page-3"}
            />

            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-text-muted">
                {bulkText.split("\n").filter((l) => l.trim()).length} URLs detected
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUpload(false);
                    setUploadResult(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={uploading || !bulkText.trim()}
                  className="btn-primary"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Upload URLs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
