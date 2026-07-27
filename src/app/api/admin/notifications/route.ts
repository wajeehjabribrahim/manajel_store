import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAccess } from "@/lib/adminAuth";

export async function GET() {
  const adminCheck = await requireAdminAccess();
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  const notifications = await prisma.stockNotification.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Enrich with product image
  const productIds = [...new Set(notifications.map((n) => n.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, image: true },
  });
  const imageMap: Record<string, string> = {};
  products.forEach((p) => { if (p.image) imageMap[p.id] = p.image; });

  const enriched = notifications.map((n) => ({
    ...n,
    productImage: imageMap[n.productId] ?? null,
  }));

  return NextResponse.json({ notifications: enriched });
}

export async function PATCH(req: NextRequest) {
  const adminCheck = await requireAdminAccess();
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  const { id, notified } = await req.json();

  const updated = await prisma.stockNotification.update({
    where: { id },
    data: { notified },
  });

  return NextResponse.json({ notification: updated });
}

export async function DELETE(req: NextRequest) {
  const adminCheck = await requireAdminAccess();
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  const { id } = await req.json();
  await prisma.stockNotification.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
