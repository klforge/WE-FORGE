import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Member from "@/lib/models/Member";

export const dynamic = 'force-dynamic';

// Roles that are allowed to access the admin panel
const ADMIN_ROLES = ['President', 'Chief Secretary', 'Treasurer', 'Advisor', 'Chief'];

// Domains where the "Chief" role gets full elite access
const ELITE_DOMAINS = ['Zero Order', 'Advisor'];

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ authenticated: false });
    }

    await connectDB();
    const member = await Member.findOne({ email: session.user.email }).lean();
    if (!member) {
        return NextResponse.json({ authenticated: false });
    }

    const { role, domain } = member;

    // Check if this role is allowed into admin
    const isAllowed = ADMIN_ROLES.includes(role);
    if (!isAllowed) {
        return NextResponse.json({ authenticated: false, signedIn: true, role, domain });
    }

    // All allowed roles see everything
    const isElite = true;

    return NextResponse.json({
        authenticated: true,
        role,
        domain,
        name: member.name,
        isElite,
    });
}
