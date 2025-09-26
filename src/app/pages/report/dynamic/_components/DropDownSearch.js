import { Delete, Edit } from "@mui/icons-material";
import { Autocomplete, TextField } from "@mui/material";
import { useEffect, useRef, useState } from "react";

const DropDownSearch = ({
    arrayOfData = [],
    selectedItem,
    onSelected = () => {},
    onEdit = () => {},
    onDelete = () => {},
    inputValue,
    setInputValue = () => {},
}) => {

    return (
        <Autocomplete
            disablePortal
            options={arrayOfData}
            sx={{ width: 300 }}
            renderInput={(params) => (
                <TextField {...params} label="Sheet" />
            )}
            renderOption={(props, option, state) => (
                <div
                {...props}
                >
                    <div
                    className="w-full"
                    >
                        {option.label}
                    </div>
                    <div className="flex align-center">
                        <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(option.id);
                        }}
                        >
                            <Edit />
                        </button>
                        <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(option.id);
                        }}
                        >
                            <Delete />
                        </button>
                    </div>
                </div>
            )}
            value={selectedItem}
            inputValue={inputValue}
            onInputChange={(_, newInputValue) => {
                setInputValue(newInputValue)
            }}
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