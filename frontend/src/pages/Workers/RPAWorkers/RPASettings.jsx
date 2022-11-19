import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, FormControl, InputLabel, List, ListItem, MenuItem, Select, Typography } from '@mui/material';
import React, { useReducer } from 'react';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { useTheme } from '@emotion/react';
import { DateTime } from 'luxon';

const ConnectURL = 'https://demo.dataplane.app/rworker/connect/f176d9dd-830c-4570-bf93-7fa890262796';

const initialState = {
    storedKeys: [],
    expiration: 0,
    openDialog: false,
    keyToBeDeleted: null,
};

function reducer(state, action) {
    switch (action.type) {
        case 'set':
            return { ...state, [action.key]: action.value };
        case 'addKey':
            return { ...state, storedKeys: [action.value, ...state.storedKeys] };
        case 'deleteKey':
            return { ...state, storedKeys: state.storedKeys.filter((a) => a.apiKey !== action.value) };
        default:
            throw new Error(`Unhandled action type: ${action.type}`);
    }
}

export default function RPASSettings() {
    const theme = useTheme();

    const [state, dispatch] = useReducer(reducer, initialState);

    function onGenerateKey() {
        const expiresAt = state.expiration === 0 ? null : DateTime.now().plus({ months: state.expiration }).toISO();
        // addDeploymentApiKey(expiresAt);
    }

    return (
        <Box pt={2}>
            <Typography variant="h2" fontSize="1.25rem">
                Connect RPA Worker {'>'} Jack's computer
            </Typography>
            <Typography variant="h3" fontSize="1.1875rem" fontWeight={700} mt={6}>
                Steps to connect
            </Typography>
            <Typography fontSize="0.8125rem" mt={3}>
                1. Download and install a RPA worker to your computer -
                <Typography fontSize="0.8125rem" color="primary.main" sx={{ cursor: 'pointer', display: 'inline' }}>
                    {' '}
                    download link
                </Typography>
            </Typography>
            <Typography fontSize="0.8125rem" mt={2}>
                2. To connect, the RPA worker will ask for a Dataplane Connect URL and access key
            </Typography>

            <Typography variant="h4" fontSize="0.9375rem" fontWeight={700} mt={6}>
                Dataplane Connect URL
            </Typography>
            <Box display="flex" alignItems="center">
                <Typography lineHeight={1.875}>{ConnectURL}</Typography>
                <Button
                    onClick={() => navigator.clipboard.writeText(ConnectURL)}
                    type="submit"
                    variant="contained"
                    size="small"
                    color="primary"
                    sx={{ background: '#8a8a8a' }}
                    style={{ paddingLeft: '16px', paddingRight: '16px', marginLeft: '16px' }}>
                    Copy URL
                </Button>
            </Box>

            <Typography fontSize="0.8125rem" mt={6}>
                3. Create an activation key. On creation, this key is only shown once.
            </Typography>

            <Box display="flex" alignItems="center" mt={6} width="800px">
                <Typography variant="h4" fontSize="0.9375rem" fontWeight={700} alignSelf="end">
                    Activation key
                </Typography>
                <FormControl sx={{ marginLeft: 'auto', width: '220px' }}>
                    <InputLabel id="key-label">Expires in</InputLabel>
                    <Select
                        sx={{ height: '32px' }}
                        labelId="select-expiration-label"
                        value={state.expiration}
                        label="Expires in"
                        onChange={(e) => dispatch({ type: 'set', key: 'expiration', value: e.target.value })}>
                        <MenuItem value={0}>never</MenuItem>
                        <MenuItem value={3}>3 months</MenuItem>
                        <MenuItem value={6}>6 months</MenuItem>
                        <MenuItem value={9}>9 months</MenuItem>
                        <MenuItem value={12}>12 months</MenuItem>
                        <MenuItem value={24}>24 months</MenuItem>
                    </Select>
                </FormControl>
                <Button
                    size="small"
                    onClick={onGenerateKey}
                    type="submit"
                    variant="contained"
                    color="primary"
                    style={{ paddingLeft: '16px', paddingRight: '16px', marginLeft: '20px' }}>
                    Generate key
                </Button>
            </Box>

            <List sx={{ width: '800px', marginTop: '8px' }}>
                {keys.map((apiKey, idx) => (
                    <ListItem
                        key={apiKey.apiKey}
                        sx={{
                            borderTop: '1px solid #BABABA',
                            paddingLeft: 0,
                            borderBottom: idx === keys.length - 1 ? '1px solid #BABABA' : null,
                        }}>
                        <Typography sx={{ background: apiKey.apiKeyTail ? 'null' : theme.palette.apiKey.background, borderRadius: '6px', padding: '5px 15px' }}>
                            {formatAPIKey(apiKey)}
                        </Typography>
                        <Typography ml={0} position="absolute" left="245px">
                            {formatDate(apiKey.expiresAt)}
                        </Typography>
                        {apiKey.apiKeyTail ? (
                            <Box
                                onClick={() => {
                                    dispatch({ type: 'set', key: 'openDialog', value: true });
                                    dispatch({ type: 'set', key: 'keyToBeDeleted', value: { key: apiKey.apiKey, tail: apiKey.apiKeyTail } });
                                }}
                                component={FontAwesomeIcon}
                                ml="auto"
                                sx={{ fontSize: '17px', mr: '7px', color: 'rgba(248, 0, 0, 1)', cursor: 'pointer' }}
                                icon={faTrashAlt}
                            />
                        ) : (
                            <Button
                                onClick={() => navigator.clipboard.writeText(apiKey.apiKey)}
                                type="submit"
                                variant="contained"
                                color="primary"
                                sx={{ background: '#8a8a8a' }}
                                style={{ paddingLeft: '16px', paddingRight: '16px', marginLeft: 'auto' }}>
                                Copy key
                            </Button>
                        )}
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}

const keys = [
    {
        triggerID: '6ee9bfba-87b4-4845-91b3-34b227065ea7',
        apiKey: '$2a$10$Q6mmYUovbhuzkVT0Q.sYVO61ObGGOoUtq6IV5urhVbLXfadp15Sv2',
        apiKeyTail: 'RQquh',
        pipelineID: '2cc07758-fe7c-4a73-aea0-cd44a80a08c0',
        environmentID: '52e7433c-b550-42a6-b435-81a7c3323fb9',
        expiresAt: null,
    },
    {
        triggerID: '6ee9bfba-87b4-4845-91b3-34b227065ea7',
        apiKey: '$2a$10$EZ5sLbPEYimr8gfNQXQTv..Pev0jjAFYkhbu4iogSj0f3cyPPrkOG',
        apiKeyTail: '1T5bt',
        pipelineID: '2cc07758-fe7c-4a73-aea0-cd44a80a08c0',
        environmentID: '52e7433c-b550-42a6-b435-81a7c3323fb9',
        expiresAt: null,
    },
];

function formatAPIKey(apiKey) {
    if (apiKey.apiKeyTail) {
        return `*****-*****-*****-${apiKey.apiKeyTail}`;
    }
    return apiKey.apiKey;
}

function formatDate(date) {
    if (!date) return 'Never expires';

    const expiresAt = DateTime.fromISO(date);
    const diff = expiresAt.diff(DateTime.now(), ['months', 'days', 'hours']);
    const monthString = diff.months === 0 ? '' : diff.months === 1 ? `${diff.months} month` : `${diff.months} months`;
    const dayString = diff.days === 0 ? '' : diff.days === 1 ? ` ${diff.days} day` : ` ${diff.days} days`;
    const diffString = `(${monthString + dayString})`;

    return `Expires on the ${DateTime.fromISO(date).toFormat('dd LLLL yyyy')} ${diffString}`;
}
