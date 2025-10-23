import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const deleteTable = async ({
    setCustomReportProfiles,
    currentCustomReportProfileId,
    tableIndex,
}) => {
    const reactSwal = withReactContent(Swal)
    const value = await reactSwal.fire({
        title: 'Delete Table',
        html: (
            <>
                Are you sure you want to delete this table?
            </>
        ),
        showCancelButton: true,
    })
    if(value.isConfirmed) {
        setCustomReportProfiles(js => js.map(
            j => (
                j.id === currentCustomReportProfileId ? {
                    ...j,
                    customReportTables: j.customReportTables.filter((_, index) => index !== tableIndex),
                } : j
            )
        ))
    }
}

export default deleteTable
