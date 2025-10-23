import Swal from "sweetalert2";

const saveAllProfiles = async ({
    user_id,
    profiles,
    setCustomReportProfiles,
    allTableWithImages,
}) => {
    Swal.fire({
        title: 'Saving All Profiles...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading()
        },
    })
    const response = await fetch("/api/custom-report/save-all-profiles", {
        method: "POST",
        body: JSON.stringify({
            user_id,
            profiles,
        })
    })
    if(response.ok) {
        const { profile_ids_changed, table_ids_changed, status, error } = await response.json()
        if(status === 200) {
            setCustomReportProfiles(profiles => profiles.map(profile => {
                const profileIdChanged = profile_ids_changed.find(({old_id}) => old_id === profile.id)
                return {
                    ...profile,
                    ...(profileIdChanged && {id: profileIdChanged.new_id}),
                    ...(profile.customReportTables && {
                        customReportTables: profile.customReportTables.map(table => {
                            const tableIdChanged = table_ids_changed.find(({old_id}) => old_id === table.id)
                            return {
                                ...table,
                                ...(tableIdChanged && {id: tableIdChanged.new_id}),
                            }
                        })
                    })
                }
            }))
            Swal.fire({
                title: 'Saving All Of Images...',
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                    Swal.showLoading()
                },
            })

            const allTableWithImageWithNewIds = allTableWithImages.map((table) => ({
                ...table,
                id: table_ids_changed.find(({old_id}) => old_id === table.id)?.new_id || table.id,
            }))
            const saveImagesSuccess = await Promise.all(allTableWithImageWithNewIds.map(async (table) => {
                const formData = new FormData();
                table.images.forEach(image => {
                    formData.append(image.id, image.blob);
                })
                const response = await fetch(`/api/custom-report/save-images/${table.id}`, {
                    method: "POST",
                    body: formData,
                })
                return response.ok;
            }))
            if(saveImagesSuccess){
                Swal.fire({
                    icon: 'success',
                    title: 'All Profiles Saved Successfully',
                    didOpen: () => {
                        Swal.hideLoading()
                    }
                })
                return true
            }
            else {
                Swal.fire({
                    icon: 'error',
                    title: "Failed to Save All Of Images",
                })
                return true
            }
        }
        else {
            Swal.fire({
                icon: 'error',
                title: error,
            })
            return true
        }
    }
    else {
        Swal.fire({
            icon: 'error',
            title: "Failed to Save All Profiles",
        })
        return true
    }

}

export default saveAllProfiles