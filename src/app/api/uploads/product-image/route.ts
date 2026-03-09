import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/adminAuth";

export async function POST(req: Request) {
  try {
    const adminCheck = await requireAdminAccess();
    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum 10MB allowed." }, { status: 400 });
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
