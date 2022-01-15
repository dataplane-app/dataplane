import { Box, Typography, Button, TextField } from '@mui/material';
import { useState } from 'react';

export default function Details() {
    return (
        <>
            <Typography component="h3" variant="h3" color="text.primary">
                Details
            </Typography>

            <Box mt={2} display="grid" flexDirection="row">
                <TextField label="Access group name" id="access_group_name" size="small" required sx={{ mb: '.45rem' }} />
                <TextField label="Description" id="description" size="small" sx={{ mb: '.45rem' }} />

                <Button variant="contained" color="primary" sx={{ width: '100%', mt: '1.375rem' }}>
                    Save
                </Button>
            </Box>
        </>
    );
}
