import { NextResponse } from 'next/server';
import connectDB from "@/lib/db";
import Member from "@/lib/models/Member";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { updates } = await req.json();
    await connectDB();

    const bulkOps = updates.map(u => ({
      updateOne: {
        filter: { id: u.id },
        update: { $set: { orderIndex: u.orderIndex } }
      }
    }));

    await Member.bulkWrite(bulkOps);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
