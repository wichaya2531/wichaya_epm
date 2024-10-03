import next from "next";
import { NextResponse } from "next/server";
//  post data to elasticsearch
export async function GET(/*req*/){
             console.log("GET push data to sql")
             try {
                //const data = await req.json();
                const response = await fetch('http://172.17.70.173/receiver/epm_receiver.php?doc=1234&line=9305A');
                //console.log("response",response);
                 return NextResponse.json({ status: 200, result: response });
              } catch (error) {
                 return NextResponse.json({ status: 500, message: error });
              }
};