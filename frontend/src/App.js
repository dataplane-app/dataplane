import { BrowserRouter , Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout.component";
import Congratulations from "./pages/Congratulations";

import GetStarted from "./pages/GetStarted";
import Pipelines from './pages/Pipelines';
import Teams from './pages/Teams';

function App() {
    return (
        <div className="app bg-white dark:bg-darkSecondary">
            <BrowserRouter basename="/webapp">
                <Routes>
                    <Route path="/congratulations" element={<Congratulations />} />
                    <Route path="/get-started" element={<GetStarted />} />
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Pipelines />}/>
                        <Route path="teams" element={<Teams />}/>
                    </Route>
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
