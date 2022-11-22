import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import ServerWorkers from './ServerWorkers/ServerWorkers';
import RemoteProcessGroups from './RPAWorkers';
import { useHistory } from 'react-router-dom';

export default function Workers({ tab }) {
    const [value] = React.useState(tab);

    const history = useHistory();

    const handleChange = (event) => {
        event.target.id === 'tab-0' && history.push('/workers');
        event.target.id === 'tab-1' && history.push('/remoteprocessgroups');
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                    <Tab label="Server Workers" id="tab-0" aria-controls="tabpanel-0" sx={{ px: 0, color: 'primary.main' }} />
                    <Tab label="RPA Workers" id="tab-1" aria-controls="tabpanel-1" sx={{ ml: 2, px: 0, color: 'primary.main' }} />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                <ServerWorkers />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <RemoteProcessGroups />
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
