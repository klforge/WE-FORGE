import { NextResponse } from 'next/server';
import connectDB from "@/lib/db";
import Media from "@/lib/models/Media";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  try {
    await connectDB();
    const media = await Media.find().sort({ createdAt: -1 });
    return NextResponse.json(media);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
