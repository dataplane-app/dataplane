import { Box, Button, Grid, Typography } from '@mui/material';
import { forwardRef, useEffect, useState } from 'react';
import { useGlobalEditorState } from '../../../pages/Editor';
import CustomDragHandle from '../../CustomDragHandle';
import { useSnackbar } from 'notistack';
import { useGetCodePackages } from '../../../graphql/getCodePackages';

const PackageColumn = forwardRef(({ children, pipeline, ...rest }, ref) => {
    const Editor = useGlobalEditorState();

    const [packages, setPackages] = useState('');

    const handleEdit = () => {
        const newFolderMock = {
            id: 'requirements.txt',
            name: 'requirements.txt',
            fType: 'package',
            content: packages,
        };

        const activeTabs = Editor.tabs.get();
        if (activeTabs.some((a) => a.id === 'requirements.txt')) {
            const file = JSON.parse(JSON.stringify(activeTabs.filter((a) => a.id === 'requirements.txt')[0]));
            Editor.selectedFile.set(file);
            return;
        }

        Editor.tabs.merge([newFolderMock]);
        Editor.selectedFile.set(newFolderMock);
    };

    const getCodePackages = useGetCodePackagesHook(pipeline, setPackages);

    // Get packages on load
    useEffect(() => {
        getCodePackages();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Get packages on save
    useEffect(() => {
        if (Editor.updatePackages.get() < 2) return;
        getCodePackages();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Editor.updatePackages.get()]);

    return (
        <div {...rest}>
            <Box
                sx={{
                    backgroundColor: 'background.main',
                    border: 1,
                    borderColor: 'editorPage.borderColor',
                    p: 1,
                    height: '100%',
                }}>
                <Grid container alignItems="center" justifyContent="space-between">
                    <Typography fontSize={12} fontWeight={700}>
                        Python packages
                    </Typography>
                    <Button variant="text" onClick={handleEdit} fontWeight={700} sx={{ color: 'primary.main', minWidth: '40px' }}>
                        <Typography fontSize={12} fontWeight={700}>
                            Edit
                        </Typography>
                    </Button>
                </Grid>

                <Box mt={1.2}>
                    {packages.split('\n').map((a) => (
                        <Typography variant="subtitle1" key={a}>
                            {a}
                        </Typography>
                    ))}
                </Box>
            </Box>
            {children}
            <CustomDragHandle />
        </div>
    );
});

export default PackageColumn;

// ---- Custom hooks
export const useGetCodePackagesHook = (pipeline, setPackages) => {
    const environmentID = pipeline.environmentID;
    const pipelineID = pipeline.pipelineID;
    const workerGroup = pipeline.workerGroup;
    const language = pipeline.meta.data.language;

    const EditorGlobal = useGlobalEditorState();

    // GraphQL hook
    const updateCodePackages = useGetCodePackages();

    const { enqueueSnackbar } = useSnackbar();

    // Get packages
    return async () => {
        const response = await updateCodePackages({ environmentID, pipelineID, workerGroup, language });

        if (response.r || response.error) {
            enqueueSnackbar("Can't get packages: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setPackages(response.packages);
            EditorGlobal.selectedFile.isEditing.set(false);
        }
    };
};
