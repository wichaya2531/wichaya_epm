import mongoose from "mongoose";

const connection = {};
const db_url = process.env.MONGODB_URL;

export const connectToDb = async () => {
  //console.log(db_url);
  //console.log("Connecting to DB B");
  try {
    if (connection.isConnected) {
      //console.log("Using existing connection");
      return;
    }
    const db = await mongoose.connect(db_url);
    connection.isConnected = db.connections[0].readyState;
    //console.log("New connection");
  } catch (error) {
    console.log(error);
  }
};
