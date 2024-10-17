import ReactDOM from 'react-dom';
import Select from 'react-select';

// Component สำหรับ Select โดยใช้ React Portal
const SelectContainer = ({ validLineNames, onSelect,position }) => {
  //console.log("validLineNames:", validLineNames);
  console.log("position =>:", position);
  return ReactDOM.createPortal(
    <div
      id="select-container-1"
      style={{
        position: "absolute",
        top: "50%" ,  // คุณสามารถปรับเปลี่ยนตามความต้องการของตำแหน่ง
        left: "50%",
        zIndex: 9999,  // z-index สูงกว่า SweetAlert
        width: "400px",
      }}
    >
      <Select
        options={validLineNames}
        isSearchable
        placeholder="--Select Line Name--"
        styles={customSelectStyles()} // ใช้สไตล์ที่กำหนดไว้
        menuPlacement="auto"
        maxMenuHeight={500}
        onChange={(selected) => {
          onSelect(selected ? selected.value : null);
        }}
      />
    </div>,
    document.body  // Render Portal ไปที่ body เพื่อแยกออกจาก SweetAlert
  );
};

// ฟังก์ชันสำหรับสไตล์ของ Select
const customSelectStyles = () => ({
  control: (base) => ({
    ...base,
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#999",
    },
    height: "60px",
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,  // กำหนดค่า z-index ให้สูงกว่าองค์ประกอบอื่น
    maxHeight: "400px",
    overflowY: "auto",
    top:'0px'
  }),
  option: (base, { isFocused }) => ({
    ...base,
    padding: "10px",
    backgroundColor: isFocused ? "#f0f0f0" : "#fff",
    cursor: "pointer",
  }),
});

export default SelectContainer;
