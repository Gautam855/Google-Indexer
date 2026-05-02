/**
 * Google Search Console API Integration
 *
 * This module handles:
 * - Submitting sitemaps to Google Search Console
 * - Checking indexing status
 * - Managing Google OAuth credentials
 *
 * NOTE: Requires valid Google Cloud project with Search Console API enabled.
 * For development/demo, this uses a simulated mode.
 */

import prisma from "./prisma";

interface SubmissionResult {
  success: boolean;
  message: string;
  timestamp: Date;
}

/**
 * Submit a sitemap URL to Google Search Console.
 * Falls back to simulation if credentials are not configured.
 */
export async function submitSitemapToGoogle(
  projectId: string,
  sitemapUrl: string
): Promise<SubmissionResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return {
      success: false,
      message: "Project not found",
      timestamp: new Date(),
    };
  }

  // Check if Google credentials are configured
  if (project.googleCredentials) {
    try {
      return await submitViaGoogleAPI(project.domain, sitemapUrl, project.googleCredentials);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        message: `Google API error: ${msg}`,
        timestamp: new Date(),
      };
    }
  }

  // Simulated submission for development
  return simulateSubmission(sitemapUrl);
}

async function submitViaGoogleAPI(
  siteUrl: string,
  sitemapUrl: string,
  credentialsJson: string
): Promise<SubmissionResult> {
  try {
    const { google } = await import("googleapis");
    const credentials = JSON.parse(credentialsJson);

    const auth = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret
    );
    auth.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
    });

    const searchconsole = google.searchconsole({ version: "v1", auth });

    await searchconsole.sitemaps.submit({
      siteUrl: siteUrl,
      feedpath: sitemapUrl,
    });

    return {
      success: true,
      message: `Sitemap submitted to Google: ${sitemapUrl}`,
      timestamp: new Date(),
    };
  } catch (error) {
    throw error;
  }
}

function simulateSubmission(sitemapUrl: string): SubmissionResult {
  // Simulate a 90% success rate for demo
  const isSuccess = Math.random() > 0.1;

  return {
    success: isSuccess,
    message: isSuccess
      ? `[SIMULATED] Sitemap submitted successfully: ${sitemapUrl}`
      : `[SIMULATED] Submission failed - rate limit exceeded`,
    timestamp: new Date(),
  };
}

/**
 * Submit all sitemaps for a project
 */
export async function submitAllSitemaps(projectId: string) {
  const sitemaps = await prisma.sitemap.findMany({
    where: { projectId },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const results: SubmissionResult[] = [];

  // Submit sitemap index
  const indexUrl = `${baseUrl}/sitemaps/${projectId}/sitemap_index.xml`;
  const indexResult = await submitSitemapToGoogle(projectId, indexUrl);
  results.push(indexResult);

  // Log the submission
  await prisma.submissionLog.create({
    data: {
      projectId,
      status: indexResult.success ? "success" : "failure",
      message: indexResult.message,
    },
  });

  // Also submit individual sitemaps
  for (const sitemap of sitemaps) {
    const sitemapUrl = `${baseUrl}${sitemap.filePath}`;
    const result = await submitSitemapToGoogle(projectId, sitemapUrl);
    results.push(result);

    await prisma.submissionLog.create({
      data: {
        projectId,
        sitemapId: sitemap.id,
        status: result.success ? "success" : "failure",
        message: result.message,
      },
    });

    // Rate limiting - wait between submissions
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * Simulate checking index status for URLs
 * In production, this would use Google Search Console API to check
 */
export async function checkIndexingStatus(projectId: string) {
  const submittedUrls = await prisma.url.findMany({
    where: {
      projectId,
      status: "submitted",
      lastSubmittedAt: { not: null },
    },
  });

  let indexedCount = 0;
  let failedCount = 0;

  for (const url of submittedUrls) {
    // Simulate: URLs submitted more than 2 days ago have a chance of being indexed
    const daysSinceSubmission = url.lastSubmittedAt
      ? (Date.now() - new Date(url.lastSubmittedAt).getTime()) /
        (1000 * 60 * 60 * 24)
      : 0;

    if (daysSinceSubmission > 2) {
      const chance = Math.min(0.7, daysSinceSubmission * 0.1);
      if (Math.random() < chance) {
        await prisma.url.update({
          where: { id: url.id },
          data: { status: "indexed", lastCheckedAt: new Date() },
        });
        indexedCount++;
      } else if (url.attempts > 3 && Math.random() < 0.2) {
        await prisma.url.update({
          where: { id: url.id },
          data: { status: "failed", lastCheckedAt: new Date() },
        });
        failedCount++;
      }
    }
  }

  return { checked: submittedUrls.length, indexed: indexedCount, failed: failedCount };
}
