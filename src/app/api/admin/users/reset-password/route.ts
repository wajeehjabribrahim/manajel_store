import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAdminAccess } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdminAccess();
    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: "userId and newPassword are required" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
