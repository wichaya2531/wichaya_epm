import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import mongoose from "mongoose";

const createFirstTable = async ({
    customReportProfiles,
    setCustomReportProfiles,
    currentCustomReportProfileId,
}) => {
    const reactSwal = withReactContent(Swal)
    const value = await reactSwal.fire({
        title: 'Create New Table',
        html: (
            <div
                className="flex gap-4 items-center"
            >
                <div
                    className="flex flex-col w-52"
                >
                    <label>
                        Number of Rows
                    </label>
                    <input
                        id="create-table-rows"
                        type="number"
                        min={1}
                        defaultValue={5}
                        placeholder="Rows"
                        className="swal2-input"
                    />
                </div>
                <div
                    className="flex flex-col w-52"
                >
                    <label>
                        Number of Columns
                    </label>
                    <input
                        id="create-table-columns"
                        type="number"
                        min={1}
                        defaultValue={5}
                        placeholder="Columns"
                        className="swal2-input"
                    />
                </div>
            </div>
        ),
        preConfirm: () => {
            const rows = document.getElementById("create-table-rows").value;
            const columns = document.getElementById("create-table-columns").value;
            if (!rows || !columns) {
                Swal.showValidationMessage("Please fill in all fields");
            }
            else if (isNaN(rows) || isNaN(columns)) {
                Swal.showValidationMessage("Please enter valid numbers for rows and columns");
            }
            else if (rows < 1 || columns < 1) {
                Swal.showValidationMessage("Rows and columns must be at least 1");
            }
            else {
                return { rows, columns };
            }

        },
        showCancelButton: true,
    })
    if(value.isConfirmed) {
        const { rows, columns } = value.value;
        const generatedObjId = (() => {
            const objId = new mongoose.Types.ObjectId()
            if(customReportProfiles.find(({id}) => id === currentCustomReportProfileId).customReportTables.some(({id}) => id === objId.toString())) {
                return generatedObjId()
            }
            else {
                return objId.toString()
            }
        })()
        const newTable = {
            id: generatedObjId,
            cells: Array.from({ length: rows }, () => Array.from({ length: columns }).fill({
                value: ""
            })),
            cols_width: Array.from({ length: columns }).fill(50),
            rows_height: Array.from({ length: rows }).fill(25),
            merged_cells: [],
            position: {
                x: 0,
                y: 0,
            },
        }
        setCustomReportProfiles(js => js.map(
            j => (
                j.id === currentCustomReportProfileId ? {
                    ...j,
                    customReportTables: [
                        ...j.customReportTables,
                        newTable,
                    ]
                } : j
            )
        ))
    }
}

export default createFirstTable
