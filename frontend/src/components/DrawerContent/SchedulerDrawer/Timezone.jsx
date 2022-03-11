import { Autocomplete, TextField } from '@mui/material';
import ct from 'countries-and-timezones';
import { useSnackbar } from 'notistack';
import { useEffect } from 'react';
import { useMe } from '../../../graphql/me';
import { useGlobalFlowState } from '../../../pages/Flow';

export function Timezone({ timezone, setTimezone }) {
    // Flow state
    const FlowState = useGlobalFlowState();

    // Graphql hook
    const getMe = useMeHook(setTimezone, timezone);

    // Get timezone on load
    useEffect(() => {
        // Check if there is a timezone set, if not get user's timezone
        if (FlowState.selectedElement?.data?.genericdata?.timezone?.get()) return;
        // getMe();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [FlowState.selectedElement?.data?.genericdata?.timezone?.get()]);

    return (
        <Autocomplete
            id="timezone-autocomplete"
            sx={{ width: 400 }}
            value={timezone}
            onChange={(event, newValue) => {
                setTimezone(newValue);
            }}
            options={Object.keys(ct.getAllTimezones())}
            renderInput={(params) => (
                <TextField
                    {...params} //
                    label="Timezone"
                    id="timezone"
                    size="small"
                    sx={{ fontSize: '.75rem', display: 'flex' }}
                />
            )}
        />
    );
}

const useMeHook = (setTimezone, timezone) => {
    // GraphQL hook
    const getMe = useMe();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get timezone
    return async () => {
        const response = await getMe();

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get timezone: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setTimezone(response.timezone);
        }
    };
};
