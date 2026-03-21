import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Project from '@/lib/models/Project';
import { saveFile, deleteFile } from '@/lib/uploadHelper';
import path from 'path';

const UPLOAD_DIR = path.resolve(process.cwd(), 'public/uploads/projects');
const toSlug = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export async function PUT(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const formData = await request.formData();
        
        const project = await Project.findOne({ id });
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        if (formData.has('name')) project.name = formData.get('name').trim();
        if (formData.has('description')) project.description = formData.get('description').trim();
        if (formData.has('github')) project.github = formData.get('github').trim();
        if (formData.has('demo')) project.demo = formData.get('demo').trim();
        if (formData.has('technologies')) project.technologies = JSON.parse(formData.get('technologies'));

        const photoFile = formData.get('image');
        if (photoFile && photoFile.size > 0) {
            await deleteFile(project.imageUrl, UPLOAD_DIR);
            const slug = toSlug(project.name);
            const ext = photoFile.type === 'image/png' ? 'png' : photoFile.type === 'image/webp' ? 'webp' : 'jpg';
            const filename = `${slug}-${project.id}.${ext}`;
            const buffer = await photoFile.arrayBuffer();
            project.imageUrl = await saveFile(buffer, photoFile.type, 'projects', UPLOAD_DIR, filename);
        }

        await project.save();
        return NextResponse.json(project);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const project = await Project.findOne({ id });
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        await deleteFile(project.imageUrl, UPLOAD_DIR);
        await Project.findOneAndDelete({ id });
        
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
