import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendContactNotification } from '@/lib/email';
import { encryptData, decryptData } from '@/lib/encryption';
import { requireAdminAccess } from '@/lib/adminAuth';
import { checkDbRateLimit, getRequestIp } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Durable per-IP limit (middleware limit is in-memory only)
    const ip = getRequestIp(request);
    const rate = await checkDbRateLimit(`contact:${ip}`, 5, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many messages. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, subject, message' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Create contact message
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: encryptData(email.trim()),
        phone: phone?.trim() ? encryptData(phone.trim()) : null,
        subject: subject.trim(),
        message: encryptData(message.trim()),
        status: 'new',
      },
    });

    // إرسال إيميل للأدمن
    try {
      const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || ['admin@manajel.com'];
      await sendContactNotification(adminEmails, {
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
    } catch (emailError) {
      console.error("Failed to send contact email:", emailError);
      // لا نرجع خطأ، الرسالة تم حفظها حتى لو فشل الإيميل
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Your message has been received. We will get back to you soon.',
        data: contactMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to submit message. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdminAccess();
    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'list') {
      const messages = await prisma.contactMessage.findMany({
        orderBy: { createdAt: 'desc' },
      });

      const safeMessages = messages.map((msg) => ({
        ...msg,
        email: msg.email ? decryptData(msg.email) : msg.email,
        phone: msg.phone ? decryptData(msg.phone) : msg.phone,
        message: msg.message ? decryptData(msg.message) : msg.message,
      }));

      return NextResponse.json({ messages: safeMessages });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Contact GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await requireAdminAccess();
    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const message = await prisma.contactMessage.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Contact PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminCheck = await requireAdminAccess();
    if (!adminCheck.ok) {
      return adminCheck.response;
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing message ID' },
        { status: 400 }
      );
    }

    await prisma.contactMessage.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Contact DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
