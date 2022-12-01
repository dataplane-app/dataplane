import { Box, Typography, Button, Drawer } from '@mui/material';
import { useState } from 'react';
import DeactivateRemoteWorkerDrawer from '../../../../components/DrawerContent/DeactivateRemoteWorkerDrawer';
import DeleteRemoteWorkerDrawer from '../../../../components/DrawerContent/DeleteRemoteWorkerDrawer';

export default function Control({ environmentId, remoteWorker, getSingleRemoteWorker }) {
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
                    color={remoteWorker.active ? 'error' : 'success'}
                    onClick={() => setIsOpenDeactivate(true)}
                    sx={{ fontWeight: '700', width: '100%', mt: '.78rem', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                    {remoteWorker.active ? 'Deactivate' : 'Activate'} worker
                </Button>

                <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => setIsOpenDelete(true)}
                    sx={{ fontWeight: '700', width: '100%', mt: '.78rem', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                    Delete worker
                </Button>

                <Typography color="rgba(248, 0, 0, 1)" lineHeight="15.23px" sx={{ mt: '.56rem' }} variant="subtitle2">
                    Warning: this action can't be undone.
                </Typography>
            </Box>

            <Drawer anchor="right" open={isOpenDeactivate} onClose={() => setIsOpenDeactivate(false)}>
                <DeactivateRemoteWorkerDrawer
                    handleClose={() => setIsOpenDeactivate(false)} //
                    remoteWorker={remoteWorker}
                    environmentID={environmentId}
                    getSingleRemoteWorker={getSingleRemoteWorker}
                />
            </Drawer>

            <Drawer anchor="right" open={isOpenDelete} onClose={() => setIsOpenDelete(false)}>
                <DeleteRemoteWorkerDrawer
                    handleClose={() => setIsOpenDelete(false)} //
                    remoteWorker={remoteWorker}
                    environmentID={environmentId}
                />
            </Drawer>
        </>
    );
}
