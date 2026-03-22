import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { verifyGuestOrderToken } from "@/lib/guestOrderToken";
import { auditLog } from "@/lib/auditLog";
import { sendOrderFeedbackNotification } from "@/lib/email";

const FEEDBACK_SUBJECT_PREFIX = "ORDER_FEEDBACK:";

const parseFeedbackMessage = (raw: string) => {
  try {
    const parsed = JSON.parse(raw);
    return {
      note: typeof parsed?.note === "string" ? parsed.note : "",
      images: Array.isArray(parsed?.images) ? parsed.images.filter((i: unknown) => typeof i === "string") : [],
      createdAt: typeof parsed?.createdAt === "string" ? parsed.createdAt : "",
    };
  } catch {
    return {
      note: raw,
      images: [],
      createdAt: "",
    };
  }
};

const validateOrderAccess = async (req: Request, orderId: string) => {
  const session = await getServerSession(authOptions);
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      status: true,
      shippingName: true,
      shippingPhone: true,
      email: true,
    },
  });

  if (!order) {
    return { ok: false as const, response: NextResponse.json({ error: "Order not found" }, { status: 404 }) };
  }

  const sessionUser = session?.user as { id?: string; role?: string } | undefined;
  const isAdmin = sessionUser?.role === "admin";

  if (order.userId) {
    if (!isAdmin && (!sessionUser?.id || sessionUser.id !== order.userId)) {
      await auditLog({
        action: "ORDER_FEEDBACK_ACCESS_DENIED",
        orderId,
        userId: sessionUser?.id,
        reason: "Not order owner",
      });
      return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 403 }) };
    }
  } else if (!isAdmin) {
    const { searchParams } = new URL(req.url);
    const guestToken = searchParams.get("guestToken") || "";
    const isValidToken = verifyGuestOrderToken(orderId, guestToken);

    if (!isValidToken) {
      await auditLog({
        action: "GUEST_ORDER_FEEDBACK_ACCESS_DENIED",
        orderId,
        reason: "Invalid token",
      });
      return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 403 }) };
    }
  }

  return {
    ok: true as const,
    order,
    sessionUser,
  };
};

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const access = await validateOrderAccess(req, orderId);
    if (!access.ok) return access.response;

    const latest = await prisma.contactMessage.findFirst({
      where: {
        subject: `${FEEDBACK_SUBJECT_PREFIX}${orderId}`,
      },
      orderBy: { createdAt: "desc" },
      select: {
        message: true,
        createdAt: true,
      },
    });

    if (!latest) {
      return NextResponse.json({ feedback: null }, { status: 200 });
    }

    const parsed = parseFeedbackMessage(latest.message);

    return NextResponse.json(
      {
        feedback: {
          note: parsed.note,
          images: parsed.images,
          createdAt: parsed.createdAt || latest.createdAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const access = await validateOrderAccess(req, orderId);
    if (!access.ok) return access.response;

    if (access.order.status !== "delivered") {
      return NextResponse.json({ error: "Feedback is only available for delivered orders" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const note = typeof body?.note === "string" ? body.note.trim() : "";
    const images: string[] = Array.isArray(body?.images)
      ? body.images.filter((img: unknown) => typeof img === "string" && img.startsWith("data:image/"))
      : [];

    if (!note && images.length === 0) {
      return NextResponse.json({ error: "Please add a note or at least one image" }, { status: 400 });
    }

    if (note.length > 2000) {
      return NextResponse.json({ error: "Feedback note is too long" }, { status: 400 });
    }

    if (images.length > 3) {
      return NextResponse.json({ error: "Maximum 3 images allowed" }, { status: 400 });
    }

    const tooLargeImage = images.some((img) => img.length > 1_500_000);
    if (tooLargeImage) {
      return NextResponse.json({ error: "One or more images are too large" }, { status: 400 });
    }

    const createdAt = new Date().toISOString();

    await prisma.contactMessage.create({
      data: {
        name: access.order.shippingName || "Order Customer",
        email: access.order.email || `order-${orderId}@mnajel.local`,
        phone: access.order.shippingPhone || null,
        subject: `${FEEDBACK_SUBJECT_PREFIX}${orderId}`,
        message: JSON.stringify({
          orderId,
          note,
          images,
          createdAt,
        }),
        status: "new",
      },
    });

    try {
      await sendOrderFeedbackNotification({
        orderId,
        customerName: access.order.shippingName || "Order Customer",
        customerEmail: access.order.email || null,
        customerPhone: access.order.shippingPhone || null,
        note,
        imagesCount: images.length,
        createdAt: new Date(createdAt),
      });
    } catch {
      // Do not fail feedback submission if email sending fails
    }

    await auditLog({
      action: "ORDER_FEEDBACK_SUBMITTED",
      orderId,
      userId: access.sessionUser?.id,
      metadata: {
        noteLength: note.length,
        imagesCount: images.length,
      },
    });

    return NextResponse.json(
      {
        success: true,
        feedback: {
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
