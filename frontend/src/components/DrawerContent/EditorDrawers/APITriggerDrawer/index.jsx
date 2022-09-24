import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Drawer, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGeneratePipelineTrigger } from '../../../../graphql/generatePipelineTrigger';
import { useGlobalEnvironmentState } from '../../../EnviromentDropdown';
import { IOSSwitch } from '../../SchedulerDrawer/IOSSwitch';
import { v4 as uuidv4 } from 'uuid';
import { useGetPipelineTrigger } from '../../../../graphql/getPipelineTrigger';
import ApiKey from './ApiKey';
import ApiTriggerExampleDrawer from '../../ApiTriggerExampleDrawer';

const host = process.env.REACT_APP_DATAPLANE_ENDPOINT;
const PUBLIC = `${host}/app/public/api-trigger/`;
const PRIVATE = `https://{{ HOST }}/app/private/api-trigger/`;

const APITRiggerDrawer = ({ handleClose }) => {
    // Global state
    const Environment = useGlobalEnvironmentState();

    // Local state
    const [publicLive, setPublicLive] = useState(true);
    const [privateLive, setPrivateLive] = useState(true);
    const [apiKeyActive, setApiKeyActive] = useState(true);
    const [triggerID, setTriggerID] = useState(() => uuidv4());
    const [isOpenExampleDrawer, setIsOpenExampleDrawer] = useState(false);
    const [isExamplePrivate, setIsExamplePrivate] = useState(false);

    // Custom GraphQL hooks
    const generatePipelineTrigger = useGeneratePipelineTriggerHook(Environment.id.get(), triggerID, apiKeyActive, publicLive, privateLive, handleClose);
    const getPipelineTriggerHook = useGetPipelineTriggerHook(Environment.id.get(), setTriggerID, setApiKeyActive, setPublicLive, setPrivateLive);

    useEffect(() => {
        getPipelineTriggerHook();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.id.get()]);

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
                            onClick={generatePipelineTrigger}
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
                        <Typography variant="body1" fontSize="1.1875rem" lineHeight={2}>
                            Public API endpoint
                        </Typography>
                        <Typography onClick={() => setIsOpenExampleDrawer(true)} fontSize="0.8125rem" color="primary.main" ml={3} sx={{ cursor: 'pointer' }}>
                            See example
                        </Typography>
                    </Box>
                    <Typography variant="subtitle2" fontWeight={400}>
                        Anyone with this link can trigger this workflow.
                    </Typography>
                    <Box display="flex" alignItems="center" mt={3}>
                        <IOSSwitch onClick={() => setPublicLive(!publicLive)} checked={publicLive} inputProps={{ 'aria-label': 'controlled' }} />
                        <Typography fontSize={13} ml={1.5} color={publicLive ? 'status.pipelineOnlineText' : '#F80000'}>
                            {publicLive ? 'Live' : 'Offline'}
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

                <Box mb={4} />

                {/* Private API endpoint */}
                <Box>
                    <Box display="flex" alignItems="center">
                        <Typography variant="body1" fontSize="1.1875rem" lineHeight={2}>
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

                    <Typography>
                        Servers in your private networking can access this link. Replace &#123;&#123; HOST &#125;&#125; with network location. For example, in Kubernetes, it will
                        be your service.
                    </Typography>

                    <Box display="flex" alignItems="center" mt={3}>
                        <IOSSwitch onClick={() => setPrivateLive(!privateLive)} checked={privateLive} inputProps={{ 'aria-label': 'controlled' }} />
                        <Typography fontSize={13} ml={1.5} color={privateLive ? 'status.pipelineOnlineText' : '#F80000'}>
                            {privateLive ? 'Live' : 'Offline'}
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

                <Box mb={4} />

                {/* API Key */}
                <ApiKey apiKeyActive={apiKeyActive} setApiKeyActive={setApiKeyActive} environmentID={Environment.id.get()} triggerID={triggerID} />
            </Box>
            <Drawer
                anchor="right"
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
                    host={isExamplePrivate ? 'https://{{ HOST }}' : host}
                    triggerID={triggerID}
                    isExamplePrivate={isExamplePrivate}
                />
            </Drawer>
        </Box>
    );
};

export default APITRiggerDrawer;

// ---------- Custom Hooks

const useGeneratePipelineTriggerHook = (environmentID, triggerID, apiKeyActive, publicLive, privateLive, handleClose) => {
    // GraphQL hook
    const generatePipelineTrigger = useGeneratePipelineTrigger();

    const { enqueueSnackbar } = useSnackbar();

    // URI parameter
    const { pipelineId } = useParams();

    // Get access groups
    return async () => {
        const response = await generatePipelineTrigger({
            pipelineID: pipelineId,
            environmentID,
            triggerID,
            apiKeyActive,
            publicLive,
            privateLive,
        });

        if (response.r || response.error) {
            enqueueSnackbar("Can't generate api triggers: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            enqueueSnackbar('Success', { variant: 'success' });
            handleClose();
        }
    };
};

const useGetPipelineTriggerHook = (environmentID, setTriggerID, setApiKeyActive, setPublicLive, setPrivateLive) => {
    // GraphQL hook
    const getPipelineTrigger = useGetPipelineTrigger();

    const { enqueueSnackbar } = useSnackbar();

    // URI parameter
    const { pipelineId } = useParams();

    // Get access groups
    return async () => {
        const response = await getPipelineTrigger({ pipelineID: pipelineId, environmentID });

        if (response.r || response.error) {
            enqueueSnackbar("Can't get api triggers: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            if (response.errors[0].message === 'record not found') return;
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            const { triggerID, publicLive, privateLive, apiKeyActive } = response;
            setTriggerID(triggerID);
            setApiKeyActive(apiKeyActive);
            setPublicLive(publicLive);
            setPrivateLive(privateLive);
        }
    };
};
