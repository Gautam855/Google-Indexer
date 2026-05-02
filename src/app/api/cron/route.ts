import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { generateSitemapsForProject } from "@/lib/sitemap-generator";
import { submitAllSitemaps, checkIndexingStatus } from "@/lib/google-search-console";

export async function POST(req: NextRequest) {
  try {
    // Verify auth (can also be called via cron secret)
    const { searchParams } = new URL(req.url);
    const cronSecret = searchParams.get("secret");

    if (cronSecret !== process.env.JWT_SECRET) {
      const payload = getUserFromRequest(req);
      if (!payload) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json().catch(() => ({}));
    const { projectId } = body;

    let projects;
    if (projectId) {
      const p = await prisma.project.findUnique({ where: { id: projectId } });
      projects = p ? [p] : [];
    } else {
      // Run for all projects
      projects = await prisma.project.findMany();
    }

    const results = [];

    for (const project of projects) {
      try {
        // 1. Regenerate sitemaps
        const sitemapResult = await generateSitemapsForProject(project.id);

        // 2. Submit to Google
        const submitResult = await submitAllSitemaps(project.id);

        // 3. Check indexing status
        const indexResult = await checkIndexingStatus(project.id);

        // 4. Retry failed URLs (reset to pending)
        const retried = await prisma.url.updateMany({
          where: {
            projectId: project.id,
            status: "failed",
            attempts: { lt: 5 },
          },
          data: {
            status: "pending",
          },
        });

        results.push({
          projectId: project.id,
          projectName: project.name,
          sitemaps: sitemapResult,
          submissions: {
            total: submitResult.length,
            success: submitResult.filter((r) => r.success).length,
          },
          indexing: indexResult,
          retriedUrls: retried.count,
        });
      } catch (err) {
        results.push({
          projectId: project.id,
          projectName: project.name,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      message: "Cron job completed",
      processedProjects: results.length,
      results,
    });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
