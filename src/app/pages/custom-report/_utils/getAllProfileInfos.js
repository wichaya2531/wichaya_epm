const getAllProfileInfos = async ({
    user_id,
    setCustomReportProfiles,
}) => {
    const response = await fetch(`/api/custom-report/get-all-profile-infos`, {
        method: "POST",
        body: JSON.stringify({
            user_id,
        })
    })
    if (response.ok) {
        const { profile_infos, status } = await response.json()
        if (status === 200) {
            setCustomReportProfiles(profile_infos)
        }
    }
}

export default getAllProfileInfos