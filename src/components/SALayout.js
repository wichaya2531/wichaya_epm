import Navbar from "@/components/Navbar";
import Footer from "./Footer";

const SALayout = ({ children, className = "" }) => {
    const menus = [
        {
            "name": "Manage Roles",
            "path": "/pages/SA/create-role"
        },
        {
            "name": "Manage Workgroups",
            "path": "/pages/SA/create-workgroup"
        }
    ];
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar
                menu={menus}
            />
            <div className={`flex-1 ${className} pt-24 pb-24`}>
                {children}
            </div>
            <Footer />
        </div>
    );
}

export default SALayout;
