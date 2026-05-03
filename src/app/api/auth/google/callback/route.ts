import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const projectId = req.nextUrl.searchParams.get("state");
    const error = req.nextUrl.searchParams.get("error");

    // Determine the base URL (local or production)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (req.headers.get("host")?.includes("localhost") ? `http://${req.headers.get("host")}` : "https://google-indexer-one.vercel.app");
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    if (error) {
      return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=${encodeURIComponent(error)}`);
    }

    if (!code || !projectId) {
      return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=MissingParameters`);
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);

    // Provide the credentials object that looks like the Service Account JSON format
    // for compatibility with the rest of the application.
    const googleCredentials = JSON.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      type: "oauth2"
    });

    // Update project with the credentials
    await prisma.project.update({
      where: { id: projectId },
      data: { googleCredentials }
    });

    return NextResponse.redirect(`${baseUrl}/dashboard/settings?success=GoogleConnected`);
  } catch (error) {
    console.error("Google Auth Callback error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (req.headers.get("host")?.includes("localhost") ? `http://${req.headers.get("host")}` : "https://google-indexer-one.vercel.app");
    return NextResponse.redirect(`${baseUrl}/dashboard/settings?error=InternalServerError`);
  }
}
