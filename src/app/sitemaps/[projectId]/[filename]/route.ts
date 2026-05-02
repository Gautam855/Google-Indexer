import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { chunkArray } from "@/lib/utils";

const CHUNK_SIZE = 250; // URLs per sitemap

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; filename: string }> }
) {
  try {
    const { projectId, filename } = await params;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // If it's the index file
    if (filename === "sitemap_index.xml") {
      const sitemaps = await prisma.sitemap.findMany({
        where: { projectId },
        orderBy: { filename: "asc" },
      });

      if (sitemaps.length === 0) {
        return new NextResponse("Not Found", { status: 404 });
      }

      const entries = sitemaps
        .map(
          (sm) => `  <sitemap>
    <loc>${baseUrl}/sitemaps/${projectId}/${sm.filename}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
  </sitemap>`
        )
        .join("\n");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;

      return new NextResponse(xml, {
        headers: {
          "Content-Type": "application/xml",
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    }

    // If it's a specific sitemap chunk, like sitemap-1.xml
    const match = filename.match(/^sitemap-(\d+)\.xml$/);
    if (!match) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const chunkIndex = parseInt(match[1], 10) - 1; // 1-based to 0-based

    // Fetch all URLs and chunk them (same logic as generator)
    const urls = await prisma.url.findMany({
      where: {
        projectId,
        status: { in: ["pending", "submitted", "failed"] },
      },
      orderBy: { createdAt: "asc" }, // MUST match the generator's ordering
      select: { url: true },
    });

    const urlStrings = urls.map((u) => u.url);
    const chunks = chunkArray(urlStrings, CHUNK_SIZE);

    if (chunkIndex < 0 || chunkIndex >= chunks.length) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const chunkUrls = chunks[chunkIndex];

    const urlEntries = chunkUrls
      .map(
        (url) => `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
      )
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Dynamic sitemap generation error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
