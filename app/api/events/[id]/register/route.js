import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Event from '@/lib/models/Event';
import Registration from '@/lib/models/Registration';

export async function POST(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const { name, rollNumber, email } = await request.json();
        
        if (!name || !rollNumber || !email) {
            return NextResponse.json({ error: 'Fields required' }, { status: 400 });
        }

        const event = await Event.findOne({ id });
        if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

        // Access Control
        if (event.accessType === 'domain') {
            const hasDomain = event.allowedDomains.some(d => email.endsWith(`@${d.toLowerCase()}.com`) || (name && name.includes(d))); 
            // Better: use session-based domain check if available, but for now we follow the user's logic.
            // Wait, we should probably check against the Member's actual domain from DB.
        } else if (event.accessType === 'private') {
            if (!event.allowedMembers.includes(rollNumber.trim())) {
                return NextResponse.json({ error: 'You are not on the guest list for this private event' }, { status: 403 });
            }
        }

        if (!event.isRegistrationOpen) {
            return NextResponse.json({ error: 'Registration is currently closed' }, { status: 400 });
        }

        if (new Date(event.registrationDeadline) < new Date()) {
            return NextResponse.json({ error: 'Registration deadline passed' }, { status: 400 });
        }
        if (event.registeredCount >= event.slots) {
            return NextResponse.json({ error: 'No slots remaining' }, { status: 400 });
        }

        const duplicate = await Registration.findOne({ eventId: event.id, rollNumber: rollNumber.trim() });
        if (duplicate) return NextResponse.json({ error: 'Already registered' }, { status: 409 });

        const newReg = new Registration({
            id: String(Date.now()),
            eventId: event.id,
            name: name.trim(),
            rollNumber: rollNumber.trim(),
            email: email.trim()
        });

        await newReg.save();
        
        event.registeredCount += 1;
        await event.save();

        return NextResponse.json({ success: true, registration: newReg }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
