import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function AlertDialog({ openDialog, handleClose, deleteKey, keyToBeDeleted }) {
    return (
        <Dialog open={openDialog} onClose={handleClose} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description">
            <DialogTitle id="alert-dialog-title">Delete API Key?</DialogTitle>
            <DialogContent>
                <DialogContentText color="main.primary" id="alert-dialog-description">
                    Are you sure you would like to delete key: ****-****-****-{keyToBeDeleted.tail}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ paddingBottom: '20px', paddingRight: '20px' }}>
                <Button variant="contained" onClick={handleClose}>
                    No
                </Button>
                <Button
                    variant="contained"
                    onClick={() => {
                        deleteKey(keyToBeDeleted.key);
                        handleClose();
                    }}
                    autoFocus>
                    Yes
                </Button>
            </DialogActions>
        </Dialog>
    );
}
