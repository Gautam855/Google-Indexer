import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
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

    // Determine the base URL (local or production)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (req.headers.get("host")?.includes("localhost") ? `http://${req.headers.get("host")}` : "https://google-indexer-one.vercel.app");
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const scopes = [
      "https://www.googleapis.com/auth/webmasters",
      "https://www.googleapis.com/auth/indexing"
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: scopes,
      state: projectId, // Pass project ID to callback
    });

    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Google Auth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
