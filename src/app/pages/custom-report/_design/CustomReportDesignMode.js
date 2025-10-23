import { useState } from "react"
import DynamicTemplatePosition from "./CustomReportPosition"
import CustomReportManipulation from "./CustomReportManipulation"

const CustomReportDesignMode = ({
    isManipulationMode,
    setIsManipulationMode,
    customReportProfiles,
    setCustomReportProfiles,
    currentCustomReportProfile,
    currentCustomReportProfileId,
    jobTemplates,
}) => {
    return (
        <div className="flex flex-col gap-4">
            <div
                className="flex gap-4"
            >
                <button
                    className="px-6 py-3 rounded-lg text-sm font-semibold transition-all enabled:bg-gradient-to-r enabled:from-blue-600 enabled:to-blue-500 text-white shadow-lg duration-150 ease-in-out enabled:hover:scale-105 enabled:hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-800"
                    disabled={isManipulationMode}
                    onClick={() => setIsManipulationMode(true)}
                >
                    Manipulation
                </button>
                <button
                    className="px-6 py-3 rounded-lg text-sm font-semibold transition-all enabled:bg-gradient-to-r enabled:from-blue-600 enabled:to-blue-500 text-white shadow-lg duration-150 ease-in-out enabled:hover:scale-105 enabled:hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-800"
                    disabled={!isManipulationMode}
                    onClick={() => setIsManipulationMode(false)}
                >
                    Position
                </button>
            </div>
            {currentCustomReportProfile && (
                isManipulationMode ? (
                    <CustomReportManipulation
                        customReportProfiles={customReportProfiles}
                        setCustomReportProfiles={setCustomReportProfiles}
                        currentCustomReportProfile={currentCustomReportProfile}
                        currentCustomReportProfileId={currentCustomReportProfileId}
                        jobTemplates={jobTemplates}
                    />
                ) : (
                    <DynamicTemplatePosition
                        customReportProfiles={customReportProfiles}
                        setCustomReportProfiles={setCustomReportProfiles}
                        currentCustomReportProfile={currentCustomReportProfile}
                    />
                )
            )}
        </div>
    )
}

export default CustomReportDesignMode