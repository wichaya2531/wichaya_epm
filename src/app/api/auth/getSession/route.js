import { getSession, login } from "@/lib/utils/utils.js";
import { NextResponse } from 'next/server';

import mongoose from "mongoose";
const db_url = process.env.MONGODB_URI;

const connection = {};

const connectToDb = async () => {
  console.log("Connecting to DB A");
  try {
    if (connection.isConnected) {
      console.log("Using existing connection");
      return;
    }
    const db = await mongoose.connect(db_url);
    connection.isConnected = db.connections[0].readyState;
    console.log("New connection");
  } catch (error) {
    console.log(error);
    
  }
};
export const GET = async (req, res) => {
    const session = await getSession();
   
    try {
        if (!session) {
            return NextResponse.json({ message: "User not logged in", file: __filename });
        }
        return NextResponse.json({ message: "User logged in", session });
        
    } catch (err) {
        return NextResponse.json({ message: "Get session failed", file: __filename, error: err.message });
    }
};
