import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { projectId, action } = await req.json(); // action can be 'getToken' or 'verify'

    if (!projectId || !action) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project || !project.googleCredentials) {
      return NextResponse.json({ error: "Google not connected" }, { status: 400 });
    }

    const creds = JSON.parse(project.googleCredentials);
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: creds.access_token,
      refresh_token: creds.refresh_token,
      expiry_date: creds.expiry_date,
    });

    const siteVerification = google.siteVerification({ version: 'v1', auth: oauth2Client });
    const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });

    // Ensure domain is formatted correctly (e.g. https://digifaiz.com/)
    const siteUrl = project.domain.endsWith('/') ? project.domain : `${project.domain}/`;

    if (action === 'getToken') {
      const response = await siteVerification.webResource.getToken({
        requestBody: {
          verificationMethod: "META",
          site: {
            identifier: siteUrl,
            type: "SITE"
          }
        }
      });
      return NextResponse.json({ token: response.data.token });
    }

    if (action === 'verify') {
      // Tell Google to verify it
      const verifyResponse = await siteVerification.webResource.insert({
        verificationMethod: "META",
        requestBody: {
          site: {
            identifier: siteUrl,
            type: "SITE"
          }
        }
      });

      // Now add it to Search Console Property List
      await searchconsole.sites.add({
        siteUrl: siteUrl
      });

      return NextResponse.json({ success: true, data: verifyResponse.data });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Site verification error:", error);
    return NextResponse.json({ error: error.message || "Failed to verify site" }, { status: 500 });
  }
}
