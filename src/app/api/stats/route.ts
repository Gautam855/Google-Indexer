import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: payload.userId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get status counts
    const statusCounts = await Promise.all([
      prisma.url.count({ where: { projectId } }),
      prisma.url.count({ where: { projectId, status: "pending" } }),
      prisma.url.count({ where: { projectId, status: "submitted" } }),
      prisma.url.count({ where: { projectId, status: "indexed" } }),
      prisma.url.count({ where: { projectId, status: "failed" } }),
    ]);

    // Get recent submission logs
    const recentLogs = await prisma.submissionLog.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { sitemap: { select: { filename: true } } },
    });

    // Get daily submission trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyUrls = await prisma.url.findMany({
      where: {
        projectId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    // Aggregate by date
    const trendMap = new Map<string, { submitted: number; indexed: number; failed: number; total: number }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      trendMap.set(key, { submitted: 0, indexed: 0, failed: 0, total: 0 });
    }

    dailyUrls.forEach((u) => {
      const key = new Date(u.createdAt).toISOString().split("T")[0];
      const entry = trendMap.get(key);
      if (entry) {
        entry.total++;
        if (u.status === "submitted") entry.submitted++;
        if (u.status === "indexed") entry.indexed++;
        if (u.status === "failed") entry.failed++;
      }
    });

    const trend = Array.from(trendMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get sitemap count
    const sitemapCount = await prisma.sitemap.count({ where: { projectId } });

    return NextResponse.json({
      stats: {
        total: statusCounts[0],
        pending: statusCounts[1],
        submitted: statusCounts[2],
        indexed: statusCounts[3],
        failed: statusCounts[4],
        sitemaps: sitemapCount,
      },
      recentLogs,
      trend,
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
