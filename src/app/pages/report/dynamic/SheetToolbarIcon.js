export const BoxOuterDotted = () => {
    const gap = 4
    const dotNum = 6
    const start = 1.5
    const end = start + gap * (dotNum - 1)
    const radius = 1.5

    return (
        <svg fill="none" width="800px" height="800px" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
            <g fill="#000000">
                {Array.from({ length: dotNum }).map((_, i) => (
                    <circle cx={start + i * gap} cy={start} r={radius} />
                ))}

                {Array.from({ length: dotNum }).map((_, i) => (
                    <circle cx={start + i * gap} cy={end} r={radius} />
                ))}

                {Array.from({ length: dotNum }).map((_, i) => (
                    <circle cx={start} cy={start + i * gap} r={radius} />
                ))}

                {Array.from({ length: dotNum }).map((_, i) => (
                    <circle cx={end} cy={start + i * gap} r={radius} />
                ))}
            </g>
        </svg>
    )
}

export const BoxOuterSolid = () => (
    <svg fill="#000000" width="800px" height="800px" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" id="memory-box-outer-light-all">
        <path d="M0 0H22V22H0V0M2 2V20H20V2H2Z" />
    </svg>
)

export const BoxOuterDashed = () => (
    <svg fill="#000000" width="800px" height="800px" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" id="memory-box-outer-light-dashed-all">
        <path d="M4 0V2H2V4H0V0H4M2 6V10H0V6H2M2 12V16H0V12H2M2 18V20H4V22H0V18H2M6 0H10V2H6V0M12 0H16V2H12V0M18 0H22V4H20V2H18V0M18 22V20H20V18H22V22H18M16 22H12V20H16V22M10 22H6V20H10V22M20 6H22V10H20V6M20 12H22V16H20V12Z" />
    </svg>
)

export const MergeCell = () => (
    <svg width="800px" height="800px" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" fill="white" fillOpacity="0.01" />
        <path d="M20 14V5C20 4.44772 19.5523 4 19 4H5C4.44772 4 4 4.44772 4 5V43C4 43.5523 4.44772 44 5 44H19C19.5523 44 20 43.5523 20 43V34" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
        <path d="M28 34V43C28 43.5523 28.4477 44 29 44H43C43.5523 44 44 43.5523 44 43V5C44 4.44772 43.5523 4 43 4H29C28.4477 4 28 4.44772 28 5V14" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
        <path d="M28 24H44" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
        <path d="M5 24H20" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
        <path d="M32.7485 28.8183L31.1575 27.2274L27.9756 24.0454L31.1575 20.8634L32.7485 19.2724" stroke="#000000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15.375 28.8183L16.966 27.2274L20.148 24.0454L16.966 20.8634L15.375 19.2724" stroke="#000000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)