import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import connectDB from '@/lib/db';
import Member from '@/lib/models/Member';
import { saveFile } from '@/lib/uploadHelper';
import path from 'path';

const UPLOAD_DIR = path.resolve(process.cwd(), 'public/uploads/members');

const nameToSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export async function GET() {
    try {
        await connectDB();
        const members = await Member.find().sort({ orderIndex: 1, createdAt: 1 });
        return NextResponse.json(members);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectDB();
        const formData = await request.formData();
        
        const name = formData.get('name');
        const role = formData.get('role');
        const domain = formData.get('domain');
        const rollNumber = formData.get('rollNumber');
        const department = formData.get('department');
        const email = formData.get('email');
        const description = formData.get('description');
        const bio = formData.get('bio');
        const skillsRaw = formData.get('skills');
        const telegram = formData.get('telegram');
        const github = formData.get('github');
        const linkedin = formData.get('linkedin');
        const status = formData.get('status');
        const photoFile = formData.get('photo');

        if (!name || !role || !rollNumber) {
            return NextResponse.json({ error: 'Name, role, and roll number are required' }, { status: 400 });
        }

        const slug = nameToSlug(name);
        const exists = await Member.findOne({ name: new RegExp(`^${name}$`, 'i') });
        if (exists) return NextResponse.json({ error: 'A member with this name already exists' }, { status: 409 });

        const count = await Member.countDocuments();
        const id = String(Date.now());
        let photoUrl = '';

        if (photoFile && photoFile.size > 0) {
            const buffer = await photoFile.arrayBuffer();
            const ext = photoFile.type === 'image/png' ? 'png' : photoFile.type === 'image/webp' ? 'webp' : 'jpg';
            const filename = `${slug}.${ext}`;
            photoUrl = await saveFile(buffer, photoFile.type, 'members', UPLOAD_DIR, filename);
        }

        const newMember = new Member({
            id, name, role,
            domain: domain || '',
            rollNumber,
            department: department || '',
            email: email || '',
            description: description || '',
            bio: bio || '',
            skills: skillsRaw ? JSON.parse(skillsRaw) : [],
            telegram: telegram || '',
            github: github || '',
            linkedin: linkedin || '',
            status: status || 'Online',
            photoUrl,
            orderIndex: count
        });

        await newMember.save();
        return NextResponse.json(newMember, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
