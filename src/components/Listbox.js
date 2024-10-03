import React, { useState, useEffect } from 'react';

const Listbox = ({ data, handleSelectedList  }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);

    const handleSearchQueryChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const handleCheckboxChange = (itemId) => {
        // Toggle the selection of the clicked item
        const newSelectedItems = selectedItems.includes(itemId)
            ? selectedItems.filter(id => id !== itemId) // Remove item if already selected
            : [...selectedItems, itemId]; // Add item if not selected
    
        // Update the selectedItems state immediately
        setSelectedItems(newSelectedItems);
    
        // Pass the updated selectedItems to the parent component
        handleSelectedList(newSelectedItems);
    };
    
    useEffect(() => {
        handleSelectedList(selectedItems);
    }, [selectedItems]);

    const filteredItems = data.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getItemName = (itemId) => {
        const selectedItem = data.find(item => item._id === itemId);
        return selectedItem ? selectedItem.name : '';
    };

    return (
        <div className="border border-gray-300 rounded-lg p-4">
            <input
                type="text"
                className="border border-gray-300 rounded-md p-2 mb-4 w-full"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearchQueryChange}
            />
            <ul className="max-h-48 overflow-y-auto">
                {filteredItems.map((item, index) => (
                    <li key={index} className="flex items-center mb-2">
                        <input
                            id={item._id}
                            type='checkbox'
                            checked={selectedItems.includes(item._id)}
                            onChange={() => handleCheckboxChange(item._id)}
                            className="mr-2"
                        />
                        <label htmlFor={item._id}>{item.name}</label>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Listbox;