import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { PrivateRoute, UserAuth } from './Auth/UserAuth';
import Layout from './components/Layout/Layout.component';
import NotDesktop from './components/NotDesktop';
import useWindowSize from './hooks/useWindowsSize';
import AccessGroups from './pages/AccessGroups';
import AddSecret from './pages/AddSecret';
import Congratulations from './pages/Congratulations';
import EnvironmentDetail from './pages/EnvironmentDetail';
import GetStarted from './pages/GetStarted';
import LoginUser from './pages/Login';
import LogoutUser from './pages/Logout';
import MemberDetail from './pages/MemberDetail';
import NotFound from './pages/NotFound';
import Pipelines from './pages/Pipelines';
import SecretDetail from './pages/SecretDetail';
import Secrets from './pages/Secrets';
import Settings from './pages/Settings';
import TeamDetail from './pages/TeamDetail';
import TeamGroup from './pages/TeamGroup';
import Teams from './pages/Teams';
import createCustomTheme from './theme';

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

    // Screen size hook
    const { width } = useWindowSize();

    if (width && width < 768) {
        return (
            <ThemeProvider theme={theme}>
                <NotDesktop />
            </ThemeProvider>
        );
    }

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
                                <CssBaseline />
                                <Switch>
                                    <Route exact path="/congratulations">
                                        <Congratulations />
                                    </Route>
                                    <Route exact path="/get-started">
                                        <GetStarted />
                                    </Route>
                                    <Route exact path="/login">
                                        <LoginUser />
                                    </Route>

                                    <PrivateRoute exact path="/logout">
                                        <LogoutUser />
                                    </PrivateRoute>

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
                                            '/notfound',
                                        ]}>
                                        <Switch>
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
                                                <Route exact path="/notfound">
                                                    <NotFound />
                                                </Route>
                                            </Layout>
                                        </Switch>
                                    </PrivateRoute>

                                    <Route exact path="*">
                                        <Redirect to="/notfound" />
                                    </Route>
                                </Switch>
                            </UserAuth>
                        </Box>
                    </SnackbarProvider>
                </ThemeProvider>
            </EnvironmentContext.Provider>
        </ColorModeContext.Provider>
    );
}

export default App;
