import Box from '@mui/material/Box';
import { Outlet } from "react-router-dom";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";

const Layout = () => {
    return(
        <Box height="100vh" width="100vw" sx={{ overflow: 'hidden' }} className="spacing-nav">
            <Navbar />
            <Box height="100%" sx={{ display: 'flex' }}>
                <Sidebar />
                <Box flex={1} padding={4} >
                    <Outlet />
                </Box>
            </Box>
        </Box>
    )
};

export default Layout;