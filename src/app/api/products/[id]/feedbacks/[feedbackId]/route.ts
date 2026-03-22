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
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    if (!note) {
      return NextResponse.json({ error: "Note required" }, { status: 400 });
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
    });
    await prisma.contactMessage.update({
      where: { id: feedbackId, subject: `${PRODUCT_FEEDBACK_PREFIX}${productId}` },
      data: { message: updatedMsg },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
