import { Box, Typography, Button, Grid } from '@mui/material';
import Search from '../../components/Search';
import { useState } from 'react';

export default function Permissions() {
    return (
        <Box>
            <Typography component="h3" variant="h3" color="text.primary">
                Permissions
            </Typography>

            <Grid mt={2} display="flex" alignItems="center">
                <Search placeholder="Find platform permissions" />
                <Button variant="contained" color="primary" height="100%" sx={{ ml: 1 }}>
                    Add
                </Button>
            </Grid>

            <Box mt={4}>
                <Typography component="h3" variant="h3" color="text.primary">
                    Platform
                </Typography>
            </Box>

            <Box mt={2}>
                {/* {platformItems.map((plat) => (
                                <Grid display="flex" alignItems="center" key={plat.id} mt={1.5} mb={1.5}>
                                    <Box component={FontAwesomeIcon} sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)' }} icon={faTrashAlt} />
                                    <Typography variant="subtitle2" lineHeight="15.23px">
                                        {plat.name}
                                    </Typography>
                                </Grid>
                            ))} */}
            </Box>
            <Box mt="2.31rem">
                <Typography component="h3" variant="h3" color="text.primary">
                    Environment permissions
                </Typography>
                <Typography variant="subtitle2" mt=".20rem">
                    Environment: Production
                </Typography>

                <Box mt={2}>
                    {/* {environmentPermissions.map((env) => (
                                    <Grid display="flex" alignItems="center" key={env.id} mt={1.5} mb={1.5}>
                                        <Box component={FontAwesomeIcon} sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)' }} icon={faTrashAlt} />
                                        <Typography variant="subtitle2" lineHeight="15.23px">
                                            {env.name}
                                        </Typography>
                                    </Grid>
                                ))} */}
                </Box>
            </Box>
        </Box>
    );
}
