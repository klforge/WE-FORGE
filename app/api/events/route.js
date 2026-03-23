import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Event from '@/lib/models/Event';
import { saveFile } from '@/lib/uploadHelper';
import path from 'path';

const UPLOAD_DIR = path.resolve(process.cwd(), 'public/uploads/events');
const toSlug = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const parseArray = (str) => {
    if (!str) return [];
    try { return JSON.parse(str); } 
    catch { return str.split(',').map(s => s.trim()).filter(Boolean); }
};

const checkStatus = async (events) => {
    const now = new Date();
    let updated = false;
    for (const e of events) {
        if (e.status !== 'ended' && new Date(e.endTime || e.eventDate) < now) {
            e.status = 'ended';
            await e.save();
            updated = true;
        }
    }
    return updated;
};

export async function GET() {
    try {
        await connectDB();
        let events = await Event.find().sort({ eventDate: 1 });
        await checkStatus(events);
        return NextResponse.json(events);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectDB();
        const formData = await request.formData();

        const title = formData.get('title');
        const description = formData.get('description');
        const type = formData.get('type');
        const points = formData.get('points');
        const slots = formData.get('slots');
        const startTime = formData.get('startTime');
        const endTime = formData.get('endTime');
        const registrationDeadline = formData.get('registrationDeadline');
        const venueRaw = formData.get('venue');
        const locationRaw = formData.get('location');
        const status = formData.get('status');
        const accessType = formData.get('accessType') || 'public';
        const allowedDomains = parseArray(formData.get('allowedDomains'));
        const allowedMembers = parseArray(formData.get('allowedMembers'));
        
        const rawRoles = formData.get('roles');
        const roles = rawRoles ? parseArray(rawRoles) : ['Participant', 'Volunteer', 'Organizer'];
        
        const isRegistrationOpen = formData.get('isRegistrationOpen') !== 'false';
        const eventDate = formData.get('eventDate');

        if (!title || !startTime) return NextResponse.json({ error: 'Title and start time are required' }, { status: 400 });

        const dateStr = (eventDate || startTime).split('T')[0];
        const id = `${toSlug(title)}-${dateStr}`;
        let posterUrl = '';
        const photoFile = formData.get('poster');

        if (photoFile && photoFile.size > 0) {
            const buffer = await photoFile.arrayBuffer();
            const slug = toSlug(title);
            const ext = photoFile.type === 'image/png' ? 'png' : photoFile.type === 'image/webp' ? 'webp' : 'jpg';
            const filename = `${slug}-${id}.${ext}`;
            posterUrl = await saveFile(buffer, photoFile.type, 'events', UPLOAD_DIR, filename);
        }

        const newEvent = new Event({
            id,
            title: title.trim(),
            description: description?.trim() || '',
            type: type?.trim() || '',
            points: Number(points) || 0,
            slots: Number(slots) || 50,
            startTime,
            endTime,
            eventDate: eventDate || startTime,
            registrationDeadline: registrationDeadline || startTime,
            venue: (venueRaw || locationRaw || '').trim(),
            status: status || 'upcoming',
            posterUrl,
            accessType,
            allowedDomains,
            allowedMembers,
            roles,
            isRegistrationOpen
        });

        await newEvent.save();
        return NextResponse.json(newEvent, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
