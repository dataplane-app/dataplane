import React from "react";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Box } from "@mui/system";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout/Layout.component";
import createCustomTheme from "./theme";

import Congratulations from "./pages/Congratulations";
import GetStarted from "./pages/GetStarted";
import LoginUser from "./pages/Login";
import Pipelines from './pages/Pipelines';
import TeamDetail from "./pages/TeamDetail";
import TeamGroup from "./pages/TeamGroup";
import Teams from './pages/Teams';
import { UserAuth, PrivateRoute } from "./Auth/UserAuth";


export const ColorModeContext = React.createContext({ toggleColorMode: () => {} });

function App() {
    const [mode, setMode] = React.useState('light');
    const colorModeToggle = React.useMemo(() => ({
        toggleColorMode: () => {
            setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
        },
    }),
    [],
    );

    const theme = React.useMemo(() => createTheme(createCustomTheme(mode)), [mode]);

    return (
        <ColorModeContext.Provider value={colorModeToggle}>
                <ThemeProvider theme={theme}>
                    <Box className="app" backgroundColor="background.main" >
                        <BrowserRouter basename="/webapp">
                        <UserAuth
                            refreshTokenUrl={process.env.REACT_APP_refreshTokenUrl}
                            loginUrl="/webapp/login"
                            LogincallbackUrl={process.env.REACT_APP_LogincallbackUrl} //front end callback url
                            logoutUrl={process.env.REACT_APP_logoutUrl}>
                            <Routes>
                                <Route path="congratulations" element={<Congratulations />} />
                                <Route path="get-started" element={<GetStarted />} />
                                <Route path="login" element={<LoginUser />} />
                                <Route path="/" element={<Layout />}>
                                    <Route index element={<Pipelines />}/>
                                    <Route path="teams" element={<Teams />} />
                                    <Route path="teams/:teamId" element={<TeamDetail />} />
                                    <Route path="teams/access/:accessId" element={<TeamGroup />} />
                                </Route>
                            </Routes>
                            </UserAuth>
                        </BrowserRouter>
                    </Box>
                </ThemeProvider>
        </ColorModeContext.Provider>
    );
}

export default App;
