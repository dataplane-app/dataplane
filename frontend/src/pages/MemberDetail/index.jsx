import { Box, Grid, Typography } from '@mui/material';
import CustomChip from '../../components/CustomChip';
import { useGlobalMeState } from '../../components/Navbar';
import LeftColumn from './LeftColumn';
import MiddleColumn from './MiddleColumn';
import RightColumn from './RightColumn';

const MemberDetail = () => {
    // Global state
    const MeData = useGlobalMeState();

    if (!MeData.user_id.get()) return null;
    return (
        <Box className="page" width="83%">
            {/* Top layer, title */}
            <Grid container alignItems="center">
                <Typography component="h2" variant="h2" color="text.primary">
                    My Account
                </Typography>

                <Grid item ml={4}>
                    {MeData.status.get() === 'active' ? <CustomChip label="Active" customColor="green" margin={1} /> : <CustomChip label="Inactive" customColor="red" margin={1} />}
                    {MeData.user_type.get() === 'admin' && <CustomChip label="Admin" customColor="orange" />}
                </Grid>
            </Grid>

            {/* 3 columns */}
            <Grid container mt={5} alignItems="flex-start" gap="5%" justifyContent="space-between" flexWrap="nowrap">
                {/* Details and Control */}
                <LeftColumn />

                {/* Belongs to Environments and Belongs to Access groups */}
                <MiddleColumn />

                {/* Permissions */}
                <RightColumn />
            </Grid>
        </Box>
    );
};

export default MemberDetail;
