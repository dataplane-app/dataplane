import { Box, Button, Drawer, Grid, Tooltip, Typography } from '@mui/material';
import React, { useMemo, useState } from 'react';
import { useGlobalFilter, useTable } from 'react-table';
import CustomChip from '../../../components/CustomChip';
import Search from '../../../components/Search';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AddRPAWorkerDrawer from '../../../components/DrawerContent/AddRPAWorker';
import EditRPAWorkerDrawer from '../../../components/DrawerContent/EditRPAWorker';
import { useHistory } from 'react-router-dom';
import pythonLogo from '../../../assets/images/pythonLogo.png';

const tableWidth = '850px';

export default function ProcessGroups() {
    const [showAddWorkerDrawer, setShowAddWorkerDrawer] = useState(false);
    const [showEditWorkerDrawer, setShowEditWorkerDrawer] = useState(false);
    const [name, setName] = useState('');

    const columns = useMemo(
        () => [
            {
                Header: 'Member',
                accessor: (row) => [row.name, row.type],
                Cell: (row) => (
                    <CustomWorker
                        row={row}
                        // onClick={() => history.push(`/workers/${row.row.original.WorkerGroup}`)}
                        // setIsOpenSecrets={setIsOpenSecrets}
                        // setSecretDrawerWorkGroup={setSecretDrawerWorkGroup}
                    />
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        ['history', 'jwt']
    );

    // Use the state and functions returned from useTable to build your UI
    const { getTableProps, getTableBodyProps, rows, prepareRow, setGlobalFilter } = useTable(
        {
            columns,
            data,
        },

        useGlobalFilter
    );

    const history = useHistory();

    return (
        <Box className="page">
            <Box display="flex" alignItems="center" width={tableWidth}>
                <Typography id="test" component="h2" variant="h2" color="text.primary">
                    Process groups
                </Typography>
                <Button onClick={() => history.push('/rpa/workers')} variant="text" sx={{ marginLeft: 'auto', marginRight: 2 }}>
                    Manage workers
                </Button>
                <Button variant="contained" size="small">
                    Add process group
                </Button>
            </Box>

            <Box mt={'45px'} sx={{ width: tableWidth }}>
                <Grid container mt={4} direction="row" alignItems="center" justifyContent="flex-start">
                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center' }}>
                        <CustomChip amount={data.length} label="Process groups" margin={2} customColor="orange" />
                    </Grid>

                    <Grid item display="flex" alignItems="center" sx={{ marginLeft: 'auto', marginRight: '2px' }}>
                        <Search placeholder="Find workers" onChange={setGlobalFilter} width="290px" />
                    </Grid>
                </Grid>
            </Box>

            <Box component="table" mt={2} sx={{ width: tableWidth }} {...getTableProps()}>
                <Box component="tbody" display="flex" sx={{ flexDirection: 'column' }} {...getTableBodyProps()}>
                    {rows.map((row, i) => {
                        prepareRow(row);
                        return (
                            <Box
                                component="tr"
                                {...row.getRowProps()}
                                display="grid"
                                gridTemplateColumns="1fr"
                                alignItems="start"
                                borderRadius="5px"
                                backgroundColor="background.secondary"
                                mt={2}
                                sx={{
                                    border: 1,
                                    borderColor: 'divider',
                                    padding: '15px 0',
                                    '&:hover': { background: 'background.hoverSecondary' },
                                    '& td > div': { width: 'unset' },
                                }}>
                                {row.cells.map((cell) => {
                                    return (
                                        <Box component="td" {...cell.getCellProps()} textAlign="left">
                                            {cell.render('Cell')}
                                        </Box>
                                    );
                                })}
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            {/* Add worker drawer */}
            <Drawer anchor="right" open={showAddWorkerDrawer} onClose={() => setShowAddWorkerDrawer(!showAddWorkerDrawer)}>
                <AddRPAWorkerDrawer
                    handleClose={() => {
                        setShowAddWorkerDrawer(false);
                    }}
                />
            </Drawer>

            {/* Edit worker drawer */}
            <Drawer anchor="right" open={showEditWorkerDrawer} onClose={() => setShowEditWorkerDrawer(!showEditWorkerDrawer)}>
                <EditRPAWorkerDrawer
                    handleClose={() => {
                        setShowEditWorkerDrawer(false);
                    }}
                    name={name}
                />
            </Drawer>
        </Box>
    );
}

const CustomWorker = ({ row, onClick, setIsOpenSecrets, setSecretDrawerWorkGroup }) => {
    const [name, type] = row.value;

    return (
        <Grid container direction="column" mx="22px" alignItems="left" justifyContent="flex-start">
            <Typography component="h4" variant="h3" mb={1} sx={{ color: 'cyan.main', cursor: 'pointer' }} onClick={onClick}>
                {name}
            </Typography>
            <Typography component="h5" variant="subtitle1" onClick={onClick} sx={{ cursor: 'pointer' }}>
                Python workers for generic work loads.
            </Typography>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: '8px' }}>
                <Typography
                    component="h5"
                    sx={{ color: 'cyan.main', fontSize: ' 0.875rem', display: 'inline', cursor: 'pointer' }}
                    onClick={() => {
                        setIsOpenSecrets(true);
                        // setSecretDrawerWorkGroup(workerGroup);
                    }}>
                    Configure
                </Typography>
                <Typography
                    component="h5"
                    ml={4}
                    sx={{ color: 'cyan.main', fontSize: ' 0.875rem', display: 'inline', cursor: 'pointer' }}
                    onClick={() => {
                        setIsOpenSecrets(true);
                        // setSecretDrawerWorkGroup(workerGroup);
                    }}>
                    Secrets
                </Typography>
                {type === 'python' ? (
                    <Box position="relative" ml="auto">
                        <img
                            src={pythonLogo}
                            alt="python logo"
                            style={{ marginLeft: 'auto', height: '32px', alignSelf: 'end', position: 'absolute', right: '-15px', top: '-15px' }}
                        />
                    </Box>
                ) : null}
            </div>
        </Grid>
    );
};

const data = [
    {
        name: 'Python 1',
        type: 'python',
    },
];
