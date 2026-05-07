import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = req.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
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

    const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });
    
    // Fetch all sites in Search Console
    const response = await searchconsole.sites.list({});
    
    return NextResponse.json({ 
      sites: response.data.siteEntry || [] 
    });

  } catch (error: any) {
    console.error("Fetch sites error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch sites" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, domain } = await req.json();

    if (!projectId || !domain) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { domain: domain }
    });

    return NextResponse.json({ success: true, project: updatedProject });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { googleCredentials: null }
    });

    return NextResponse.json({ success: true, message: "Google account disconnected" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
