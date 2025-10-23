import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";

const deleteProfile = async ({
    option,
    setCustomReportProfiles,
    currentCustomReportProfileId,
    setCurrentCustomReportProfileId,
}) => {
    const reactSwal = withReactContent(Swal)
    const {value} = await reactSwal.fire({
        title: `Delete ${option.label}`,
        icon: 'warning',
        html: (
            <>
                Are you sure you want to delete {option.label}?
            </>
        ),
        focusConfirm: false,
        confirmButtonText: 'Confirm',
        preConfirm: () => {
            return true
        }
    })
    if (value) {
        setCustomReportProfiles(profiles => (
            profiles.filter(({id}) => id !== option.value)
        ))
        if(option.value === currentCustomReportProfileId) {
            setCurrentCustomReportProfileId(null)
        }
    }
}

export default deleteProfile;