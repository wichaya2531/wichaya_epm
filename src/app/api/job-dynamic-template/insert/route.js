import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";
import { JobDynamicTemplate } from "@/lib/models/JobDynamicTemplate";
import mongoose from "mongoose";
import { emptyCell } from "@/app/pages/report/dynamic/_state-managment/manage";
import { JobDynamic } from "@/lib/models/JobDynamic";

export const POST = async (req) => {
    const body = await req.json()
    const { user_id, name, rows, cols } = body
    try {
        const nameExisted = await JobDynamic.findOne({
            name,
            USER_ID: user_id
        })
        if(nameExisted) {
            return NextResponse.json({
                status: 500,
                file: __filename,
                error: `${name} is already existed`,
            });
        }
        else {
            const data = Array.from({ length: rows }, (
                _,
                rowIndex,
            ) => Array.from({ length: cols }, (
                _,
                colIndex,
            ) => ""))
            const rowsArray = Array.from({ length: rows }, _ => ({}))
            const columnsArray = Array.from({ length: cols }, _ => ({}))
            const insertedSpreadsheet = await JobDynamicTemplate.insertOne({
                data,
                columns: columnsArray,
                rows: rowsArray,
                minDimensions: [cols, rows],
                style: {}
            }, {
                id: "$_id",
            })
            const { id } = insertedSpreadsheet
            if(id) {
                const insertedSpreadsheetInfo = await JobDynamic.insertOne({
                    USER_ID: user_id,
                    spreadsheet: id.toString(),
                    name
                },{
                    spreadsheet_id: "_id"
                })
                const { spreadsheet_id } = insertedSpreadsheetInfo
                if(insertedSpreadsheetInfo) {
                    return NextResponse.json({
                        status: 200,
                        spreadsheet_id,
                        data,
                        columns: columnsArray,
                        rows: rowsArray,
                    });
                }
            }
            return NextResponse.json({
                status: 503,
                error: "Failed to Insert"
            })
        }

        

        
        
    } catch (err) {
        const { code } = err
        if(code === 11000) {
            return NextResponse.json({
                status: 500,
                file: __filename,
                error: `${name} is already existed`,
            });
        }
        else {
        return NextResponse.json({
            status: 500,
            file: __filename,
            error: err.message,
        });
        }
    }
};
