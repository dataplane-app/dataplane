import { Autocomplete, TextField } from '@mui/material';
import ct from 'countries-and-timezones';

export function Timezone({ timezone, setTimezone }) {
    return (
        <Autocomplete
            id="timezone-autocomplete"
            sx={{ width: 400 }}
            value={timezone}
            onChange={(event, newValue) => {
                setTimezone(newValue);
            }}
            disableClearable
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
