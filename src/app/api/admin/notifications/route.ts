import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, notified } = await req.json();

  const updated = await prisma.stockNotification.update({
    where: { id },
    data: { notified },
  });

  return NextResponse.json({ notification: updated });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  await prisma.stockNotification.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
