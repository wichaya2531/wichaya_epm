import { NextResponse } from "next/server";
import { connectToDb } from "@/app/api/mongo/index.js";
import { JobDynamicTemplate } from "@/lib/models/JobDynamicTemplate";
import { JobDynamic } from "@/lib/models/JobDynamic";
import { Job } from "@/lib/models/Job";
import mongoose from "mongoose";

export const POST = async (req) => {
    await connectToDb()
    const body = await req.json()
    const { user_id, spreadsheets } = body
    try {
        const allSpreadsheetIds = await JobDynamic.find({
            USER_ID: user_id,
        }, {
            spreadsheet_id: 1,
        }).lean()
        const missingSpreadsheets = spreadsheets.filter(({id}) => !allSpreadsheetIds.map(s=>s.spreadsheet_id.toString()).includes(id))
        const existingSpreadsheets = spreadsheets.filter(({id}) => allSpreadsheetIds.map(s=>s.spreadsheet_id.toString()).includes(id))
        // const newSpreadsheetInserts = await JobDynamicTemplate.insertMany({

        // })

        // })
        const { insertedIds } = await JobDynamicTemplate.bulkWrite([
            {
                deleteMany: {
                    filter: {
                        _id: {
                            $in: missingSpreadsheets.map(({id})=>id),
                        },
                    },
                },
            },
            ...existingSpreadsheets.filter(({is_fetched}) => is_fetched).map(({id, cells, cols_width, rows_height}) => ({
                updateOne: {
                    filter: {
                        _id: id,
                    },
                    update: {
                        $set: {
                            cells,
                            cols_width,
                            rows_height,
                        } ,
                    },
                },
            })),
            ...missingSpreadsheets.map(({id, cells, cols_width, rows_height}) => ({
                insertOne: {
                    document: {
                        cells,
                        cols_width,
                        rows_height,
                    }
                },
            })),
        ])
        const missingSpreadsheetsWithNewIds = missingSpreadsheets.map((s, index) => ({
            ...s,
            new_id: Object.values(insertedIds).map(id=>id.toString())[index],
        }))
        await JobDynamic.bulkWrite([
            ...existingSpreadsheets.map(({id, name}) => ({
                updateOne: {
                    filter: {
                        USER_ID: user_id,
                        spreadsheet_id: id,
                    },
                    update: {
                        $set: {
                            name: name,
                        },
                    },
                    upsert: true,
                },
            })),
            ...missingSpreadsheetsWithNewIds.map(({id, name, new_id}) => ({
                updateOne: {
                    filter: {
                        USER_ID: user_id,
                        spreadsheet_id: id,
                    },
                    update: {
                        $set: {
                            spreadsheet_id: new_id,
                            name,
                        },
                    },
                    upsert: true,
                },
            }))
        ])
        // await JobDynamic.bulkWrite([
        //     {
        //         deleteMany: {
        //             filter: {
        //                 USER_ID: user_id,
        //                 spreadsheet_id: {
        //                     $in: missingSpreadsheet.map(({id})=>id)
        //                 }
        //             }
        //         }
        //     },
        // ])
    //     await JobDynamic.bulkWrite(
    //         spreadsheets.map(({id, name}) => ({
    //             updateOne: {
    //                 filter: {
    //                     USER_ID: user_id,
    //                     spreadsheet: id,
    //                 },
    //                 update: {
    //                     $set: {
    //                         name
    //                     }
    //                 },
    //                 upsert: true,
    //             }
    //         }))
    //     )
    //     const expectedDeletedDocs = await JobDynamic.find({
    //         USER_ID: user_id,
    //         spreadsheet: { $nin: spreadsheets.map(({id})=>id) }
    //     })
    //     const expectedDeletedIds = expectedDeletedDocs.map(doc=>doc.spreadsheet)
    //     await JobDynamic.deleteMany({
    //         spreadsheet: {
    //             $in: expectedDeletedIds
    //         },
    //     })
    //     await JobDynamicTemplate.deleteMany({
    //         _id: {
    //             $in: expectedDeletedIds
    //         },
    //     })
        return NextResponse.json({
            added_spreadsheets: missingSpreadsheetsWithNewIds.map(({id, new_id}) => ({id, new_id})),
            status: 200,
        });
    } catch (err) {
        console.log(err)
        return NextResponse.json({
            status: 500,
            file: __filename,
            error: err.message,
        });
    }
};
