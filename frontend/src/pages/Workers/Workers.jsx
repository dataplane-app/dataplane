import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import RPAWorkers from './RPAWorkers/RPAWorkers';
import ServerWorkers from './ServerWorkers/ServerWorkers';

export default function Workers() {
    const [value, setValue] = React.useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                    <Tab label="Server Workers" id="tab-0" aria-controls="tabpanel-0" sx={{ px: 0 }} />
                    <Tab label="RPA Workers" id="tab-0" aria-controls="tabpanel-0" sx={{ ml: 2, px: 0 }} />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                <ServerWorkers />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <RPAWorkers />
            </TabPanel>
        </Box>
    );
}

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div role="tabpanel" hidden={value !== index} id={`tab-${index}`} aria-labelledby={`tabpanel-${index}`} {...other}>
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
}
