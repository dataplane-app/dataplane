import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Box, Button } from '@mui/material';
import { Route } from 'react-router-dom';
import { UserAuth, PrivateRoute } from './Auth/UserAuth';
import { SnackbarProvider } from 'notistack';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';

import Layout from './components/Layout/Layout.component';
import createCustomTheme from './theme';

import Congratulations from './pages/Congratulations';
import GetStarted from './pages/GetStarted';
import LoginUser from './pages/Login';
import LogoutUser from './pages/Logout';
import Pipelines from './pages/Pipelines';
import TeamDetail from './pages/TeamDetail';
import MemberDetail from './pages/MemberDetail';
import TeamGroup from './pages/TeamGroup';
import Teams from './pages/Teams';
import AccessGroups from './pages/AccessGroups';
import Settings from './pages/Settings';
import EnvironmentDetail from './pages/EnvironmentDetail';
import Secrets from './pages/Secrets';
import AddSecret from './pages/AddSecret';
import SecretDetail from './pages/SecretDetail';

export const ColorModeContext = React.createContext({
    toggleColorMode: () => {},
});

export const EnvironmentContext = React.createContext(null);

function App() {
    // Theme
    const [mode, setMode] = React.useState('light');
    const colorModeToggle = React.useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
            },
        }),
        []
    );

    // Environment provider
    const [environment, setEnvironment] = React.useState(null);
    const environmentProvider = React.useMemo(() => [environment, setEnvironment], [environment, setEnvironment]);

    const theme = React.useMemo(() => createTheme(createCustomTheme(mode)), [mode]);

    // Snackbar
    const notistackRef = React.createRef();
    const onClickDismiss = (key) => () => {
        notistackRef.current.closeSnackbar(key);
    };

    return (
        <ColorModeContext.Provider value={colorModeToggle}>
            <EnvironmentContext.Provider value={environmentProvider}>
                <ThemeProvider theme={theme}>
                    <SnackbarProvider
                        hideIconVariant={true}
                        ref={notistackRef}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        action={(key) => (
                            <Button onClick={onClickDismiss(key)} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Box component={FontAwesomeIcon} color="white" icon={faTimesCircle} />
                            </Button>
                        )}
                        autoHideDuration={8000}>
                        <Box className="app" backgroundColor="background.main">
                            <UserAuth refreshTokenUrl="/refreshtoken" LogincallbackUrl="/loginCallback" loginUrl="/webapp/login" logoutUrl="/webapp/logout">
                                <Route exact path="/congratulations">
                                    <Congratulations />
                                </Route>
                                <Route exact path="/get-started">
                                    <GetStarted />
                                </Route>
                                <Route exact path="/login">
                                    <LoginUser />
                                </Route>
                                <PrivateRoute
                                    exact
                                    path={[
                                        '/',
                                        '/teams',
                                        '/teams/:teamId',
                                        '/teams/access/:accessId',
                                        '/myaccount/:memberId',
                                        '/access_groups',
                                        '/settings',
                                        '/settings/environment/:environmentId',
                                        '/secrets',
                                        '/secrets/:secretId',
                                        '/addsecret',
                                    ]}>
                                    <Layout>
                                        <Route exact path="/">
                                            <Pipelines />
                                        </Route>
                                        <Route exact path="/teams">
                                            <Teams />
                                        </Route>
                                        <Route exact path="/teams/:teamId">
                                            <TeamDetail />
                                        </Route>
                                        <Route exact path="/teams/access/:accessId">
                                            <TeamGroup />
                                        </Route>
                                        <Route exact path="/access_groups">
                                            <AccessGroups />
                                        </Route>
                                        <Route exact path="/myaccount/:memberId">
                                            <MemberDetail />
                                        </Route>
                                        <Route exact path="/settings">
                                            <Settings />
                                        </Route>
                                        <Route exact path="/settings/environment/:environmentId">
                                            <EnvironmentDetail />
                                        </Route>
                                        <Route exact path="/secrets">
                                            <Secrets />
                                        </Route>
                                        <Route exact path="/secrets/:secretId">
                                            <SecretDetail />
                                        </Route>
                                        <Route exact path="/addsecret">
                                            <AddSecret />
                                        </Route>
                                    </Layout>
                                </PrivateRoute>
                                <PrivateRoute exact path="/logout">
                                    <LogoutUser />
                                </PrivateRoute>
                            </UserAuth>
                        </Box>
                    </SnackbarProvider>
                </ThemeProvider>
            </EnvironmentContext.Provider>
        </ColorModeContext.Provider>
    );
}

export default App;
