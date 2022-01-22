import { MenuItem } from '@mui/material';

const PipelineItemTable = (props) => {
    const yamlClick = () => {
        props.handleCloseMenu();
        props.handleOpenYaml();
    };

    return (
        <>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={yamlClick}>
                View YAML
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Turn off
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Permissions
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Reload
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Deploy
            </MenuItem>
            <MenuItem sx={{ color: 'error.main' }} onClick={() => props.handleCloseMenu()}>
                Delete
            </MenuItem>
        </>
    );
};

export default PipelineItemTable;
