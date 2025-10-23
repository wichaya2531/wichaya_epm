import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const editProfileName = async ({
    option,
    existedNames,
    setCustomReportProfiles,
}) => {
    const reactSwal = withReactContent(Swal)
    const {value} = await reactSwal.fire({
        title: `Edit ${option.label}`,
        icon: 'question',
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
        setCustomReportProfiles(profiles => (
            profiles.map(
                profile => (
                    profile.id === option.value
                ) ? {
                    ...profile,
                    name: value,
                } : profile
            )
        ))
    }
}

export default editProfileName;