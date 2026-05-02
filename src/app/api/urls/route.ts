import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { isValidUrl, parseCSVUrls } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: payload.userId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const where: Record<string, unknown> = { projectId };
    if (status && status !== "all") {
      where.status = status;
    }
    if (search) {
      where.url = { contains: search };
    }

    const [urls, total] = await Promise.all([
      prisma.url.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.url.count({ where }),
    ]);

    return NextResponse.json({
      urls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("URLs fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";

    let urls: string[] = [];
    let projectId: string = "";

    if (contentType.includes("multipart/form-data")) {
      // CSV file upload
      const formData = await req.formData();
      projectId = formData.get("projectId") as string;
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }

      const text = await file.text();
      urls = parseCSVUrls(text);
    } else {
      // JSON body with urls array or bulk text
      const body = await req.json();
      projectId = body.projectId;

      if (body.urls && Array.isArray(body.urls)) {
        urls = body.urls.filter(isValidUrl);
      } else if (body.bulkText) {
        urls = body.bulkText
          .split(/[\n\r]+/)
          .map((u: string) => u.trim())
          .filter(isValidUrl);
      }
    }

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: payload.userId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (urls.length === 0) {
      return NextResponse.json({ error: "No valid URLs found" }, { status: 400 });
    }

    // Rate limit: max 2000 URLs per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await prisma.url.count({
      where: {
        projectId,
        createdAt: { gte: today },
      },
    });

    if (todayCount + urls.length > 2000) {
      return NextResponse.json(
        {
          error: `Daily limit exceeded. ${2000 - todayCount} URLs remaining today.`,
        },
        { status: 429 }
      );
    }

    // Deduplicate against existing URLs
    const existingUrls = await prisma.url.findMany({
      where: { projectId, url: { in: urls } },
      select: { url: true },
    });
    const existingSet = new Set(existingUrls.map((u) => u.url));
    const newUrls = urls.filter((u) => !existingSet.has(u));

    if (newUrls.length === 0) {
      return NextResponse.json({
        message: "All URLs already exist in the project",
        added: 0,
        duplicates: urls.length,
      });
    }

    // Batch insert
    const result = await prisma.url.createMany({
      data: newUrls.map((url) => ({
        projectId,
        url,
        status: "pending",
      })),
    });

    return NextResponse.json(
      {
        message: `${result.count} URLs added successfully`,
        added: result.count,
        duplicates: urls.length - newUrls.length,
        total: urls.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("URL upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const urlId = searchParams.get("id");
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: payload.userId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (urlId) {
      await prisma.url.delete({ where: { id: urlId, projectId } });
    } else {
      // Delete all URLs with specific status
      const status = searchParams.get("status");
      if (status) {
        await prisma.url.deleteMany({ where: { projectId, status } });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("URL delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
