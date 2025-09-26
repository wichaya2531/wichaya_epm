import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"

const editSheetPrompt = async ({
    existedNames = [],
    sheetName,
}) => {
    const reactSwal = withReactContent(Swal)
    const { value } = await reactSwal.fire({
        title: `Edit ${sheetName}`,
        icon: 'question',
        html: (
            <div className="flex flex-col justify-center">
                <div>
                    <input id="prompt-sheet-name" type="text" className="swal2-input" placeholder="Name" />
                </div>
            </div>
        ),
        focusConfirm: false,
        confirmButtonText: 'Confirm',
            preConfirm: () => {
                const sheetNameInput = document.getElementById('prompt-sheet-name').value
                if (sheetNameInput.length < 1) {
                    Swal.showValidationMessage('Fill the name')
                    return
                }
                if (existedNames.some(s=>s===sheetNameInput)) {
                    Swal.showValidationMessage('Existed Name')
                    return
                    
                }
                return sheetNameInput
        }
    })
    return value
}

export default editSheetPrompt