import { NextResponse } from 'next/server';
import connectDB from "@/lib/db";
import Media from "@/lib/models/Media";
import { uploadToR2 } from "@/lib/r2";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file');
    const eventName = formData.get('eventName') || 'General';

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;
    const type = mimeType.startsWith('video/') ? 'video' : 'image';
    
    // Generate unique key
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    const key = `media/${eventName.replace(/\s+/g, '_')}/${timestamp}_${safeName}`;

    // Upload to R2
    const url = await uploadToR2(buffer, key, mimeType);

    await connectDB();
    const newMedia = await Media.create({
      url,
      type,
      eventName,
      s3Key: key,
      fileSize: file.size,
      mimeType,
      uploadedBy: session.user.email,
    });

    return NextResponse.json(newMedia);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
