import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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
