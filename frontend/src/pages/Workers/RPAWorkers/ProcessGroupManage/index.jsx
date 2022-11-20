import { Box, Grid, Button, Typography } from '@mui/material';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import Control from './Control';
import Details from './Details';
import Environments from './Environments';
import Packages from './Packages';

export default function RPAProcessManage({ handleClose }) {
    return (
        <Box className="page" width="100%">
            <Grid container alignItems="center">
                <Typography component="h2" variant="h2" color="text.primary">
                    Process group {'>'} Python 1
                </Typography>
                <Button
                    onClick={handleClose}
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
                    <Environments environmentId={'accessGroup.EnvironmentID'} />
                </Grid>
                <Grid item sx={{ flex: 1 }}>
                    <Packages />
                </Grid>
            </Grid>
        </Box>
    );
}
