import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import prisma from "./prisma";
import { chunkArray } from "./utils";

const SITEMAP_DIR = path.join(process.cwd(), "public", "sitemaps");
const CHUNK_SIZE = 250; // URLs per sitemap

function ensureSitemapDir() {
  if (!existsSync(SITEMAP_DIR)) {
    mkdirSync(SITEMAP_DIR, { recursive: true });
  }
}

function generateSitemapXML(urls: string[]): string {
  const urlEntries = urls
    .map(
      (url) => `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

function generateSitemapIndexXML(
  sitemapFiles: string[],
  baseUrl: string
): string {
  const entries = sitemapFiles
    .map(
      (file) => `  <sitemap>
    <loc>${baseUrl}/sitemaps/${file}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
  </sitemap>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function generateSitemapsForProject(projectId: string) {
  ensureSitemapDir();

  // Create project-specific directory
  const projectDir = path.join(SITEMAP_DIR, projectId);
  if (!existsSync(projectDir)) {
    mkdirSync(projectDir, { recursive: true });
  }

  // Fetch all pending and submitted URLs for the project
  const urls = await prisma.url.findMany({
    where: {
      projectId,
      status: { in: ["pending", "submitted", "failed"] },
    },
    select: { url: true },
  });

  if (urls.length === 0) {
    return { sitemapCount: 0, totalUrls: 0 };
  }

  const urlStrings = urls.map((u) => u.url);
  const chunks = chunkArray(urlStrings, CHUNK_SIZE);

  // Clear old sitemaps from DB for this project
  await prisma.sitemap.deleteMany({ where: { projectId } });

  const sitemapFiles: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const filename = `sitemap-${i + 1}.xml`;
    const filePath = path.join(projectDir, filename);
    const xml = generateSitemapXML(chunks[i]);

    writeFileSync(filePath, xml, "utf-8");

    await prisma.sitemap.create({
      data: {
        projectId,
        filename,
        urlCount: chunks[i].length,
        filePath: `/sitemaps/${projectId}/${filename}`,
      },
    });

    sitemapFiles.push(filename);
  }

  // Generate sitemap index
  const domain =
    (await prisma.project.findUnique({
      where: { id: projectId },
      select: { domain: true },
    })) || { domain: "http://localhost:3000" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const indexXml = generateSitemapIndexXML(sitemapFiles, `${baseUrl}`);
  const indexPath = path.join(projectDir, "sitemap_index.xml");
  writeFileSync(indexPath, indexXml, "utf-8");

  // Update URLs status to 'submitted'
  await prisma.url.updateMany({
    where: {
      projectId,
      status: "pending",
    },
    data: {
      status: "submitted",
      lastSubmittedAt: new Date(),
      attempts: { increment: 1 },
    },
  });

  return {
    sitemapCount: chunks.length,
    totalUrls: urls.length,
    indexPath: `/sitemaps/${projectId}/sitemap_index.xml`,
  };
}
