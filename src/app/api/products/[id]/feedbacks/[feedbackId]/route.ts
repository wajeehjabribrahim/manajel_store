import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAccess } from "@/lib/adminAuth";

const PRODUCT_FEEDBACK_PREFIX = "PRODUCT_MANUAL_FEEDBACK:";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; feedbackId: string } }
) {
  try {
    const adminCheck = await requireAdminAccess();
    if (!adminCheck.ok) {
      return adminCheck.response;
    }
    const productId = params?.id ? String(params.id) : "";
    const feedbackId = params?.feedbackId ? String(params.feedbackId) : "";
    if (!productId || !feedbackId) {
      return NextResponse.json({ error: "Product ID and Feedback ID required" }, { status: 400 });
    }
    const deleted = await prisma.contactMessage.delete({
      where: { id: feedbackId, subject: `${PRODUCT_FEEDBACK_PREFIX}${productId}` },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string; feedbackId: string } }
) {
  try {
    const adminCheck = await requireAdminAccess();
    if (!adminCheck.ok) {
      return adminCheck.response;
    }
    const productId = params?.id ? String(params.id) : "";
    const feedbackId = params?.feedbackId ? String(params.feedbackId) : "";
    if (!productId || !feedbackId) {
      return NextResponse.json({ error: "Product ID and Feedback ID required" }, { status: 400 });
    }
    const body = await req.json().catch(() => ({}));
    const hasAuthorField = typeof body?.author === "string";
    const author = hasAuthorField ? body.author.trim() : "";
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    const noteEn = typeof body?.noteEn === "string" ? body.noteEn.trim() : "";
    const hasRatingField = body?.rating !== undefined;
    const rawRating = Number(body?.rating);
    const rating = Number.isFinite(rawRating)
      ? Math.min(5, Math.max(1, Math.round(rawRating)))
      : 5;
    const images = Array.isArray(body?.images)
      ? body.images.filter((img: unknown): img is string => typeof img === "string" && img.startsWith("data:image/"))
      : undefined;
    if (!note && !noteEn) {
      return NextResponse.json({ error: "Note required" }, { status: 400 });
    }

    if (images && images.length > 3) {
      return NextResponse.json({ error: "Maximum 3 images allowed" }, { status: 400 });
    }

    if (images && images.some((img: string) => img.length > 1_500_000)) {
      return NextResponse.json({ error: "One or more images are too large" }, { status: 400 });
    }

    if (hasAuthorField && author.length > 120) {
      return NextResponse.json({ error: "Author name is too long" }, { status: 400 });
    }

    // Fetch the old message to preserve images and createdAt
    const old = await prisma.contactMessage.findUnique({
      where: { id: feedbackId, subject: `${PRODUCT_FEEDBACK_PREFIX}${productId}` },
      select: { message: true },
    });
    if (!old) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }
    let parsed;
    try {
      parsed = JSON.parse(old.message);
    } catch {
      parsed = {};
    }
    const updatedMsg = JSON.stringify({
      ...parsed,
      note,
      noteEn,
      images: images ?? parsed?.images ?? [],
      ...(hasRatingField ? { rating } : {}),
    });
    await prisma.contactMessage.update({
      where: { id: feedbackId, subject: `${PRODUCT_FEEDBACK_PREFIX}${productId}` },
      data: {
        message: updatedMsg,
        ...(hasAuthorField ? { name: author || "Admin" } : {}),
      },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
