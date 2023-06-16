import { Box, Typography, Button, Drawer } from '@mui/material';
import { useState } from 'react';
import DeactivateRemoteProcessGroup from '../../../../components/DrawerContent/DeactivateRemoteProcessGroup';
import DeleteRemoteProcessGroupDrawer from '../../../../components/DrawerContent/DeleteRemoteProcessGroupDrawer';

export default function Control({ environmentId, remoteProcessGroup, getSingleRemoteProcessGroup }) {
    // Sidebar state
    const [isOpenDelete, setIsOpenDelete] = useState(false);
    const [isOpenDeactivate, setIsOpenDeactivate] = useState(false);

    return (
        <>
            <Box mt="3rem">
                <Typography component="h3" variant="h3" color="text.primary">
                    Control
                </Typography>

                <Button
                    size="small"
                    variant="outlined"
                    // color="error"
                    color={remoteProcessGroup.active ? 'error' : 'success'}
                    onClick={() => setIsOpenDeactivate(true)}
                    sx={{ fontWeight: '700', width: '100%', mt: '.78rem', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                    {remoteProcessGroup.active ? 'Deactivate' : 'Activate'} process group
                </Button>

                <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => setIsOpenDelete(true)}
                    sx={{ fontWeight: '700', width: '100%', mt: '.78rem', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                    Delete process group
                </Button>

                <Typography color="rgba(248, 0, 0, 1)" lineHeight="15.23px" sx={{ mt: '.56rem' }} variant="subtitle2">
                    Warning: this action can't be undone.
                </Typography>
            </Box>

            <Drawer anchor="right" open={isOpenDeactivate} onClose={() => setIsOpenDeactivate(false)}>
                <DeactivateRemoteProcessGroup
                    handleClose={() => setIsOpenDeactivate(false)} //
                    remoteProcessGroup={remoteProcessGroup}
                    environmentID={environmentId}
                    getSingleRemoteProcessGroup={getSingleRemoteProcessGroup}
                />
            </Drawer>

            <Drawer anchor="right" open={isOpenDelete} onClose={() => setIsOpenDelete(false)}>
                <DeleteRemoteProcessGroupDrawer
                    handleClose={() => setIsOpenDelete(false)} //
                    remoteProcessGroup={remoteProcessGroup}
                    environmentID={environmentId}
                />
            </Drawer>
        </>
    );
}
