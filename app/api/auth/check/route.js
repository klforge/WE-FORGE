import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Member from "@/lib/models/Member";
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET() {
    // ── 1. Check JWT cookie (password-based admin login) ──────────────
    const cookieStore = await cookies();
    const adminTokenCookie = cookieStore.get('adminToken');
    if (adminTokenCookie?.value) {
        try {
            jwt.verify(adminTokenCookie.value, process.env.JWT_SECRET);
            return NextResponse.json({
                authenticated: true,
                isElite: true,
                role: 'Admin',
                domain: 'Zero Order'
            });
        } catch {
            // token invalid/expired – fall through to NextAuth check
        }
    }

    // ── 2. Fall back to NextAuth session ──────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ authenticated: false });

    await connectDB();
    const member = await Member.findOne({ email: session.user.email });
    if (!member) return NextResponse.json({ authenticated: false });

    const isChiefOrLead = member.role.toLowerCase().includes('chief') || member.role.toLowerCase().includes('lead');
    const isElite = member.domain === 'Zero Order' || member.domain === 'Advisor' || isChiefOrLead;

    if (isElite || isChiefOrLead) {
        return NextResponse.json({
            authenticated: true,
            role: member.role,
            domain: member.domain,
            isElite
        });
    }

    return NextResponse.json({ authenticated: false });
}
