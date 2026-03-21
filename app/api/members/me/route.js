import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Member from "@/lib/models/Member";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const member = await Member.findOne({ email: session.user.email });
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    return NextResponse.json(member);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    console.log('[API ME PUT] body:', body);
    const { bio, skills, telegram, github, linkedin } = body;
    await connectDB();
    const member = await Member.findOneAndUpdate(
      { email: session.user.email },
      { $set: { bio, skills, telegram, github, linkedin } },
      { returnDocument: 'after' }
    );
    return NextResponse.json(member);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
