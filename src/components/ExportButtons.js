import { FaFileCsv, FaImage, FaFilePdf } from "react-icons/fa";

const ExportButtons = ({ handleExport }) => {
  return (
    <div className="flex justify-end mt-6 space-x-3">
      <button
        onClick={() => handleExport("csv")}
        className=" bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
      >
        <FaFileCsv />
        <span className="hidden md:inline">Export CSV</span>
      </button>

      <button
        onClick={() => handleExport("png")}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
      >
        <FaImage />
        <span className="hidden md:inline">Save as PNG</span>
      </button>

      <button
        onClick={() => handleExport("pdf")}
        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
      >
        <FaFilePdf />
        <span className="hidden md:inline">Export PDF</span>
      </button>
    </div>
  );
};

export default ExportButtons;
