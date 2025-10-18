import Swal from "sweetalert2";

const newSheetPrompt = async ({
    spreadsheetsData
}) => {
    const { value } = await Swal.fire({
        title: 'New Sheet',
        html: `
        <div class="flex flex-col justify-center">
            <div class="flex justify-center">
                <div>
                    <div>
                        rows
                    </div>
                    <div>
                        <input id="prompt-sheet-rows" type="number" min="2" max="50" value="5" class="swal2-input" placeholder="Row">
                    </div>
                </div>
                <div>
                    <div>
                        Columns
                    </div>
                    <div>
                        <input id="prompt-sheet-cols" type="number" min="2" max="50" value="5" class="swal2-input" placeholder="Column">
                    </div>
                </div>
            </div>
            <div>
                <input id="prompt-sheet-name" type="text" class="swal2-input" placeholder="Name"/>
            </div>
        </div>
        `,
        focusConfirm: false,
        confirmButtonText: 'Confirm',
            preConfirm: () => {
            const rows = parseInt(document.getElementById('prompt-sheet-rows').value)
            const cols = parseInt(document.getElementById('prompt-sheet-cols').value)
            const sheetName = document.getElementById('prompt-sheet-name').value
            if (!rows || !cols) {
                Swal.showValidationMessage('Incorrect Input')
                return
            }
            if (rows <= 1 || cols <= 1) {
                Swal.showValidationMessage('Minimum rows and columns are 2')
                return
            }
            if (sheetName.length < 1) {
                Swal.showValidationMessage('Fill the name')
                return
            }
            if (spreadsheetsData.some(s=>s.name===sheetName)) {
                Swal.showValidationMessage('Existed Name')
                return
                
            }
            return { rows, cols, sheet_name: sheetName }
        }
    })
    return value
}

export default newSheetPrompt