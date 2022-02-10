import { Box, Grid, Typography, TextField, MenuItem, Button, Drawer } from '@mui/material';
import Search from '../components/Search';
import CustomChip from '../components/CustomChip';
import PipelineTable from '../components/TableContent/PipelineTable';
import MoreInfoMenu from '../components/MoreInfoMenu';
import PipelinePageItem from '../components/MoreInfoContent/PipelinePageItem';
import { useGlobalEnvironmentState } from '../components/EnviromentDropdown';
import { useState } from 'react';
import CreatePipelineDrawer from '../components/DrawerContent/CreatePipelineDrawer';

const Pipelines = () => {
    // States
    const [isOpenCreatePipeline, setIsOpenPipeline] = useState(false);

    // Global user states with hookstate
    const Environment = useGlobalEnvironmentState();

    return (
        <Box className="page" position="relative">
            <Box sx={{ width: { xl: '85%' } }}>
                <Grid container alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography component="h2" variant="h2" color="text.primary">
                            Pipelines
                        </Typography>

                        <Typography variant="subtitle2" mt=".20rem">
                            Environment: {Environment.name.get()}
                        </Typography>
                    </Box>

                    <Box display="flex" alignItems="center">
                        <Button variant="contained" onClick={() => setIsOpenPipeline(true)}>
                            Create
                        </Button>

                        <Box sx={{ position: { xxs: 'relative', xl: 'absolute' }, ml: { xxs: 2, xl: 0 }, top: '0', right: '0' }}>
                            <MoreInfoMenu>
                                <PipelinePageItem handleRefresh={() => {}} />
                            </MoreInfoMenu>
                        </Box>
                    </Box>
                </Grid>

                <Grid container mt={4} direction="row" alignItems="center" justifyContent="flex-start">
                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center' }}>
                        <CustomChip amount={2} label="Pipelines" margin={1} customColor="orange" />
                        <CustomChip amount={2} label="Succeeded" margin={1} customColor="green" />
                        <CustomChip amount={2} label="Failed" margin={1} customColor="red" />
                        <CustomChip amount={2} label="Workers online" margin={2} customColor="purple" />
                    </Grid>

                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center', flex: 1 }}>
                        <Box flex={1.2} width="100%" flexGrow={1.2}>
                            <Search placeholder="Find a pipeline" width="100%" />
                        </Box>
                        <TextField label="Last 48 hours" id="last" select size="small" required sx={{ ml: 2, flex: 1 }}>
                            <MenuItem value="24">Last 24 hours</MenuItem>
                        </TextField>
                    </Grid>

                    <PipelineTable />
                </Grid>
            </Box>

            <Drawer anchor="right" open={isOpenCreatePipeline} onClose={() => setIsOpenPipeline(!isOpenCreatePipeline)}>
                <CreatePipelineDrawer handleClose={() => setIsOpenPipeline(false)} />
            </Drawer>
        </Box>
    );
};

export default Pipelines;
