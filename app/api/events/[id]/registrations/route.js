import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Registration from '@/lib/models/Registration';
import Event from '@/lib/models/Event';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const registrations = await Registration.find({ eventId: id }).sort({ registeredAt: -1 });
        return NextResponse.json(registrations);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const { id } = await params; // This is eventId in this context, but wait...
        // Actually, we usually update a specific registration by ITS id.
        // Let's make this route for updating a registration within an event scope.
        
        const { registrationId, role } = await request.json();
        if (!registrationId || !role) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

        const updated = await Registration.findOneAndUpdate(
            { id: registrationId, eventId: id },
            { $set: { role } },
            { new: true }
        );

        if (!updated) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        return NextResponse.json(updated);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
