import { Box, Button, Grid, Typography } from '@mui/material';
import { forwardRef } from 'react';
import { useGlobalEditorState } from '../../../pages/Editor';
import CustomDragHandle from '../../CustomDragHandle';
import { v4 as uuidv4 } from 'uuid';

const PackageColumn = forwardRef(({ children, ...rest }, ref) => {
    const Editor = useGlobalEditorState();
    const handleEdit = () => {
        const newFolderMock = {
            id: uuidv4(),
            name: 'requirements.txt',
            children: [],
            fType: 'folder',
            // parentID: selected,
        };

        Editor.tabs.merge([newFolderMock]);
        Editor.selectedFile.set(newFolderMock);
    };

    return (
        <div {...rest}>
            <Box
                sx={{
                    backgroundColor: 'background.main',
                    border: '1px solid  #D3D3D3',
                    borderRadius: '7px',
                    p: 1,
                    height: '100%',
                }}>
                <Grid container alignItems="center" justifyContent="space-between">
                    <Typography fontSize={12} fontWeight={700}>
                        Packages
                    </Typography>
                    <Button variant="text" onClick={handleEdit} fontWeight={700} sx={{ color: 'primary.main' }}>
                        <Typography fontSize={12}>Edit</Typography>
                    </Button>
                </Grid>

                <Box mt={1.2}>
                    <Typography variant="subtitle1">pandas==1.4.0</Typography>
                </Box>
            </Box>
            {children}
            <CustomDragHandle />
        </div>
    );
});

export default PackageColumn;
