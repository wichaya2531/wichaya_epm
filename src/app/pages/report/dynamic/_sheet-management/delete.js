import withReactContent from "sweetalert2-react-content"
import Swal from "sweetalert2"

const deleteSheetPrompt = async ({
    sheetName,
}) => {
    const reactSwal = withReactContent(Swal)
    const { value } = await reactSwal.fire({
        title: <>Are you sure to delete <b>{sheetName}</b></>,
        icon: 'warning',
        focusConfirm: true,
        focusCancel: false,
        showCancelButton: true,
        confirmButtonText: 'Confirm',
        cancelButtonText: "Cancel",
    })
    return value
}

export default deleteSheetPrompt