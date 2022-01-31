import { MenuItem } from '@mui/material';

const RemoveLogsPageItem = (props) => {
    const yamlClick = () => {
        props.handleCloseMenu();
        props.handleOpenYaml();
    };

    return (
        <>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Pipeline
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Analytics
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={yamlClick}>
                YAML
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Reload
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Deploy
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Run
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Turn off
            </MenuItem>
        </>
    );
};

export default RemoveLogsPageItem;
