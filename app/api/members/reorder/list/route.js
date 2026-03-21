import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Member from '@/lib/models/Member';

export async function PUT(request) {
    try {
        await connectDB();
        const { order } = await request.json();
        
        if (!Array.isArray(order)) {
            return NextResponse.json({ error: 'Order must be an array of IDs' }, { status: 400 });
        }

        const bulkOps = order.map((id, index) => ({
            updateOne: {
                filter: { id },
                update: { orderIndex: index }
            }
        }));

        await Member.bulkWrite(bulkOps);
        const members = await Member.find().sort({ orderIndex: 1, createdAt: 1 });
        
        return NextResponse.json(members);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
