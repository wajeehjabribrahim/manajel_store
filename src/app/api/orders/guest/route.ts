import { NextResponse } from "next/server";
import { corsMiddleware, applyCorsHeaders } from "@/lib/cors";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { isAdminUser } from "@/lib/adminAuth";
import { verifyGuestOrderToken } from "@/lib/guestOrderToken";
import { auditLog } from "@/lib/auditLog";
import { decryptData } from "@/lib/encryption";

export async function GET(req: Request) {
  // Handle CORS preflight
  // @ts-ignore
  const corsResult = corsMiddleware(req);
  if (corsResult && corsResult instanceof NextResponse && corsResult.body === null) {
    return corsResult;
  }

  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string; role?: string } | undefined;
    const isAdmin = await isAdminUser(sessionUser?.id);

    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids") || "";
    const tokensParam = searchParams.get("tokens") || "";

    if (!idsParam) {
      let response = NextResponse.json({ error: "ids required" }, { status: 400 });
      response = applyCorsHeaders(response, req.headers.get('origin'));
      return response;
    }

    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    const tokens = tokensParam.split(",").map((s) => s.trim());

    const orders: any[] = [];

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const token = tokens[i] || "";

      try {
        const order = await prisma.order.findUnique({
          where: { id },
          include: { items: true, user: { select: { id: true, name: true, email: true } } },
        });

        if (!order) {
          continue;
        }

        // If order belongs to a user, only admin can access via this endpoint
        if (order.userId) {
          if (!isAdmin) {
            await auditLog({ action: "ORDER_ACCESS_DENIED", orderId: id, userId: sessionUser?.id, reason: "Not guest order" });
            continue;
          }
        } else {
          // Guest order: verify token unless admin
          if (!isAdmin) {
            const ok = verifyGuestOrderToken(id, token);
            if (!ok) {
              await auditLog({ action: "GUEST_ORDER_ACCESS_DENIED", orderId: id, reason: "Invalid token" });
              continue;
            }
          }
        }

        const safeOrder = {
          ...order,
          shippingCity: order.shippingCity ? decryptData(order.shippingCity) : order.shippingCity,
          shippingAddress: order.shippingAddress ? decryptData(order.shippingAddress) : order.shippingAddress,
        };

        orders.push(safeOrder);
      } catch (e) {
        // skip single failures
        continue;
      }
    }

    let response = NextResponse.json({ orders }, { status: 200 });
    response = applyCorsHeaders(response, req.headers.get('origin'));
    return response;
  } catch (error) {
    console.error("guest orders error", error);
    let response = NextResponse.json({ error: "Server error" }, { status: 500 });
    response = applyCorsHeaders(response, req.headers.get('origin'));
    return response;
  }
}
