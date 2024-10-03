import React from 'react';
import Select from 'react-select';

const Dropdown = ({data}) => {
    
    const options = data;

    const handleChange = (selectedOption) => {
    };

    return (
        <Select
            options={options}
            onChange={handleChange}
            isSearchable={true}
        />
    );
};

export default Dropdown;