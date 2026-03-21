import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Registration from "@/lib/models/Registration";
import Event from "@/lib/models/Event";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const registrations = await Registration.find({ email: session.user.email });
    
    // Enrich with event details
    const enriched = await Promise.all(registrations.map(async (reg) => {
      const event = await Event.findOne({ id: reg.eventId });
      return {
        ...reg.toObject(),
        eventTitle: event?.title || 'Unknown Event',
        eventDate: event?.eventDate
      };
    }));

    return NextResponse.json(enriched);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
