import prisma from "./prisma";
import { chunkArray } from "./utils";

const CHUNK_SIZE = 250; // URLs per sitemap

export async function generateSitemapsForProject(projectId: string) {
  // Fetch all pending and submitted URLs for the project
  const urls = await prisma.url.findMany({
    where: {
      projectId,
      status: { in: ["pending", "submitted", "failed"] },
    },
    orderBy: { createdAt: 'asc' }, // Ensure deterministic order
    select: { url: true },
  });

  if (urls.length === 0) {
    return { sitemapCount: 0, totalUrls: 0 };
  }

  const urlStrings = urls.map((u: { url: string }) => u.url);
  const chunks = chunkArray(urlStrings, CHUNK_SIZE);

  // Clear old sitemaps from DB for this project
  await prisma.sitemap.deleteMany({ where: { projectId } });

  const sitemapFiles: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const filename = `sitemap-${i + 1}.xml`;
    
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
