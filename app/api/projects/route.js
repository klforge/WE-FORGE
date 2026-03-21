import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/lib/models/Project';
import { saveFile } from '@/lib/uploadHelper';
import path from 'path';

const UPLOAD_DIR = path.resolve(process.cwd(), 'public/uploads/projects');
const toSlug = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export async function GET() {
    try {
        await connectDB();
        const projects = await Project.find().sort({ createdAt: -1 });
        return NextResponse.json(projects);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectDB();
        const formData = await request.formData();

        const name = formData.get('name');
        const description = formData.get('description');
        const github = formData.get('github');
        const demo = formData.get('demo');
        const technologiesRaw = formData.get('technologies');

        if (!name) return NextResponse.json({ error: 'Project name is required' }, { status: 400 });

        const id = String(Date.now());
        let imageUrl = '';
        const photoFile = formData.get('image');

        if (photoFile && photoFile.size > 0) {
            const buffer = await photoFile.arrayBuffer();
            const slug = toSlug(name);
            const ext = photoFile.type === 'image/png' ? 'png' : photoFile.type === 'image/webp' ? 'webp' : 'jpg';
            const filename = `${slug}-${id}.${ext}`;
            imageUrl = await saveFile(buffer, photoFile.type, 'projects', UPLOAD_DIR, filename);
        }

        const newProject = new Project({
            id,
            name: name.trim(),
            description: description?.trim() || '',
            github: github?.trim() || '',
            demo: demo?.trim() || '',
            technologies: technologiesRaw ? JSON.parse(technologiesRaw) : [],
            imageUrl
        });

        await newProject.save();
        return NextResponse.json(newProject, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
