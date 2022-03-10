import { Autocomplete, TextField } from '@mui/material';
import ct from 'countries-and-timezones';
import { useSnackbar } from 'notistack';
import { useEffect } from 'react';
import { useMe } from '../../../graphql/me';

export function Timezone({ timezone, setTimezone }) {
    // Graphql hook
    const getMe = useMeHook(setTimezone);

    // Get timezone on load
    useEffect(() => {
        getMe();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Autocomplete
            value={timezone}
            id="timezone-autocomplete"
            sx={{ width: 400 }}
            onChange={(event, newValue) => {
                setTimezone(newValue);
            }}
            options={Object.keys(ct.getAllTimezones())}
            renderInput={(params) => <TextField {...params} label="Timezone" id="timezone" size="small" sx={{ fontSize: '.75rem', display: 'flex' }} />}
        />
    );
}

const useMeHook = (setTimezone) => {
    // GraphQL hook
    const getMe = useMe();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get user permissions
    return async () => {
        const response = await getMe();

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't user permissions: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setTimezone(response.timezone);
        }
    };
};
