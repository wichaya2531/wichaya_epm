const TableReport = ({ datasets }) => {
  // ดึงข้อมูลจาก datasets
  const tableData = Object.values(datasets).flatMap((dataset) =>
    dataset.data.map((item) => ({
      lineName: dataset.label.split(" - ")[0], // Line Name
      workgroupName: dataset.label.split(" - ")[1], // Workgroup Name
      jobItemName: item.jobItemName, // JOB_ITEM_NAME
      date: new Date(item.x).toLocaleDateString(), // แปลงเป็นวันที่
      docNumber: item.docNumber, // DOC_NUMBER
      actualValue: item.actualValue, // ACTUAL_VALUE
    }))
  );

  // ฟังก์ชันในการเลือกสีพื้นหลังตาม actualValue
  const getBackgroundColor = (actualValue) => {
    switch (actualValue.toLowerCase()) {
      case "pass":
        return "bg-green-200";
      case "good":
        return "bg-blue-200";
      case "not change":
        return "bg-gray-200";
      case "fail":
        return "bg-red-200";
      case "change":
        return "bg-yellow-200";
      case "done":
        return "bg-purple-200";
      case "check":
        return "bg-orange-200";
      case "unknown":
        return "bg-indigo-200";
      default:
        return "bg-white"; // ถ้าไม่มีค่าที่ตรงจะเป็นพื้นหลังขาว
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg">
      <table className="min-w-full border-collapse table-auto rounded-lg">
        <thead>
          <tr>
            {[
              "Line Name",
              "Workgroup Name",
              "Date",
              "DOC_NUMBER",
              "JOB_ITEM_NAME",
              "ACTUAL_VALUE",
            ].map((header) => (
              <th
                key={header}
                className="border px-4 py-2 text-left font-semibold bg-blue-600 text-white"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="border px-4 py-2 text-sm text-gray-700">
                {row.lineName}
              </td>
              <td className="border px-4 py-2 text-sm text-gray-700">
                {row.workgroupName}
              </td>
              <td className="border px-4 py-2 text-sm text-gray-700">
                {row.date}
              </td>
              <td className="border px-4 py-2 text-sm text-gray-700">
                {row.docNumber}
              </td>
              <td className="border px-4 py-2 text-sm text-gray-700">
                {row.jobItemName}
              </td>
              <td
                className={`border px-4 py-2 text-sm text-gray-700 ${getBackgroundColor(
                  row.actualValue
                )}`}
              >
                {row.actualValue}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableReport;
