import { NextResponse } from 'next/server.js';
export const GET = async (req, res) => {
 console.log(process.env.DEVELOPPER);
 return NextResponse.json({ status: 200, result: "Hello world" });
}