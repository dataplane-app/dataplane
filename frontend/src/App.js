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
import Pipelines from './pages/PipelinesView';
import Deployments from './pages/Deployments';
import Workers from './pages/Workers/Workers';
import WorkerDetail from './pages/Workers/WorkerDetail';
import SecretDetail from './pages/SecretDetail';
import Secrets from './pages/Secrets';
import Settings from './pages/Settings';
import TeamDetail from './pages/TeamDetail';
import TeamGroup from './pages/TeamGroup';
import Teams from './pages/Teams';
import PipelineEditor from './pages/Editor';
import View from './pages/PipelineRuns';
import DeploymentView from './pages/Deployments/DeploymentRuns';
import PipelinesPermission from './pages/PipelinesPermission';
import createCustomTheme from './theme';
import UseCheckTheme from './hooks/useCheckTheme';
import Flow from './pages/PipelineEdit';
import Deploy from './pages/Deploy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import DeploymentPermissions from './pages/Deployments/DeploymentPermissions';

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
                        autoHideDuration={3000}>
                        <Box className="app" backgroundColor="background.main">
                            <UserAuth refreshTokenUrl="/app/refreshtoken" LogincallbackUrl="/loginCallback" loginUrl="/webapp/login" logoutUrl="/webapp/logout">
                                <CssBaseline />
                                <UseCheckTheme />
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

                                    <PrivateRoute exact path="/editor/:pipelineId/:nodeId">
                                        <PipelineEditor />
                                    </PrivateRoute>

                                    <PrivateRoute
                                        exact
                                        path={[
                                            '/',
                                            '/workers',
                                            '/workers/:workerId',
                                            '/teams',
                                            '/teams/:teamId',
                                            '/access/:accessId',
                                            '/myaccount/:memberId',
                                            '/access_groups',
                                            '/settings',
                                            '/settings/environment/:environmentId',
                                            '/secrets',
                                            '/secrets/:secretId',
                                            '/addsecret',
                                            '/notfound',
                                            '/pipelines/view/:pipelineId',
                                            '/pipelines/permissions/:pipelineId',
                                            '/pipelines/flow/:pipelineId',
                                            '/pipelines/deploy/:pipelineId',
                                            '/deployments',
                                            '/deployments/permissions/:deploymentId',
                                            '/deployments/view/:deploymentId/:version?',
                                            '/support',
                                            '/feedback',
                                            '/learn',
                                        ]}>
                                        <Switch>
                                            <Layout>
                                                <Route exact path="/">
                                                    <Pipelines />
                                                </Route>
                                                <Route exact path="/deployments">
                                                    <Deployments />
                                                </Route>
                                                <Route path="/deployments/view/:deploymentId/:version?">
                                                    <DeploymentView />
                                                </Route>
                                                <Route path="/deployments/permissions/:deploymentId">
                                                    <DeploymentPermissions />
                                                </Route>
                                                <Route exact path="/workers">
                                                    <Workers />
                                                </Route>
                                                <Route exact path="/workers/:workerId">
                                                    <WorkerDetail />
                                                </Route>
                                                <Route exact path="/teams">
                                                    <Teams />
                                                </Route>
                                                <Route exact path="/teams/:teamId">
                                                    <TeamDetail />
                                                </Route>
                                                <Route exact path="/access/:accessId">
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
                                                <Route exact path="/pipelines/view/:pipelineId">
                                                    <View />
                                                </Route>
                                                <Route exact path="/pipelines/permissions/:pipelineId">
                                                    <PipelinesPermission />
                                                </Route>
                                                <Route exact path="/pipelines/flow/:pipelineId">
                                                    <Flow />
                                                </Route>
                                                <Route exact path="/pipelines/deploy/:pipelineId">
                                                    <Deploy />
                                                </Route>
                                                <Route
                                                    exact
                                                    path="/support"
                                                    component={() => {
                                                        window.open('https://github.com/dataplane-app/dataplane/issues', '_blank');
                                                        return null;
                                                    }}
                                                />
                                                <Route
                                                    exact
                                                    path="/feedback"
                                                    component={() => {
                                                        window.open('https://github.com/dataplane-app/dataplane/discussions', '_blank');
                                                        return null;
                                                    }}
                                                />
                                                <Route
                                                    exact
                                                    path="/learn"
                                                    component={() => {
                                                        window.open('https://learn.dataplane.app', '_blank');
                                                        return null;
                                                    }}
                                                />
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
