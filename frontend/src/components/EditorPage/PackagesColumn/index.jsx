import { faExpandArrowsAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Grid, Typography } from '@mui/material';
import { forwardRef } from 'react';

const PackageColumn = forwardRef(({ children, ...rest }, ref) => {
    return (
        <div {...rest}>
            <Box
                sx={{
                    backgroundColor: 'background.main',
                    border: '1px solid  #D3D3D3',
                    borderRadius: '7px',
                    p: 1,
                    height: '100%',
                }}>
                <Grid container alignItems="center" justifyContent="space-between">
                    <Typography fontSize={12} fontWeight={700}>
                        Packages
                    </Typography>
                    <Button variant="text" fontWeight={700} sx={{ color: 'primary.main' }}>
                        <Typography fontSize={12}>Edit Requirements.txt</Typography>
                    </Button>
                </Grid>

                <Box mt={1.2}>
                    <Typography variant="subtitle1">pandas==1.4.0</Typography>
                </Box>
            </Box>
            {children}
            <Box sx={{ position: 'absolute', bottom: 2, left: 5, cursor: 'pointer' }}>
                <Box component={FontAwesomeIcon} icon={faExpandArrowsAlt} className="drag-handle" />
            </Box>
        </div>
    );
});

export default PackageColumn;
