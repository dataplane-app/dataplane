import { MenuItem } from '@mui/material';
import { useHistory } from 'react-router-dom';

const PipelineItemTable = (props) => {
    // React router
    const history = useHistory();

    //Props
    const { handleCloseMenu, handleOpenManage, id, name, setIsOpenDeletePipeline } = props;

    const manageClick = () => {
        handleCloseMenu();
        handleOpenManage();
    };

    const permissionClick = () => {
        handleCloseMenu();
        history.push({ pathname: `/pipelines/permissions/${id}`, state: name });
    };

    const deleteClick = () => {
        handleCloseMenu();
        setIsOpenDeletePipeline(true);
    };

    return (
        <>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={manageClick}>
                Edit
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={permissionClick}>
                Permissions
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Deploy
            </MenuItem>
            <MenuItem sx={{ color: 'cyan.main' }} onClick={() => props.handleCloseMenu()}>
                Turn off
            </MenuItem>
            <MenuItem sx={{ color: 'error.main' }} onClick={deleteClick}>
                Delete
            </MenuItem>
        </>
    );
};

export default PipelineItemTable;
