import next from "next";
import { NextResponse } from "next/server";
//  post data to elasticsearch
export async function POST(req){
             try {
                const data = await req.json();
                const response = await fetch('http://10.171.104.22:9200/epm/_doc/2', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(data),
                });
                return NextResponse.json({ status: 200, result: response });
              } catch (error) {
                return NextResponse.json({ status: 500, message: error });
              }
};