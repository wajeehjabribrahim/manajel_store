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

    // Get total users count
    const totalUsers = await prisma.user.count();

    // Get new users this month
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const usersThisMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: currentMonth,
        },
      },
    });

    // Get users by role
    const adminCount = await prisma.user.count({
      where: { role: "admin" },
    });

    const userCount = totalUsers - adminCount;

    // Get active users (users with orders)
    const activeUsers = await prisma.user.count({
      where: {
        orders: {
          some: {},
        },
      },
    });

    // Get users registered in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const usersLast7Days = await prisma.user.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Get user growth trend (daily for last 7 days)
    const usersByDay = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      });

      usersByDay.push({
        date: dayStart.toISOString().split("T")[0],
        count,
      });
    }

    return NextResponse.json({
      totalUsers,
      usersThisMonth,
      activeUsers,
      usersLast7Days,
      adminCount,
      regularUsers: userCount,
      userGrowth: usersByDay,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user statistics" },
      { status: 500 }
    );
  }
}
