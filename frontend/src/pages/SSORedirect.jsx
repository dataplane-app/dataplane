import { Box, Container, Grid, Typography } from '@mui/material';
import { useState, useEffect } from 'react';
import PublicAPI from '../utils/public-api';
import { useHistory, Link } from 'react-router-dom';

const SSORedirect = () => {
    let history = useHistory();
    const [isNext, setIsNext] = useState(false);

    const [AuthStrategy, setAuthStrategy] = useState('authenticate');
    const [AuthResponse, setAuthResponse] = useState('');

    // Retrieve what login strategy is being used
    useEffect(() => {
        try {
            // loop through each query parameter and add all of them to api endpoint
            const queryParams = new URLSearchParams(window.location.search);
            const apiEndpoint = '/oidc/callback?' + queryParams.toString();
            // console.log(apiEndpoint);

            PublicAPI(apiEndpoint, {}, 'GET').then((response) => {
                if (response.status === 200) {
                    setAuthStrategy('success');
                    localStorage.setItem('refresh_token', response.body.refresh_token);
                    history.push(`loginCallback?accesstoken=${response.body.access_token}&refreshtoken=${response.body.refresh_token}`);
                    // console.log('Auth Response:', response.body);
                    // setAuthStrategy(response.body.authstrategy);
                } else {
                    setAuthStrategy('failed');
                    setAuthResponse(JSON.stringify(response.body.Error));
                }
            });

            // Catch error for api submit
        } catch (err) {
            console.error('Error validating form:', err);
        }
    }, []);

    return (
        <Box className="get-started" height="100vh" sx={{ overflowX: 'hidden' }}>
            <Box position="relative" width="100%" sx={{ top: 0, left: 0, right: 0, border: 1, borderColor: 'divider' }}>
                <Typography component="h1" variant="h1" color="secondary" fontWeight={700} style={{ padding: '1.5rem 0 1.5rem .75rem' }}>
                    Dataplane
                </Typography>
            </Box>

            <Container sx={{ mt: 12, mb: 6 }}>
                <Grid container alignItems="flex-start" justifyContent="center">
                    {AuthStrategy === 'authenticate' && <>Authenticating...</>}

                    {AuthStrategy === 'success' && <>Success redirecting...</>}

                    {AuthStrategy === 'failed' && (
                        <>
                            <div>Failed: {AuthResponse}</div>
                            <br />
                            <br />
                            <br />
                            <div>
                                SSO Login failed try again: <Link to="/login">Login Page</Link>
                            </div>
                        </>
                    )}
                </Grid>
            </Container>
        </Box>
    );
};

export default SSORedirect;
