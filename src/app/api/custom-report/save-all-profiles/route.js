import {connectToDb} from "@/app/api/mongo";
import {NextResponse} from "next/server";
import {CustomReportTable} from "@/lib/models/CustomReportTable";
import {CustomReportProfile} from "@/lib/models/CustomReportProfile";
import fs from 'fs/promises'
import path from "path";

export const POST = async (req) => {
    await connectToDb()
    const body = await req.json()
    const { user_id, profiles } = body
    console.log(profiles)
    try {
        const allProfileIds = profiles.map(({id}) => id)
        const allDbProfiles = (await CustomReportProfile.find({
            USER_ID: user_id,
        }))
        const notInDbProfileIds = allProfileIds.filter(id => !allDbProfiles.includes(id))
        const deletedProfiles = allDbProfiles.filter(id => !allProfileIds.includes(id))
        const exceptProfileIds = profiles.filter(({customReportTables}) => !customReportTables).map(({id}) => id)
        const allTableIds = profiles.map(({customReportTables}) => customReportTables?.map(({id}) => id)).filter(id => id).flat()
        const allDbTableIds = allDbProfiles.map(({custom_report_table_ids}) => custom_report_table_ids.map(id => id.toString())).flat()
        const inDbTableIds = allTableIds.filter(id => allDbTableIds.includes(id))
        const notInDbTableIds = allTableIds.filter(id => !allDbTableIds.includes(id))
        const deletedTableIds = allDbTableIds.filter(id => !allTableIds.includes(id))
        const exceptTableIds = allDbProfiles.filter(({_id}) => exceptProfileIds.includes(_id.toString())).map(({custom_report_table_ids}) => custom_report_table_ids.map(id=>id.toString())).flat()
        console.log({allProfileIds, allDbProfiles, notInDbProfileIds, deletedProfiles, exceptProfileIds, allTableIds, allDbTableIds, inDbTableIds, notInDbTableIds, deletedTableIds, exceptTableIds})
        const {insertedIds} = await CustomReportTable.bulkWrite([
            {
                deleteMany: {
                    filter: {
                        _id: {
                            $in: deletedTableIds.filter(id => !exceptTableIds.includes(id)),
                        },
                    },
                },
            },
            ...profiles.map(({customReportTables}) => (
                customReportTables?.map(({id, cells, cols_width, rows_height, position}) => (
                    inDbTableIds.includes(id) ? {
                        updateOne: {
                            filter: {
                                _id: id,
                            },
                            update: {
                                $set: {
                                    cells,
                                    cols_width,
                                    rows_height,
                                    position,
                                } ,
                            },
                        },
                    } : notInDbTableIds.includes(id) ? {
                        insertOne: {
                            document: {
                                cells,
                                cols_width,
                                rows_height,
                                position,
                            }
                        },
                    } : undefined
                )
            ))).filter(pipeline => pipeline).flat(),
        ])
        const notInDbTableWithNewIds = notInDbTableIds.map((s, index) => ({
            old_id: s,
            new_id: Object.values(insertedIds).map(id=>id.toString())[index],
        }))
        const profilesWithNewTableIds = profiles.filter(({id}) => !exceptProfileIds.includes(id)).map((profile) => ({
            ...profile,
            customReportTables: profile.customReportTables?.map(table => ({
                ...table,
                ...(()=> {
                    const tableWithNewId = notInDbTableWithNewIds.find(({old_id}) => old_id === table.id)
                    if(tableWithNewId){
                        return {
                            id: tableWithNewId.new_id,
                        }
                    }
                })()
            }))
        }))
        const { upsertedIds } = await CustomReportProfile.bulkWrite([
            {
                deleteMany: {
                    filter: {
                        USER_ID: user_id,
                        _id: {
                            $in: deletedProfiles.filter(({_id}) => !exceptProfileIds.includes(_id.toString())),
                        },
                    },
                },
            },
            ...profilesWithNewTableIds.map((profile) => ({
                updateOne: {
                    filter: {
                        _id: profile.id,
                    },
                    update: {
                        $set: {
                            USER_ID: user_id,
                            name: profile.name,
                            custom_report_table_ids: profile.customReportTables.map(({id}) => id),
                            width: profile.width,
                            height: profile.height,
                        },
                    },
                    upsert: true,
                }
            }))
        ])

        // clean up deleted table that store images
        const fsPath = path.join("C:", "ePM_CustomReport")
        await Promise.all(deletedTableIds.map(async (table_id) => {
            const dir = path.join(fsPath, "table_assets", "images", table_id);
            await fs.rm(dir, { recursive: true, force: true })
        }))
        const tableIdsInDeletedProfiles = deletedProfiles.map(({custom_report_table_ids}) => custom_report_table_ids.toString()).flat()
        await Promise.all(tableIdsInDeletedProfiles.map(async (table_id) => {
            const dir = path.join(fsPath, "table_assets", "images", table_id);
            await fs.rm(dir, { recursive: true, force: true })
        }))
        return NextResponse.json({
            table_ids_changed: notInDbTableWithNewIds.map(({old_id, new_id}) => ({
                old_id,
                new_id
            })),
            profile_ids_changed: notInDbProfileIds.filter((({id}) => exceptProfileIds.includes(id))).map((old_id, index) => ({
                old_id: old_id,
                new_id: Object.values(upsertedIds).map(id=>id.toString())[index],
            })),
            status: 200,
        });
    } catch (err) {
        return NextResponse.json({
            status: 500,
            file: __filename,
            error: err.message,
        });
    }
};
