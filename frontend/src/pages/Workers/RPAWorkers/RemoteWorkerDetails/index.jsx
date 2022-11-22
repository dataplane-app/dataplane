import { Box, Button, Grid, Typography } from '@mui/material';
import React from 'react';
import ProcessGroups from './ProcessGroups';
import Control from './Control';
import Details from './Details';
import Environments from './Environments';
import { useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

export default function RPAManage() {
    const history = useHistory();

    return (
        <Box className="page" width="83%">
            <Grid container alignItems="center">
                <Typography component="h2" variant="h2" color="text.primary">
                    RPA Workers {'>'} Jack’s computer
                </Typography>

                <Button
                    onClick={() => history.push('/remote/workers')}
                    style={{ paddingLeft: '16px', paddingRight: '16px', marginLeft: 'auto' }}
                    variant="text"
                    startIcon={<FontAwesomeIcon icon={faTimes} />}>
                    Close
                </Button>
            </Grid>

            <Grid container mt="2.56rem" alignItems="flex-start" gap="5%" justifyContent="space-between" flexWrap="nowrap">
                <Grid item minWidth="250px" width="250px" mb={2}>
                    <Details
                        environmentId={'Production'}
                        // accessGroup={accessGroup}
                        //  getAccessGroup={getAccessGroup}
                    />

                    <Box sx={{ margin: '2.45rem 0', borderTop: 1, borderColor: 'divider' }}></Box>

                    <Control
                        environmentId={'Production'}
                        //  accessGroup={accessGroup} getAccessGroup={getAccessGroup}
                    />
                </Grid>
                <Grid item sx={{ flex: 1, display: 'flex', justifyContent: 'center', flexDirection: 'column' }} mb={2}>
                    <ProcessGroups environmentId={'accessGroup.EnvironmentID'} />
                </Grid>
                <Grid item sx={{ flex: 1 }}>
                    <Environments environmentId={'accessGroup.EnvironmentID'} />
                </Grid>
            </Grid>
        </Box>
    );
}
