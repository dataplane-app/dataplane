import { useState } from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import Search from '../../components/Search';

export default function Members() {
    return (
        <>
            <Typography component="h3" variant="h3" color="text.primary">
                Members (10)
            </Typography>

            <Grid mt={2} display="flex" alignItems="center">
                <Search placeholder="Find members" />
                <Button variant="contained" color="primary" height="100%" sx={{ ml: 1 }}>
                    Add
                </Button>
            </Grid>

            <Box mt="1.31rem">
                <Grid display="flex" alignItems="center" mt={1.5} mb={1.5}>
                    <Box component={FontAwesomeIcon} sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)' }} icon={faTrashAlt} />
                    <Typography variant="subtitle2" lineHeight="15.23px" color="primary" fontWeight="900">
                        Saul Frank
                    </Typography>
                </Grid>
            </Box>
        </>
    );
}
