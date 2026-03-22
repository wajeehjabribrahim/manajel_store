import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAccess } from "@/lib/adminAuth";

const FEEDBACK_SUBJECT_PREFIX = "ORDER_FEEDBACK:";

const parseFeedback = (raw: string) => {
  try {
    const parsed = JSON.parse(raw);
    return {
      note: typeof parsed?.note === "string" ? parsed.note : "",
      images: Array.isArray(parsed?.images)
        ? parsed.images.filter((img: unknown): img is string => typeof img === "string")
        : [],
      createdAt: typeof parsed?.createdAt === "string" ? parsed.createdAt : null,
      orderId: typeof parsed?.orderId === "string" ? parsed.orderId : null,
    };
  } catch {
    return {
      note: raw,
      images: [] as string[],
      createdAt: null,
      orderId: null,
    };
  }
};

export async function GET() {
  try {
    const adminCheck = await requireAdminAccess();
    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const messages = await prisma.contactMessage.findMany({
      where: {
        subject: {
          startsWith: FEEDBACK_SUBJECT_PREFIX,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
    });

    const feedback = messages.map((msg) => {
      const parsed = parseFeedback(msg.message);
      const orderIdFromSubject = msg.subject.slice(FEEDBACK_SUBJECT_PREFIX.length);

      return {
        id: msg.id,
        orderId: parsed.orderId || orderIdFromSubject,
        customerName: msg.name,
        customerEmail: msg.email,
        customerPhone: msg.phone,
        note: parsed.note,
        images: parsed.images,
        status: msg.status,
        createdAt: parsed.createdAt || msg.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ feedback }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
