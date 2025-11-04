import { useEffect, useMemo, useRef, useState } from "react"
import Spreadsheet from "../../../../../../spreadsheetjs-react";

const DynamicTemplatePosition = ({
    customReportProfiles,
    setCustomReportProfiles,
    currentCustomReportProfile,
}) => {
    const edgeThreshold = 25;
    const containerRef = useRef(null)
    const [resizingHeight, setResizingHeight] = useState(null)
    const [resizingWidth, setResizingWidth] = useState(null)
    const onMouseDownResizeWidthContainer = (e) => {
        const rect = e.target.getBoundingClientRect()
        if(e.clientX > rect.right - edgeThreshold && e.clientX <= rect.right) {
            e.preventDefault()
            setResizingWidth({
                startX: e.clientX,
                startWidth: currentCustomReportProfile.width,
            })
        }
    }
    const onMouseDownResizeHeightContainer = (e) => {
        const rect = e.target.getBoundingClientRect()
        if(e.clientY > rect.bottom - edgeThreshold && e.clientY <= rect.bottom) {
            e.preventDefault()
            setResizingHeight({
                startY: e.clientY,
                startHeight: currentCustomReportProfile.height,
            })
        }
    }
    const onMouseDownResizeBothContainer = (e) => {
        const rect = e.target.getBoundingClientRect()
        if(e.clientX > rect.right - edgeThreshold && e.clientX <= rect.right && e.clientY > rect.bottom - edgeThreshold && e.clientY <= rect.bottom) {
            e.preventDefault()
            setResizingWidth({
                startX: e.clientX,
                startWidth: currentCustomReportProfile.width,
            })
            setResizingHeight({
                startY: e.clientY,
                startHeight: currentCustomReportProfile.height,
            })
        }
    }

    const [currentPositionOfTables, setCurrentPositionOfTables] = useState(currentCustomReportProfile.customReportTables.map(() => null))
    const positionChanging = useMemo(() => currentPositionOfTables.findIndex(p => p !== null), [currentPositionOfTables])

    const onMouseDownTable = (e, index) => {
        e.preventDefault()
        if(containerRef.current.children[index].contains(e.target)) {
            setCurrentPositionOfTables(js => js.map((j, i) => i === index ? {
                client: {
                    x: e.clientX,
                    y: e.clientY,
                },
                actual: {
                    x: currentCustomReportProfile.customReportTables[index].position.x,
                    y: currentCustomReportProfile.customReportTables[index].position.y,
                }
            } : j))
        }
    }
    useEffect(() => {
        const onMouseMove = (e) => {
            e.preventDefault()
            if (resizingHeight) {
                const deltaY = e.clientY - resizingHeight.startY
                const newHeight = Math.max(50, resizingHeight.startHeight + deltaY)
                setCustomReportProfiles(profiles => profiles.map(profile => ({
                    ...profile,
                    ...(profile.id === currentCustomReportProfile.id && {
                        height: newHeight,
                    }),
                    customReportTables: profile.customReportTables.map((table, tableIndex) => ({
                        ...table,
                        position: {
                            ...table.position,
                            y: Math.max(
                                0,
                                Math.min(
                                    table.position.y,
                                    containerRef.current.clientHeight - containerRef.current.children[tableIndex].clientHeight
                                )
                            ),
                        }
                    }))
                })))
            }
            if (resizingWidth) {
                const deltaX = e.clientX - resizingWidth.startX
                const newWidth = Math.max(50, resizingWidth.startWidth + deltaX)
                setCustomReportProfiles(profiles => profiles.map(profile => ({
                    ...profile,
                    ...(profile.id === currentCustomReportProfile.id && {
                        width: newWidth,
                    }),
                    customReportTables: profile.customReportTables.map((table, tableIndex) => ({
                        ...table,
                        position: {
                            ...table.position,
                            x: Math.max(
                                0,
                                Math.min(
                                    table.position.x,
                                    containerRef.current.clientWidth - containerRef.current.children[tableIndex].clientWidth
                                )
                            ),
                        }
                    }))
                })))
            }
            if (positionChanging !== -1) {
                setCustomReportProfiles(profiles => profiles.map((profile, i) => ({
                    ...profile,
                    customReportTables: currentCustomReportProfile.id === profile.id ? [
                        ...currentCustomReportProfile.customReportTables.slice(0, positionChanging),
                        {
                            ...currentCustomReportProfile.customReportTables[positionChanging],
                            position: {
                                x: Math.max(0, Math.min(
                                    currentPositionOfTables[positionChanging].actual.x + e.clientX - currentPositionOfTables[positionChanging].client.x,
                                    containerRef.current.clientWidth - containerRef.current.children[positionChanging].clientWidth
                                )),
                                y: Math.max(0, Math.min(
                                    currentPositionOfTables[positionChanging].actual.y + e.clientY - currentPositionOfTables[positionChanging].client.y,
                                    containerRef.current.clientHeight - containerRef.current.children[positionChanging].clientHeight
                                )),
                            }
                        },
                        ...currentCustomReportProfile.customReportTables.slice(positionChanging + 1),
                    ] : profile.customReportTables
                })))
            }
        }
        const onMouseUp = (e) => {
            e.preventDefault()
            setResizingHeight(null)
            setResizingWidth(null)
            setCurrentPositionOfTables(tables => tables.map(() => null))
        }
        document.addEventListener("mousemove", onMouseMove)
        document.addEventListener("mouseup", onMouseUp)
        return () => {
            document.removeEventListener("mousemove", onMouseMove)
            document.removeEventListener("mouseup", onMouseUp)
        }
    }, [resizingHeight, resizingWidth, currentCustomReportProfile, currentPositionOfTables])

    return (
        <div
            className={"overflow-x-auto"}
        >
            <div className={"flex w-fit"}>
                <div
                    className="w-full flex border border-gray-300 bg-white relative"
                    ref={containerRef}
                    style={{
                        height: `${currentCustomReportProfile.height}px`,
                        width: `${currentCustomReportProfile.width}px`,
                    }}
                >
                    {currentCustomReportProfile.customReportTables.map(({cells, cols_width, rows_height, position}, index) => (
                        <div
                            key={index}
                            className={"absolute overflow-hidden max-w-full"}
                            style={{
                                marginLeft: `${position.x}px`,
                                marginTop: `${position.y}px`,
                            }}
                            onMouseDown={(e) => onMouseDownTable(e, index)}
                        >
                            <div
                                className={"w-min h-min"}
                            >
                                <Spreadsheet
                                    key={index}
                                    cells={cells}
                                    cols_width={cols_width}
                                    rows_height={rows_height}
                                    viewOnlyMode={true}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div
                    className="flex w-2 bg-gray-200 hover:cursor-col-resize"
                    style={{
                        height: `${currentCustomReportProfile.height}px`,
                    }}
                    onMouseDown={onMouseDownResizeWidthContainer}
                />
            </div>
            <div
                className="flex w-fit"
            >
                <div
                    className="flex h-2 bg-gray-200 hover:cursor-row-resize"
                    style={{
                        width: `${currentCustomReportProfile.width}px`,
                    }}
                    onMouseDown={onMouseDownResizeHeightContainer}
                />
                <div
                    className={"flex h-2 w-2 bg-gray-200 hover:cursor-nw-resize"}
                    onMouseDown={onMouseDownResizeBothContainer}
                />
            </div>
        </div>
    )
}

export default DynamicTemplatePosition
