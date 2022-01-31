import { MenuItem } from '@mui/material';
import { useHistory } from 'react-router-dom';

const PipelineItemTable = (props) => {
    // React router
    const history = useHistory();

    //Props
    const { handleCloseMenu, handleOpenYaml, id } = props;

    const yamlClick = () => {
        handleCloseMenu();
        handleOpenYaml();
    };

    const permissionClick = () => {
        handleCloseMenu();
        history.push(`/pipelines/permissions/${id}`);
    };

    return (
        <>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={yamlClick}>
                View YAML
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Turn off
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={permissionClick}>
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
