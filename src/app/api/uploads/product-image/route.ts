import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
    if (!session || !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // تحويل الصورة إلى WebP بجودة 75
    const buffer = Buffer.from(await file.arrayBuffer());
    let webpBuffer;
    let imageData;
    try {
      const sharp = (await import('sharp')).default;
      webpBuffer = await sharp(buffer).webp({ quality: 75 }).toBuffer();
      const webpBase64 = webpBuffer.toString('base64');
      imageData = `data:image/webp;base64,${webpBase64}`;
    } catch (err) {
      // fallback: إذا فشل التحويل استخدم الصورة الأصلية
      const base64 = buffer.toString('base64');
      imageData = `data:${file.type};base64,${base64}`;
    }
    return NextResponse.json({ imageData }, { status: 201 });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
