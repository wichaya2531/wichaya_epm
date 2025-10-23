const getJobTemplates = async ({
    user_id,
    setJobTemplates,
}) => {
    const response = await fetch("/api/custom-report/get-job-templates", {
        method: "POST",
        body: JSON.stringify({
            user_id,
        }),
    })
    if(response.ok){
        const { job_templates, status } = await response.json()
        if(status === 200){
            setJobTemplates(job_templates)
        }
    }
}

export default getJobTemplates