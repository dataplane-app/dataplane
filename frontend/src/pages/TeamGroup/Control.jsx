import { Box, Typography, Button, Drawer } from '@mui/material';
import { useState } from 'react';
import DeleteAccessGroupDrawer from './../../components/DrawerContent/DeleteAccessGroupDrawer';
import DeactivateAccessGroupDrawer from './../../components/DrawerContent/DeactivateAccessGroupDrawer';

export default function Control({ environmentId, accessGroup, getAccessGroup }) {
    // Sidebar state
    const [isOpenDelete, setIsOpenDelete] = useState(false);
    const [isOpenDeactivate, setIsOpenDeactivate] = useState(false);

    return (
        <>
            <Box mt="3rem">
                <Button
                    size="small"
                    variant="outlined"
                    // color="error"
                    color={accessGroup.Active ? 'error' : 'success'}
                    onClick={() => setIsOpenDeactivate(true)}
                    sx={{ fontWeight: '700', width: '100%', mt: '.78rem', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                    {accessGroup.Active ? 'Deactivate' : 'Activate'} access group
                </Button>

                <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => setIsOpenDelete(true)}
                    sx={{ fontWeight: '700', width: '100%', mt: '.78rem', fontSize: '.81rem', border: 2, '&:hover': { border: 2 } }}>
                    Delete access group
                </Button>

                <Typography color="rgba(248, 0, 0, 1)" lineHeight="15.23px" sx={{ mt: '.56rem' }} variant="subtitle2">
                    Warning: this action can't be undone.
                </Typography>
            </Box>

            <Drawer anchor="right" open={isOpenDeactivate} onClose={() => setIsOpenDeactivate(false)}>
                <DeactivateAccessGroupDrawer
                    handleClose={() => setIsOpenDeactivate(false)}
                    accessGroup={accessGroup}
                    environmentID={environmentId}
                    getAccessGroup={getAccessGroup}
                />
            </Drawer>

            <Drawer anchor="right" open={isOpenDelete} onClose={() => setIsOpenDelete(false)}>
                <DeleteAccessGroupDrawer
                    handleClose={() => setIsOpenDelete(false)} //
                    accessGroup={accessGroup}
                    environmentID={environmentId}
                />
            </Drawer>
        </>
    );
}
