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

    // Get all orders grouped by year
    const orders = await prisma.order.findMany({
      where: {
        status: "delivered",
      },
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group by year and month
    const yearData: {
      [year: number]: {
        total: number;
        count: number;
        months: {
          [month: number]: {
            total: number;
            count: number;
          };
        };
      };
    } = {};

    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 1-12

      if (!yearData[year]) {
        yearData[year] = {
          total: 0,
          count: 0,
          months: {},
        };
      }

      yearData[year].total += order.total;
      yearData[year].count += 1;

      if (!yearData[year].months[month]) {
        yearData[year].months[month] = {
          total: 0,
          count: 0,
        };
      }

      yearData[year].months[month].total += order.total;
      yearData[year].months[month].count += 1;
    });

    // Convert to array and sort
    const yearsArray = Object.entries(yearData)
      .map(([year, data]) => ({
        year: parseInt(year),
        ...data,
      }))
      .sort((a, b) => b.year - a.year);

    return NextResponse.json({
      years: yearsArray,
    });
  } catch (error) {
    console.error("Error fetching yearly orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch yearly orders" },
      { status: 500 }
    );
  }
}
