import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Member from "@/lib/models/Member";

async function getAdminLevel() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  await connectDB();
  const member = await Member.findOne({ email: session.user.email });
  if (!member) return null;

  const isElite = member.domain === 'Zero Order' || member.domain === 'Advisor';
  const isChiefOrLead = member.role.toLowerCase().includes('chief') || member.role.toLowerCase().includes('lead');

  if (isElite || isChiefOrLead) {
    return {
      authenticated: true,
      role: member.role,
      domain: member.domain,
      isElite
    };
  }
  return null;
}

export async function GET() {
  const adminAccess = await getAdminLevel();
  if (!adminAccess) return NextResponse.json({ authenticated: false });
  return NextResponse.json(adminAccess);
}
