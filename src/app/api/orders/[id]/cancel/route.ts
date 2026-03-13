import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyGuestOrderToken } from "@/lib/guestOrderToken";
import { sendOrderCancellationNotification } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const orderId = params.id;

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const sessionUser = session?.user as { id?: string; role?: string } | undefined;
    const sessionUserId = sessionUser?.id;
    const isAdmin = sessionUser?.role === "admin";

    // Authenticated user order: owner or admin only
    if (order.userId) {
      if (!isAdmin && (!sessionUserId || sessionUserId !== order.userId)) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 403 }
        );
      }
    } else {
      // Guest order: require valid guest token unless admin
      if (!isAdmin) {
        const guestToken = req.nextUrl.searchParams.get("guestToken") || "";
        const isValidToken = verifyGuestOrderToken(orderId, guestToken);
        if (!isValidToken) {
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 403 }
          );
        }
      }
    }

    // Check if order can be cancelled (not in processing status)
    if (order.status === "processing") {
      return NextResponse.json(
        { error: "Cannot cancel order in processing" },
        { status: 400 }
      );
    }

    // Check if order is already cancelled or delivered
    if (order.status === "cancelled" || order.status === "delivered") {
      return NextResponse.json(
        { error: "Order cannot be cancelled" },
        { status: 400 }
      );
    }

    // Cancel the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "cancelled" },
    });

    const cancelledBy: "admin" | "user" | "guest" = isAdmin
      ? "admin"
      : order.userId
      ? "user"
      : "guest";

    try {
      await sendOrderCancellationNotification({
        id: updatedOrder.id,
        customerName: updatedOrder.shippingName,
        customerEmail: updatedOrder.email,
        total: updatedOrder.total,
        cancelledBy,
        cancelledAt: new Date(),
      });
    } catch (emailError) {
      console.error("Failed to send order cancellation email:", emailError);
      // Do not fail cancellation if email fails
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json(
      { error: "Failed to cancel order" },
      { status: 500 }
    );
  }
}
