import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
    try {
        const { password } = await request.json();
        const hash = process.env.ADMIN_PASSWORD_HASH;
        const secret = process.env.JWT_SECRET;

        if (!hash || !secret) {
            return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
        }

        const isValid = await bcrypt.compare(password, hash);
        if (!isValid) {
            return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
        }

        const token = jwt.sign({ admin: true }, secret, { expiresIn: '7d' });

        const response = NextResponse.json({ success: true });
        response.cookies.set('adminToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/'
        });
        return response;
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
