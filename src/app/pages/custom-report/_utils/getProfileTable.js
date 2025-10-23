const getProfileTable = async ({
    profile_id,
    setCustomReportProfiles,
}) => {
    const response = await fetch(`/api/custom-report/get-profile-table`, {
        method: 'POST',
        body: JSON.stringify({
            profile_id,
        })
    })
    if (response.ok) {
        const { profile_tables, status } = await response.json()
        const eachTableWithImageIds = profile_tables.map(table => ({
            id: table.id,
            image_ids: [... new Set(table.cells.map(row => row.map(cell => cell.image_id)).flat().filter(id =>id))]
        }))
        const eachTableWithImages = await Promise.all(eachTableWithImageIds.map(async ({id, image_ids}) => ({
            id,
            images: await Promise.all(image_ids.map(async image_id => {
                const response = await fetch(`/api/custom-report/get-image/${id}/${image_id}`)
                if (response.ok) {
                    const blob = await response.blob()
                    return {
                        id: image_id,
                        blob,
                        path: URL.createObjectURL(blob),
                    }
                }
            }))
        })))
        const profileTablesWithImages = profile_tables.map(table => ({
            ...table,
            cells: table.cells.map(row => row.map((cell) => ({
                ...cell,
                ...(cell.image_id && ({
                    image: eachTableWithImages.find(({id}) => id === table.id)?.images.find(({id}) => id === cell.image_id),
                }))
            })))
        }))
        if(status === 200) {
            setCustomReportProfiles(profiles => profiles.map(profile => ({
                ...profile,
                ...(profile.id === profile_id && {
                    customReportTables: profileTablesWithImages,
                })
            })))
            return true
        }
        else {
            return true
        }
    }
    else {
        return true
    }
}

export default getProfileTable