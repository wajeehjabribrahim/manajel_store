import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// دالة للتحقق من صلاحيات المسؤول
async function verifyAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { error: "غير مصرح - تسجيل الدخول مطلوب", status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { id: true, role: true }
  });

  if (!user || user.role !== "admin") {
    return { error: "حق الوصول مرفوض - صلاحيات إدارية مطلوبة", status: 403 };
  }

  return { success: true };
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifyAdmin(request);
    if (!authCheck.success) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    // Get total orders count
    const totalOrders = await prisma.order.count();

    // Get orders by status
    const pendingOrders = await prisma.order.count({
      where: { status: "pending" },
    });

    const processingOrders = await prisma.order.count({
      where: { status: "processing" },
    });

    const shippedOrders = await prisma.order.count({
      where: { status: "shipped" },
    });

    const deliveredOrders = await prisma.order.count({
      where: { status: "delivered" },
    });

    const completedOrders = await prisma.order.count({
      where: { status: "completed" },
    });

    const cancelledOrders = await prisma.order.count({
      where: { status: "cancelled" },
    });

    // Get total revenue
    const revenueData = await prisma.order.aggregate({
      _sum: {
        total: true,
      },
    });
    const totalRevenue = revenueData._sum.total || 0;

    // Get this month's revenue
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthRevenue = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: currentMonth,
        },
      },
      _sum: {
        total: true,
      },
    });
    const monthTotal = monthRevenue._sum.total || 0;

    // Get orders this month
    const ordersThisMonth = await prisma.order.count({
      where: {
        createdAt: {
          gte: currentMonth,
        },
      },
    });

    // Get daily orders (last 7 days)
    const ordersByDay = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = await prisma.order.count({
        where: {
          createdAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      });

      ordersByDay.push({
        date: dayStart.toISOString().split("T")[0],
        count,
      });
    }

    // Get average order value
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return NextResponse.json({
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      completedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      monthTotal,
      ordersThisMonth,
      averageOrderValue: avgOrder,
      ordersByDay,
    });
  } catch (error) {
    console.error("Error fetching orders stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders statistics" },
      { status: 500 }
    );
  }
}
