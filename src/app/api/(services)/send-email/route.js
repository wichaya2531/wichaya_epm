import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const POST = async (req, res) => {
    try {
        const { to, subject, text } = await req.json();
        const transporter = nodemailer.createTransport({
            host: 'mailrelay.wdc.com',
            port: 25,
            secure: false, // No authentication required
            tls: {
                rejectUnauthorized: false // Ignore expired certificates
            }
        });

        // Send mail with defined transport object
        let info = await transporter.sendMail({
            from: {
                name: 'Epm System',
                address: process.env.EMAIL_USER
            },
            to, // list of receivers
            subject, // Subject line
            text, // plain text body
        });


        return NextResponse.json({ status: 200, message: 'Email sent' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ status: 500, error: error.message });
    }
};
