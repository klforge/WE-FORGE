import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Event from '@/lib/models/Event';
import { saveFile, deleteFile } from '@/lib/uploadHelper';
import path from 'path';

const UPLOAD_DIR = path.resolve(process.cwd(), 'public/uploads/events');
const toSlug = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export async function GET(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const event = await Event.findOne({ id });
        if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        return NextResponse.json(event);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const event = await Event.findOne({ id });
        if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

        const formData = await request.formData();

        if (formData.has('title')) event.title = formData.get('title').trim();
        if (formData.has('description')) event.description = formData.get('description').trim();
        if (formData.has('type')) event.type = formData.get('type').trim();
        if (formData.has('points')) event.points = Number(formData.get('points'));
        if (formData.has('startTime')) event.startTime = formData.get('startTime');
        if (formData.has('endTime')) event.endTime = formData.get('endTime');
        if (formData.has('slots')) event.slots = Number(formData.get('slots'));
        if (formData.has('registrationDeadline')) event.registrationDeadline = formData.get('registrationDeadline');
        if (formData.has('eventDate')) event.eventDate = formData.get('eventDate');
        if (formData.has('venue')) event.venue = formData.get('venue').trim();
        else if (formData.has('location')) event.venue = formData.get('location').trim();
        if (formData.has('accessType')) event.accessType = formData.get('accessType');
        if (formData.has('allowedDomains')) event.allowedDomains = JSON.parse(formData.get('allowedDomains'));
        if (formData.has('allowedMembers')) event.allowedMembers = JSON.parse(formData.get('allowedMembers'));
        if (formData.has('roles')) event.roles = JSON.parse(formData.get('roles'));
        if (formData.has('isRegistrationOpen')) event.isRegistrationOpen = formData.get('isRegistrationOpen') !== 'false';

        const photoFile = formData.get('poster');
        if (photoFile && photoFile.size > 0) {
            await deleteFile(event.posterUrl, UPLOAD_DIR);
            const buffer = await photoFile.arrayBuffer();
            const slug = toSlug(event.title);
            const ext = photoFile.type === 'image/png' ? 'png' : photoFile.type === 'image/webp' ? 'webp' : 'jpg';
            const filename = `${slug}-${event.id}.${ext}`;
            event.posterUrl = await saveFile(buffer, photoFile.type, 'events', UPLOAD_DIR, filename);
        }

        await event.save();
        return NextResponse.json(event);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const event = await Event.findOneAndDelete({ id });
        if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

        await deleteFile(event.posterUrl, UPLOAD_DIR);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
