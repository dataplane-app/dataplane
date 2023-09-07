import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Drawer, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useGlobalEnvironmentState } from '../../../../components/EnviromentDropdown/index.jsx';
import { IOSSwitch } from '../../../Pipelines/Components/Drawers/SchedulerDrawer/IOSSwitch.jsx';
import ApiKey from './ApiKey.jsx';
import ApiTriggerExampleDrawer from '../../../Pipelines/Components/configureNodes/APITriggerNodeItem/ApiTriggerExampleDrawer/index.jsx';
import { useForm } from 'react-hook-form';

let host = import.meta.env.VITE_DATAPLANE_ENDPOINT;
if (host === '') {
    host = window.location.origin;
}
const PUBLIC = `${host}/publicapi/deployment/api-trigger/latest/`;
const PRIVATE = `https://{{ HOST }}/privateapi/deployment/api-trigger/latest/`;

const DeployAPITRiggerDrawer = ({ handleClose, triggerID, switches, generateDeploymentTrigger, setDataSizeLimit }) => {
    // Global state
    const Environment = useGlobalEnvironmentState();

    // Local state
    const [isOpenExampleDrawer, setIsOpenExampleDrawer] = useState(false);
    const [isExamplePrivate, setIsExamplePrivate] = useState(false);

        // React hook form
        const {
            register,
            handleSubmit,
            getValues,
            formState: { errors },
            reset,
        } = useForm();

    return (
        <Box position="relative" width="100%" mb={10}>
            <Box sx={{ p: '4.125rem 3.81rem', paddingTop: '26px' }}>
                {/* Title and Save/Close buttons */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={8}>
                    {/* Title */}
                    <Box>
                        <Typography component="h2" variant="h2">
                            API Trigger
                        </Typography>
                    </Box>

                    {/* Save/Close buttons */}
                    <Box top="26px" right="39px" display="flex" alignItems="center">
                        <Button //
                            onClick={() => {
                                generateDeploymentTrigger();
                                handleClose();
                            }}
                            type="submit"
                            variant="contained"
                            color="primary"
                            style={{ paddingLeft: '26px', paddingRight: '26px', marginLeft: '20px' }}>
                            Save
                        </Button>
                        <Button
                            onClick={handleClose}
                            style={{ paddingLeft: '16px', paddingRight: '16px', marginLeft: '20px' }}
                            variant="text"
                            startIcon={<FontAwesomeIcon icon={faTimes} />}>
                            Close
                        </Button>
                    </Box>
                </Box>

                {/* Main section */}
                {/* Public API endpoint */}
                <Box>
                    <Box display="flex" alignItems="center">
                        <Typography variant="body1" fontSize="1.0625rem" lineHeight={2}>
                            Public API endpoint
                        </Typography>
                        <Typography onClick={() => setIsOpenExampleDrawer(true)} fontSize="0.8125rem" color="primary.main" ml={3} sx={{ cursor: 'pointer' }}>
                            See example
                        </Typography>
                    </Box>
                    <Typography variant="subtitle2" fontSize="0.75rem" fontWeight={400}>
                        To use a specific version, change “latest” with this format “1.2.4”
                    </Typography>
                    <Box display="flex" alignItems="center" mt={3}>
                        <IOSSwitch
                            onClick={() => generateDeploymentTrigger({ publicLive: !switches.publicLive })}
                            checked={switches.publicLive}
                            inputProps={{ 'aria-label': 'controlled' }}
                        />
                        <Typography fontSize={13} ml={1.5} color={switches.publicLive ? 'status.pipelineOnlineText' : '#F80000'}>
                            {switches.publicLive ? 'Live' : 'Offline'}
                        </Typography>
                        <Box display="flex" alignItems="center" position="absolute" ml={15}>
                            <Typography>{PUBLIC + triggerID}</Typography>
                            <Button //
                                onClick={() => navigator.clipboard.writeText(PUBLIC + triggerID)}
                                variant="contained"
                                sx={{ background: '#8a8a8a' }}
                                style={{ paddingLeft: '26px', paddingRight: '26px', marginLeft: '30px' }}>
                                Copy link
                            </Button>
                        </Box>
                    </Box>
                </Box>

                <Box mb={10} />

                {/* Private API endpoint */}
                <Box>
                    <Box display="flex" alignItems="center">
                        <Typography variant="body1" fontSize="1.0625rem" lineHeight={2}>
                            Private API endpoint
                        </Typography>
                        <Typography
                            onClick={() => {
                                setIsOpenExampleDrawer(true);
                                setIsExamplePrivate(true);
                            }}
                            fontSize="0.8125rem"
                            color="primary.main"
                            ml={3}
                            sx={{ cursor: 'pointer' }}>
                            See example
                        </Typography>
                    </Box>

                    <Typography fontSize="0.75rem">
                        Servers in your private networking can access this link. Replace &#123;&#123; HOST &#125;&#125; with network location. For example, in Kubernetes, it will
                        be your service.
                    </Typography>

                    <Box display="flex" alignItems="center" mt={3}>
                        <IOSSwitch
                            onClick={() => generateDeploymentTrigger({ privateLive: !switches.privateLive })}
                            checked={switches.privateLive}
                            inputProps={{ 'aria-label': 'controlled' }}
                        />
                        <Typography fontSize={13} ml={1.5} color={switches.privateLive ? 'status.pipelineOnlineText' : '#F80000'}>
                            {switches.privateLive ? 'Live' : 'Offline'}
                        </Typography>
                        <Box display="flex" alignItems="center" position="absolute" ml={15}>
                            <Typography>{PRIVATE + triggerID}</Typography>
                            <Button //
                                onClick={() => navigator.clipboard.writeText(PRIVATE + triggerID)}
                                variant="contained"
                                sx={{ background: '#8a8a8a' }}
                                style={{ paddingLeft: '26px', paddingRight: '26px', marginLeft: '30px' }}>
                                Copy link
                            </Button>
                        </Box>
                    </Box>
                </Box>

                <Box mb={10} />

                <Box>
                    <Typography variant="body1" fontSize="1.0625rem" lineHeight={2}>
                        API input data limits
                    </Typography>
                    <Typography fontSize="0.75rem">
                        Using the API trigger, data can be submitted as json. This data can be used across your pipeline. These settings provide limits on how much data can be submitted. The data size limit restricts the size of data in megabytes. The TTL limit is the amount of time in seconds data is retained for use across the pipeline until deleted. The default provided is 24 hours or 86400 seconds.
                        <br /><br />There is global limit set at the platform level for both these values, speak to your administrator if these need to be lifted.
                    </Typography>

                    <TextField
                        label="Data size (Megabytes)"
                        id="dataSize"
                        size="small"
                        defaultValue={5}
                        required
                        type="number"
                        sx={{ mt: 2, fontSize: '.75rem' }}
                        {...register('dataSize', { required: true })}
                    />&nbsp;&nbsp;

                    <TextField label="Data TTL (Seconds)" id="dataTTL" size="small"
                               type="number"
                               defaultValue={86400}
                               required
                               sx={{ mt: 2, mb: 2, fontSize: '.75rem' }}
                               {...register('dataTTL', { required: true, min: 1 })}
                    />

                </Box>

                <Box mb={10} />

                {/* API Key */}
                <ApiKey apiKeyActive={switches.apiKeyActive} generateDeploymentTrigger={generateDeploymentTrigger} environmentID={Environment.id.get()} triggerID={triggerID} />
            </Box>
            <Drawer
                anchor="right"
                sx={{ width: 'calc(50% )', [`& .MuiDrawer-paper`]: { width: 'calc(50%)' } }}
                open={isOpenExampleDrawer}
                onClose={() => {
                    setIsOpenExampleDrawer(false);
                    setIsExamplePrivate(false);
                }}>
                <ApiTriggerExampleDrawer
                    handleClose={() => {
                        setIsOpenExampleDrawer(false);
                        setIsExamplePrivate(false);
                    }}
                    //
                    host={isExamplePrivate ? PRIVATE : PUBLIC}
                    triggerID={triggerID}
                    isExamplePrivate={isExamplePrivate}
                />
            </Drawer>
        </Box>
    );
};

export default DeployAPITRiggerDrawer;
