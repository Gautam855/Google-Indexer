import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { projectId, action } = await req.json();

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

    // Format siteUrl for Google (must be exact)
    const siteUrl = project.domain.startsWith('http') ? project.domain : `https://${project.domain}`;
    const formattedUrl = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;

    if (action === 'getToken') {
      try {
        const response = await siteVerification.webResource.getToken({
          requestBody: {
            verificationMethod: "META",
            site: {
              identifier: formattedUrl,
              type: "SITE"
            }
          }
        });
        return NextResponse.json({ token: response.data.token });
      } catch (err: any) {
        console.error("Token Error:", err);
        return NextResponse.json({ error: "Failed to get verification token. Make sure the domain is correct." }, { status: 500 });
      }
    }

    if (action === 'verify') {
      try {
        // 1. Tell Google to verify the site
        const verifyResponse = await siteVerification.webResource.insert({
          verificationMethod: "META",
          requestBody: {
            site: {
              identifier: formattedUrl,
              type: "SITE"
            }
          }
        });

        // 2. Add to Search Console Property List (Property insert)
        await searchconsole.sites.add({
          siteUrl: formattedUrl
        });

        return NextResponse.json({ 
          success: true, 
          message: "Site verified and added to Search Console successfully!",
          data: verifyResponse.data 
        });
      } catch (err: any) {
        console.error("Verification Error:", err);
        
        // If it's already verified, we still want to try adding it to search console
        if (err.message?.includes("already verified") || err.code === 409) {
          try {
             await searchconsole.sites.add({ siteUrl: formattedUrl });
             return NextResponse.json({ success: true, message: "Site was already verified and has been added to your properties." });
          } catch (addErr: any) {
             return NextResponse.json({ error: "Site already verified but failed to add to property list." }, { status: 500 });
          }
        }
        
        return NextResponse.json({ error: err.message || "Verification failed. Please check if the meta tag is added correctly." }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Global Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
