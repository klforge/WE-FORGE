import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import connectDB from '@/lib/db';
import Member from '@/lib/models/Member';
import { saveFile, deleteFile } from '@/lib/uploadHelper';
import path from 'path';

const UPLOAD_DIR = path.resolve(process.cwd(), 'public/uploads/members');
const nameToSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export async function PUT(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const member = await Member.findOne({ id });
        if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

        const formData = await request.formData();
        
        if (formData.has('name')) member.name = formData.get('name');
        if (formData.has('role')) member.role = formData.get('role');
        if (formData.has('domain')) member.domain = formData.get('domain');
        if (formData.has('rollNumber')) member.rollNumber = formData.get('rollNumber');
        if (formData.has('department')) member.department = formData.get('department');
        if (formData.has('email')) member.email = formData.get('email');
        if (formData.has('description')) member.description = formData.get('description');
        if (formData.has('bio')) member.bio = formData.get('bio');
        if (formData.has('skills')) member.skills = JSON.parse(formData.get('skills'));
        if (formData.has('telegram')) member.telegram = formData.get('telegram');
        if (formData.has('github')) member.github = formData.get('github');
        if (formData.has('linkedin')) member.linkedin = formData.get('linkedin');
        if (formData.has('status')) member.status = formData.get('status');
        if (formData.has('isSuspended')) member.isSuspended = formData.get('isSuspended') === 'true';

        const photoFile = formData.get('photo');
        if (photoFile && photoFile.size > 0) {
            await deleteFile(member.photoUrl, UPLOAD_DIR);
            const slug = nameToSlug(member.name);
            const buffer = await photoFile.arrayBuffer();
            const ext = photoFile.type === 'image/png' ? 'png' : photoFile.type === 'image/webp' ? 'webp' : 'jpg';
            const filename = `${slug}.${ext}`;
            member.photoUrl = await saveFile(buffer, photoFile.type, 'members', UPLOAD_DIR, filename);
        }

        await member.save();
        return NextResponse.json(member);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const member = await Member.findOneAndDelete({ id });
        if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

        await deleteFile(member.photoUrl, UPLOAD_DIR);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
