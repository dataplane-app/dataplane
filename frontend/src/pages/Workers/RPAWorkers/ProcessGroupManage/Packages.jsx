import * as React from 'react';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { Button, Typography } from '@mui/material';

export default function Packages() {
    const [type, setType] = React.useState('python');

    const handleChange = (event) => {
        setType(event.target.value);
    };

    return (
        <>
            <Box sx={{ width: 344 }}>
                <FormControl fullWidth size="small">
                    <Select //
                        defaultValue="python"
                        labelId="select-label"
                        id="select"
                        value={type}
                        onChange={handleChange}>
                        <MenuItem value={'python'}>Python</MenuItem>
                        <MenuItem value={'bash'}>Bash</MenuItem>
                    </Select>
                </FormControl>
            </Box>
            <Box sx={{ width: 344, height: 355, border: '1px solid rgba(0, 0, 0, 0.23)', mt: 1, p: '6px 6px 6px 16px', borderRadius: '5px' }}>
                <Box display="flex" alignItems="center" width="100%">
                    <Typography variant="subtitle1" fontWeight={700}>
                        Python packages
                    </Typography>
                    <Button variant="text" sx={{ ml: 'auto' }}>
                        Edit
                    </Button>
                </Box>
                {packages.map((a) => (
                    <Typography key={a} variant="subtitle1">
                        {a}
                    </Typography>
                ))}
            </Box>
        </>
    );
}

const packages = ['pandas==1.4.0', 'numpy==1.3.0'];
// ----------- Custom Hooks --------------------------------
