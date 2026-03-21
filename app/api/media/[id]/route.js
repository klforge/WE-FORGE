import { NextResponse } from 'next/server';
import connectDB from "@/lib/db";
import Media from "@/lib/models/Media";
import { deleteFromR2 } from "@/lib/r2";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();
    const media = await Media.findById(id);
    if (!media) return NextResponse.json({ error: 'Media not found' }, { status: 404 });

    // Delete from R2
    await deleteFromR2(media.s3Key);

    // Delete from DB
    await Media.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
