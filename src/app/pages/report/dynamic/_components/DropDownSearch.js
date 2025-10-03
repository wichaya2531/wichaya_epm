import { Delete, Edit } from "@mui/icons-material";
import { Autocomplete, TextField } from "@mui/material";
import { useEffect, useRef } from "react";

const DropDownSearch = ({
    arrayOfData = [],
    selectedItem,
    onSelected = () => {},
}) => {
    const ref = useRef()
    // useEffect(() => {
    //     console.log(arrayOfData)
    // }, [arrayOfData])
    return (
        <Autocomplete
            disablePortal
            options={arrayOfData}
            sx={{ width: 300 }}
            renderInput={(params) => (
                    <TextField {...params} label="Sheet" />
            )}
            // renderOption={(props, option) => (
            //     <div className="flex justify-between align-center w-full"
            //     ref={ref}    
            //     >
            //         <div className="w-full"
            //         onClick={props.onClick}
            //         >
            //             {option.label}
            //         </div>
            //         <div className="flex align-center">
            //             <button
                        
            //             >
            //                 <Edit />
            //             </button>
            //             <button>
            //                 <Delete />
            //             </button>
            //         </div>
            //     </div>
            // )}
            value={arrayOfData.find(item=>item.id===selectedItem) || null}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(_, value) => {
                if(value) {
                    onSelected(value.id)
                }
            }}
        />
    )
}

export default DropDownSearch;