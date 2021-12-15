import React from "react";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Box } from "@mui/system";
import React from "react";
import { Route, Switch } from "react-router-dom";
import { UserAuth , PrivateRoute } from "./Auth/UserAuth";
import createCustomTheme from "./theme";

import Layout from "./components/Layout/Layout.component";
import createCustomTheme from "./theme";

import Congratulations from "./pages/Congratulations";
import GetStarted from "./pages/GetStarted";
import LoginUser from "./pages/Login";
import Pipelines from './pages/Pipelines';
import TeamDetail from "./pages/TeamDetail";
import TeamGroup from "./pages/TeamGroup";
import Teams from './pages/Teams';


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
                        LogincallbackUrl={process.env.REACT_APP_logoutUrl}
                        logoutUrl={process.env.REACT_APP_logoutUrl}
                    >
                            <Route exact path="/congratulations">
                                <Congratulations />
                            </Route>
                            <Route exact path="/get-started">
                                <GetStarted />
                            </Route>
                            <Route exact path="/login">
                                <LoginUser />
                            </Route>
                            <Layout>
                                <Switch>
                                    <PrivateRoute exact path="/">
                                        <Pipelines />
                                    </PrivateRoute>
                                    <PrivateRoute exact path="/teams">
                                        <Teams />
                                    </PrivateRoute>
                                    <PrivateRoute exact path="/teams/:teamId">
                                        <TeamDetail />
                                    </PrivateRoute>
                                    <PrivateRoute exact path="/teams/access/:accessId">
                                        <TeamGroup />
                                    </PrivateRoute>
                                </Switch>
                            </Layout>
                        </UserAuth>
                </Box>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}

export default App;
