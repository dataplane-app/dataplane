import { CssBaseline } from "@mui/material";
import { BrowserRouter , Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout.component";
import Congratulations from "./pages/Congratulations";
import customTheme from "./theme";
import { ThemeProvider } from '@mui/material/styles'

import GetStarted from "./pages/GetStarted";
import Pipelines from './pages/Pipelines';
import TeamDetail from "./pages/TeamDetail";
import Teams from './pages/Teams';

function App() {
    return (
        <ThemeProvider theme={customTheme}>
            <CssBaseline />
            <div className="app">
                <BrowserRouter basename="/webapp">
                    <Routes>
                        <Route path="congratulations" element={<Congratulations />} />
                        <Route path="get-started" element={<GetStarted />} />
                        <Route path="/" element={<Layout />}>
                            <Route index element={<Pipelines />}/>
                            <Route path="teams" element={<Teams />} />
                            <Route path="teams/:teamId" element={<TeamDetail />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </div>
        </ThemeProvider>
    );
}

export default App;
