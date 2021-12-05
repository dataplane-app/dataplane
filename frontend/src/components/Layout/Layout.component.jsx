import { Outlet } from "react-router-dom";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";

const Layout = () => {
    return(
        <div className="h-screen max-h-screen max-w-screen overflow-hidden dark:bg-darkPrimary">
            <Navbar />
            <div className="h-full flex spacing-nav">
                <Sidebar />
                <div className="flex-1 overflow-y-auto p-7">
                    <Outlet />
                </div>
            </div>
        </div>
    )
};

export default Layout;
