import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";

import Pipelines from "../../pages/Pipelines";

const Layout = () => (
    <Router>
        <div className="h-screen max-h-screen max-w-screen overflow-hidden">
            <Navbar />
            <div className="h-full flex spacing-nav">
                <Sidebar />
                <div className="flex-1 overflow-y-auto p-7">
                    <Routes>
                        <Route exact path="/pipelines" element={<Pipelines />}/>
                    </Routes>
                </div>
            </div>
        </div>
    </Router>
);

export default Layout;
