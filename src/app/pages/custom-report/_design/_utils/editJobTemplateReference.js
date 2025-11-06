const editJobTemplateReference = ({
    draggingStartCellValue,
    selectedCellsValue,
    tableIndex,
    setDraggingStartCells,
    setSelectedCells,
    setTableEditingIndex,
    setShowEditReferenceDialog,
    currentCustomReportProfile,
    jobTemplates,
    setSelectedJobTemplateId,
    setSelectedJobItemTemplateId,
    setSelectedJobItemTemplateExpectedValueIndex,
    setSelectedJobItemTemplateDay,
    setSelectedJobItemTemplateDayShiftIndex,
}) => {
    setDraggingStartCells(draggingStartCellValue)
    setSelectedCells(selectedCellsValue)
    setTableEditingIndex(tableIndex)
    setShowEditReferenceDialog(true)
    const { job_template } = currentCustomReportProfile.customReportTables[tableIndex]?.cells[draggingStartCellValue.y][draggingStartCellValue.x]
    setSelectedJobTemplateId(
        job_template?.id || jobTemplates[0].id
    )
    setSelectedJobItemTemplateId(
        job_template?.job_item_template.id || jobTemplates[0].job_item_templates[0].id
    )
    setSelectedJobItemTemplateExpectedValueIndex(
        job_template?.job_item_template.expected_value_index || 0
    )
    setSelectedJobItemTemplateDay(
        job_template?.job_item_template.time.day || 1
    )
    setSelectedJobItemTemplateDayShiftIndex(
        job_template?.job_item_template.time.shift_index || 2
    )
}

export default editJobTemplateReference
