import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Box } from "@mui/system";
import React from "react";
import { Route } from "react-router-dom";
import { UserAuth } from "./Auth/UserAuth";
import Layout from "./components/Layout/Layout.component";
import Congratulations from "./pages/Congratulations";
import GetStarted from "./pages/GetStarted";
import LoginUser from "./pages/Login";
import Pipelines from './pages/Pipelines';
import TeamDetail from "./pages/TeamDetail";
import TeamGroup from "./pages/TeamGroup";
import Teams from './pages/Teams';
import createCustomTheme from "./theme";



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
                    <UserAuth
                        refreshTokenUrl={process.env.REACT_APP_refreshTokenUrl}
                        loginUrl="/webapp/login"
                        LogincallbackUrl={process.env.REACT_APP_LogincallbackUrl}
                        logoutUrl={process.env.REACT_APP_logoutUrl}>
                            <Route path="congratulations" element={<Congratulations />} />
                            <Route path="get-started" element={<GetStarted />} />
                            <Route path="login" element={<LoginUser />} />
                            <Route path="/" element={<Layout />}>
                                <Route index element={<Pipelines />}/>
                                <Route path="teams" element={<Teams />} />
                                <Route path="teams/:teamId" element={<TeamDetail />} />
                                <Route path="teams/access/:accessId" element={<TeamGroup />} />
                            </Route>
                        </UserAuth>
                </Box>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}

export default App;
