import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAccess } from "@/lib/adminAuth";

const PRODUCT_FEEDBACK_PREFIX = "PRODUCT_MANUAL_FEEDBACK:";

const parseFeedbackMessage = (raw: string) => {
  try {
    const parsed = JSON.parse(raw);
    return {
      note: typeof parsed?.note === "string" ? parsed.note : "",
      images: Array.isArray(parsed?.images)
        ? parsed.images.filter((img: unknown): img is string => typeof img === "string")
        : [],
      createdAt: typeof parsed?.createdAt === "string" ? parsed.createdAt : "",
    };
  } catch {
    return {
      note: raw,
      images: [] as string[],
      createdAt: "",
    };
  }
};

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params?.id ? String(params.id) : "";
    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const rows = await prisma.contactMessage.findMany({
      where: {
        subject: `${PRODUCT_FEEDBACK_PREFIX}${productId}`,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        message: true,
        createdAt: true,
      },
    });

    const feedbacks = rows.map((row) => {
      const parsed = parseFeedbackMessage(row.message);
      return {
        id: row.id,
        author: row.name || "Admin",
        note: parsed.note,
        images: parsed.images,
        createdAt: parsed.createdAt || row.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ feedbacks }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adminCheck = await requireAdminAccess();
    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const productId = params?.id ? String(params.id) : "";
    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    const images: string[] = Array.isArray(body?.images)
      ? body.images.filter((img: unknown) => typeof img === "string" && img.startsWith("data:image/"))
      : [];

    if (!note && images.length === 0) {
      return NextResponse.json({ error: "Add note or at least one image" }, { status: 400 });
    }

    if (note.length > 2000) {
      return NextResponse.json({ error: "Note is too long" }, { status: 400 });
    }

    if (images.length > 3) {
      return NextResponse.json({ error: "Maximum 3 images allowed" }, { status: 400 });
    }

    const tooLarge = images.some((img) => img.length > 1_500_000);
    if (tooLarge) {
      return NextResponse.json({ error: "One or more images are too large" }, { status: 400 });
    }

    const requestedCreatedAt = typeof body?.createdAt === "string" ? body.createdAt : "";
    const parsedRequestedDate = requestedCreatedAt ? new Date(requestedCreatedAt) : null;
    const createdAt = parsedRequestedDate && !Number.isNaN(parsedRequestedDate.getTime())
      ? parsedRequestedDate.toISOString()
      : new Date().toISOString();

    const created = await prisma.contactMessage.create({
      data: {
        name: "Admin",
        email: `admin-feedback-${productId}@mnajel.local`,
        phone: null,
        subject: `${PRODUCT_FEEDBACK_PREFIX}${productId}`,
        message: JSON.stringify({
          note,
          images,
          createdAt,
        }),
        status: "read",
      },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json(
      {
        feedback: {
          id: created.id,
          author: created.name || "Admin",
          note,
          images,
          createdAt,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
