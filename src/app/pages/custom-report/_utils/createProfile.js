import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import mongoose from "mongoose";

const createProfile = async ({
    existedNames,
    customReportProfiles,
    setCustomReportProfiles,
    currentCustomReportProfileId,
    setCurrentCustomReportProfileId,
}) => {
    const reactSwal = withReactContent(Swal)
    const {value} = await reactSwal.fire({
        title: `Create New Profile`,
        icon: 'info',
        html: (
            <div className="flex flex-col justify-center">
                <div>
                    <input id="prompt-sheet-name" type="text" className="swal2-input" placeholder="Name"/>
                </div>
            </div>
        ),
        focusConfirm: false,
        confirmButtonText: 'Confirm',
        showCancelButton: true,
        preConfirm: () => {
            const sheetNameInput = document.getElementById('prompt-sheet-name').value
            if (sheetNameInput.length < 1) {
                Swal.showValidationMessage('Fill the name')
                return
            }
            if (existedNames.some(s => s === sheetNameInput)) {
                Swal.showValidationMessage('Existed Name')
                return

            }
            return sheetNameInput
        }
    })
    if (value) {
        const generatedObjId = (() => {
            const objId = new mongoose.Types.ObjectId()
            if(customReportProfiles.some(({id}) => id === objId.toString())) {
                return generatedObjId()
            }
            else {
                return objId.toString()
            }
        })()
        setCustomReportProfiles(profiles => [
            ...profiles,
            {
                id: generatedObjId,
                name: value,
                customReportTables: [],
                width: 600,
                height: 600,
            }
        ])
        if(!currentCustomReportProfileId) {
            setCurrentCustomReportProfileId(generatedObjId)
        }
    }
}

export default createProfile