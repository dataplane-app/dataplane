import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, Link, Typography } from '@mui/material';
import { useState } from 'react';
import { IOSSwitch } from '../../SchedulerDrawer/IOSSwitch';

const APITRiggerDrawer = ({ handleClose, refreshData }) => {
    const [isPublicOnline, setIsPublicOnline] = useState(true);
    const [isPrivateOnline, setIsPrivateOnline] = useState(true);
    const [isAPIKey, setIsAPIKey] = useState(true);
    const [publicAPI, setPublicAPI] = useState('https://demo.dataplane.app/app/public/api-trigger/f176d9dd-830c-4570-bf93-7fa890262796');
    const [privateAPI, setPrivateAPI] = useState('https://{{ HOST }}/app/private/api-trigger/f176d9dd-830c-4570-bf93-7fa890262796');

    return (
        <Box position="relative" width="100%">
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
                    <Typography variant="body1" fontSize="1.1875rem" lineHeight={2}>
                        Public API endpoint
                    </Typography>
                    <Typography variant="subtitle2" fontWeight={400}>
                        Anyone with this link can trigger this workflow.
                    </Typography>
                    <Box display="flex" alignItems="center" mt={3}>
                        <IOSSwitch onClick={() => setIsPublicOnline(!isPublicOnline)} checked={isPublicOnline} inputProps={{ 'aria-label': 'controlled' }} />
                        <Typography fontSize={13} ml={1.5} color={isPublicOnline ? 'status.pipelineOnlineText' : '#F80000'}>
                            {isPublicOnline ? 'Live' : 'Offline'}
                        </Typography>
                        <Box display="flex" alignItems="center" position="absolute" ml={15}>
                            <Typography>
                                <Link href={publicAPI} color="text.primary" target="_blank" rel="noreferrer">
                                    {publicAPI}
                                </Link>
                            </Typography>
                            <Button //
                                onClick={() => navigator.clipboard.writeText(publicAPI)}
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
                    <Typography variant="body1" fontSize="1.1875rem" lineHeight={2}>
                        Private API endpoint
                    </Typography>
                    <Typography>
                        Servers in your private networking can access this link. Replace &#123;&#123; HOST &#125;&#125; with network location. For example, in Kubernetes, it will
                        be your service.
                    </Typography>
                    <Box display="flex" alignItems="center" mt={3}>
                        <IOSSwitch onClick={() => setIsPrivateOnline(!isPrivateOnline)} checked={isPrivateOnline} inputProps={{ 'aria-label': 'controlled' }} />
                        <Typography fontSize={13} ml={1.5} color={isPrivateOnline ? 'status.pipelineOnlineText' : '#F80000'}>
                            {isPrivateOnline ? 'Live' : 'Offline'}
                        </Typography>
                        <Box display="flex" alignItems="center" position="absolute" ml={15}>
                            <Typography>
                                <Link href={privateAPI} color="text.primary" target="_blank" rel="noreferrer">
                                    {privateAPI}
                                </Link>
                            </Typography>
                            <Button //
                                onClick={() => navigator.clipboard.writeText(privateAPI)}
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
                <Box>
                    <Typography variant="body1" fontSize="1.1875rem" lineHeight={2}>
                        API Key (optional)
                    </Typography>
                    <Typography>
                        Enable an API key for additional security. The key will be stored in Secrets. The key will only be shown once. New keys can be created or rotated using the
                        generate key button. To keep services running without interruption, the old key will remain active and expire after 24 hours or you can make the key expire
                        sooner.
                    </Typography>
                    <Box display="flex" alignItems="center" mt={3}>
                        <IOSSwitch
                            sx={{
                                '.MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: 'primary.main',
                                },
                                '.MuiSwitch-track': {
                                    backgroundColor: '#8a8a8a',
                                    color: '#8a8a8a',
                                    opacity: 0.5,
                                    border: 0,
                                },
                            }}
                            onClick={() => setIsAPIKey(!isAPIKey)}
                            checked={isAPIKey}
                            inputProps={{ 'aria-label': 'controlled' }}
                        />
                        <Typography fontSize={13} ml={1.5} color={isAPIKey ? 'cyan.main' : 'text.primary'}>
                            {isAPIKey ? 'Use an API key' : 'No key'}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default APITRiggerDrawer;
