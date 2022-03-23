import React, { useEffect } from 'react';
import IdleTimer from 'react-idle-timer';
// import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { createState, useState as useHookState } from '@hookstate/core';
import ConsoleLogHelper from '../Helper/logger';
import axios from 'axios';
import { Route, Switch, BrowserRouter } from 'react-router-dom';
import { LoginCallback } from './LoginCallBack';
import decode from 'jwt-decode';
import removeBaseName from '../utils/removeBaseName';

// LOGIC silent replacement of tokens:
/*
Objective is to work out when to refresh a token and when to redirect to login page

Token is issued
1. Work out expiry of token and the half life
2. If the user is active, refresh the token at half life
3. If the token has expired or not available, attempt a refresh token
4. If refresh failed navigate to login with last url redirect
*/

// Scenarios
/*
Came to page for first time, no token - check if token and login redirect.
Came to page for first time, refresh token is valid but token not stored.
In both cases the server should let the front end know whether to login or session is valid to continue with new token
TODO: If switching apps - store a flag in localstorage to say that it is logged in and then on
first load, dont go through login flow but attempt to get refresh token
*/

export const globalAuthState = createState({
    authToken: 'empty',
    deviceFP: 'empty',
    refresh: false,
    loadstate: 'start',
    privateRoute: false, // this flag is maintained to know if user has been on a private route, if yes then we check for user authentication
});

// this is a convience hook for the golablAuthState, call this hook where token is needed
export const useGlobalAuthState = () => useHookState(globalAuthState);

// Is it time to do a silent refresh? Refresh on 80% life
const getAccessTokenRefreshTime = (token) => {
    if (token === 'empty') {
        ConsoleLogHelper('Empty token');
        return true;
    }

    var half = (token.exp - token.iat) / 1.25;

    ConsoleLogHelper('IAT:', token.iat, ' | Expiry: ', token.exp, ' | Half: ', half, '| Date now: ', Date.now());

    // console.log('Half life:', half, token)

    if (Date.now() > (token.iat + half) * 1000) {
        ConsoleLogHelper('Token refreshed');
        return true;
    } else {
        ConsoleLogHelper('Token is valid :)');
        return false;
    }
};

// ---- Decode the access token -----
const decodedAccessToken = (accessToken) => {
    if (!accessToken || accessToken === 'empty') return 'empty';
    let decoded;
    try {
        decoded = decode(accessToken);
        ConsoleLogHelper('Decoded token:', decoded);
        return decoded;
    } catch (ex) {
        ConsoleLogHelper('Decoded token failed:', 'Invalid Access Token, unset state', ex);
        return 'empty';
    }
};

const refreshCountState = createState(0);

export const UserAuth = ({ children, Env, loginUrl, refreshTokenUrl, logoutUrl, LogincallbackUrl, baseName }) => {
    const Authstate = useHookState(globalAuthState);

    ConsoleLogHelper('Loading state:', Authstate.loadstate.get());

    // Time to refresh token?
    // const refresh = useHookState(null)
    const refreshCount = useHookState(refreshCountState);

    // ----- Set a in memory cache for auth tokens -----

    // ----- As the user is active keep checking for half life
    // const onActive = (e) => {
    //     ConsoleLogHelper('Called onActive');
    //     // On activity test if a token is needed?
    //     if (Authstate.privateRoute.get() === true) {
    //         let decodedToken = decodedAccessToken(Authstate.authToken.get());
    //         if (decodedToken === undefined) {
    //             ConsoleLogHelper('Set Empty for onActivity');
    //             Authstate.authToken.set('empty');
    //         } else {
    //             let x = getAccessTokenRefreshTime(decodedToken);
    //             // refresh.set(x)
    //             ConsoleLogHelper('On activity is refresh needed?:', x);
    //             if (x === true) {
    //                 ConsoleLogHelper('Refresh count up:', refreshCount.get());
    //                 refreshCount.set((p) => p + 1);
    //             }
    //         }
    //     }
    //     // console.log("user is active", e);
    //     // console.log("time remaining", this.idleTimer.getRemainingTime());
    // };

    // --------- check activity every 5 seconds --------
    const MINUTE_MS = 5000;

    useEffect(() => {
        const interval = setInterval(() => {
            console.log('Logs every 5 seconds');
            if (Authstate.privateRoute.get() === true) {
                let decodedToken = decodedAccessToken(Authstate.authToken.get());
                if (decodedToken === undefined) {
                    ConsoleLogHelper('Set Empty for onActivity');
                    Authstate.authToken.set('empty');
                } else {
                    let x = getAccessTokenRefreshTime(decodedToken);
                    // refresh.set(x)
                    ConsoleLogHelper('On activity is refresh needed?:', x);
                    if (x === true) {
                        ConsoleLogHelper('Refresh count up:', refreshCount.get());
                        refreshCount.set((p) => p + 1);
                    }
                }
            }
        }, MINUTE_MS);

        return () => clearInterval(interval); // This represents the unmount function, in which you need to clear your interval to prevent memory leaks.
    }, []);

    //   ------ On refresh is True, fire off refresh token
    useEffect(() => {
        ConsoleLogHelper('Fire me when token is needed - ID:', refreshCount.get());

        async function fetchToken() {
            Authstate.loadstate.set('loading');

            const refreshToken = localStorage.getItem('refresh_token');

            axios
                .post(
                    `${process.env.REACT_APP_DATAPLANE_ENDPOINT}${refreshTokenUrl}`,
                    {},
                    { headers: { Authorization: `Bearer ${refreshToken}` }, withCredentials: true }
                    // {withCredentials: true}
                )
                .then((resp) => {
                    ConsoleLogHelper('AccessToken Refreshed', resp.data);
                    Authstate.authToken.set(resp.data.access_token);
                    Authstate.loadstate.set('authenticated');
                    return 'OK';
                })
                .catch((err) => {
                    ConsoleLogHelper('Failed to refresh Access Token.', err);

                    // navigate to login
                    // first set local storage:
                    //  by redirecting this will flush out the existing in memory token
                    // only use path name for redirection otherwise token will get removed from memory
                    localStorage.setItem('redirectLocation', window.location.pathname === '/webapp' ? '/' : removeBaseName(window.location.pathname));
                    window.location.href = loginUrl;

                    return 'fail';
                });
        }

        // if we only try to fetch token if we are on a private route
        if (Authstate.privateRoute.get() === true) {
            fetchToken();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshCount.get()]);

    return (
        <React.Fragment>
            {/* <IdleTimer
                element={document}
                onActive={onActive}
                debounce={250}
                timeout={1000} //every 1 seconds
            /> */}
            <BrowserRouter basename="/webapp">
                <Switch>
                    <Route path={LogincallbackUrl} exact>
                        <LoginCallback Authstate={Authstate} />
                    </Route>
                    <Route>{children}</Route>
                </Switch>
            </BrowserRouter>
        </React.Fragment>
    );
};

// This is a wrapper component to set the authState privateRoute flag
const PrivateRouteChecker = ({ children }) => {
    ConsoleLogHelper('on private route');
    let auth = useGlobalAuthState();
    const refreshCount = useHookState(refreshCountState);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {}, [auth.privateRoute.get(), auth.authToken.get()]);

    // if privateRoute is not yet set set it
    if (auth.privateRoute.get() === false) {
        ConsoleLogHelper('setting private route now');
        auth.privateRoute.set(true);
        refreshCount.set((v) => v + 1);
        return null;
    }

    // we wait till we get a token
    if (auth.authToken.get() === 'empty') {
        ConsoleLogHelper('on private route empty token');
        return null;
    }
    ConsoleLogHelper('on private route render');

    return children;
};

// PrivateRoute just wraps the normal Route Component and ensure user is logged in if we gets to this route
export const PrivateRoute = ({ children, ...rest }) => {
    return (
        <Route {...rest}>
            <PrivateRouteChecker>{children}</PrivateRouteChecker>
        </Route>
    );
};
