import { Machine } from "@/lib/models/Machine";
import { connectToDb } from "@/app/api/mongo/index.js"; // เชื่อมต่อฐานข้อมูล

export async function DELETE(req, { params }) {
  const { id } = params;

  try {
    // เชื่อมต่อฐานข้อมูล
    await connectToDb();

    // ค้นหาข้อมูลจาก MongoDB ด้วย _id
    const machine = await Machine.findById(id);

    // ถ้าไม่พบเครื่อง
    if (!machine) {
      return new Response(
        JSON.stringify({ success: false, message: "Machine not found" }),
        { status: 404 }
      );
    }

    // ลบเครื่องที่เจอ โดยใช้ deleteOne()
    await Machine.deleteOne({ _id: id });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Machine deleted successfully",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting machine:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "There was an error deleting the machine",
      }),
      { status: 500 }
    );
  }
}
