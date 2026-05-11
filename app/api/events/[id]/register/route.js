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
        if (event.accessType === 'domain' || event.accessType === 'private') {
            // We need to verify against the Member collection for domain/private access
            const { default: Member } = await import('@/lib/models/Member');
            const memberDoc = await Member.findOne({ rollNumber: new RegExp(`^${rollNumber.trim()}$`, 'i') });
            
            if (!memberDoc) {
                return NextResponse.json({ error: 'You must be a registered KLFORGE member to access this event' }, { status: 403 });
            }

            if (event.accessType === 'domain') {
                const userClubDomain = memberDoc.domain;
                if (!event.allowedDomains.includes(userClubDomain)) {
                    return NextResponse.json({ error: `This event is restricted to: ${event.allowedDomains.join(', ')}` }, { status: 403 });
                }
            } else if (event.accessType === 'private') {
                if (!event.allowedMembers.includes(rollNumber.trim()) && !event.allowedMembers.includes(Number(rollNumber.trim()))) {
                    return NextResponse.json({ error: 'You are not on the guest list for this private event' }, { status: 403 });
                }
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

        const duplicate = await Registration.findOne({ eventId: event.id, rollNumber: new RegExp(`^${rollNumber.trim()}$`, 'i') });
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
