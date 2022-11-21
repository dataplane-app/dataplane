import { Box, Button, Drawer, Grid, Tooltip, Typography } from '@mui/material';
import React, { useMemo, useState } from 'react';
import { useGlobalFilter, useTable } from 'react-table';
import CustomChip from '../../../components/CustomChip';
import Search from '../../../components/Search';
import { faEdit, faFilter } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AddRPAWorkerDrawer from '../../../components/DrawerContent/AddRPAWorker';
import EditRPAWorkerDrawer from '../../../components/DrawerContent/EditRPAWorker';
import { useHistory } from 'react-router-dom';

const tableWidth = '850px';

export default function RPAWorkers() {
    const [showAddWorkerDrawer, setShowAddWorkerDrawer] = useState(false);
    const [showEditWorkerDrawer, setShowEditWorkerDrawer] = useState(false);
    const [name, setName] = useState('');

    const history = useHistory();

    const columns = useMemo(
        () => [
            {
                Header: 'Worker',
                accessor: (row) => [row.name, row.status, row.id],
                Cell: (row) => (
                    <Box display="flex" flexDirection="column" position="relative">
                        <Tooltip title={row.value[2]} placement="top">
                            <Typography variant="caption" lineHeight={1.2} mr={0.5}>
                                {row.value[0]}
                            </Typography>
                        </Tooltip>
                        <Box
                            onClick={() => {
                                setName(row.value[0]);
                                setShowEditWorkerDrawer(true);
                            }}
                            component={FontAwesomeIcon}
                            fontSize={12}
                            color="#7D7D7D"
                            icon={faEdit}
                            cursor="pointer"
                            position="absolute"
                            left="93px"
                            top="2px"
                        />

                        <Typography variant="caption" lineHeight={1.2} fontWeight={700} color={row.value[1] === 'Online' ? 'success.main' : 'red'}>
                            {row.value[1]}
                        </Typography>
                    </Box>
                ),
            },
            {
                Header: 'Process groups',
                accessor: 'groupCount',
                Cell: (row) => (
                    <Typography mt={-2} variant="caption" color="cyan.main" sx={{ cursor: 'pointer' }}>
                        Manage({row.value})
                    </Typography>
                ),
            },
            {
                Header: 'Last ping',
                accessor: 'lastPing',
                Cell: (row) => (
                    <Typography mt={-2} variant="caption">
                        {row.value}
                    </Typography>
                ),
            },
            {
                Header: 'Manage',
                accessor: (row) => [row.id, row.status],
                Cell: (row) => (
                    <>
                        <Typography variant="caption" mr={1} mt={-2} color="red" sx={{ cursor: 'pointer' }}>
                            Remove
                        </Typography>
                        <Typography variant="caption" mt={-2}>
                            |
                        </Typography>
                        <Typography variant="caption" ml={1} mt={-2} color={row.value[1] === 'Online' ? 'red' : 'success.main'} sx={{ cursor: 'pointer' }}>
                            {row.value[1] === 'Online' ? 'Deactivate' : 'Activate'}
                        </Typography>
                    </>
                ),
            },
        ],

        []
    );

    // Use the state and functions returned from useTable to build your UI
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, setGlobalFilter } = useTable(
        {
            columns,
            data,
        },

        useGlobalFilter
    );

    return (
        <Box className="page">
            <Box display="flex" alignItems="center" width={tableWidth}>
                <Typography id="test" component="h2" variant="h2" color="text.primary">
                    RPA Workers
                </Typography>

                <Button onClick={() => history.push('/remoteprocessgroups')} variant="text" sx={{ marginLeft: 'auto', marginRight: 2 }}>
                    Manage process groups
                </Button>

                <Button variant="contained" size="small" onClick={() => setShowAddWorkerDrawer(true)}>
                    Add worker
                </Button>
            </Box>

            <Box mt={'45px'} sx={{ width: tableWidth }}>
                <Grid container mt={4} direction="row" alignItems="center" justifyContent="flex-start">
                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center' }}>
                        <CustomChip amount={data.length} label="RPA Workers" margin={2} customColor="orange" />
                    </Grid>

                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center' }}>
                        <Box component={FontAwesomeIcon} icon={faFilter} sx={{ fontSize: 12, color: '#b9b9b9' }} />

                        <Typography variant="subtitle1" color="#737373" ml={1}>
                            Process group = Python 1
                        </Typography>
                    </Grid>

                    <Grid item display="flex" alignItems="center" sx={{ marginLeft: 'auto', marginRight: '2px' }}>
                        <Search placeholder="Find workers" onChange={setGlobalFilter} width="290px" />
                    </Grid>
                </Grid>
            </Box>

            <Box component="table" mt={6} sx={{ width: tableWidth }} {...getTableProps()}>
                <Box component="thead" display="flex" sx={{ flexDirection: 'column' }}>
                    {headerGroups.map((headerGroup) => (
                        <Box //
                            component="tr"
                            {...headerGroup.getHeaderGroupProps()}
                            display="grid"
                            gridTemplateColumns="2fr repeat(3, 1fr)"
                            textAlign="left">
                            {headerGroup.headers.map((column, idx) => (
                                <Box
                                    component="th"
                                    {...column.getHeaderProps()}
                                    sx={{
                                        borderTopLeftRadius: idx === 0 ? 5 : 0,
                                        borderTopRightRadius: idx === headerGroup.headers.length - 1 ? 5 : 0,
                                        border: '1px solid',
                                        borderLeft: idx === 0 ? '1px solid' : 0,
                                        borderColor: 'editorPage.borderColor',
                                        backgroundColor: 'background.worker',
                                        pl: 1,
                                        fontSize: '0.875rem',
                                        py: '6px',
                                    }}>
                                    {column.render('Header')}
                                </Box>
                            ))}
                        </Box>
                    ))}
                </Box>
                <Box component="tbody" display="flex" sx={{ flexDirection: 'column' }} {...getTableBodyProps()}>
                    {rows.map((row, i) => {
                        prepareRow(row);
                        return (
                            <Box
                                component="tr"
                                {...row.getRowProps()}
                                display="grid"
                                gridTemplateColumns="2fr repeat(3, 1fr)"
                                alignItems="start"
                                backgroundColor="background.secondary">
                                {row.cells.map((cell, idx) => {
                                    return (
                                        <Box
                                            component="td"
                                            {...cell.getCellProps()}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                border: '1px solid',
                                                borderColor: 'editorPage.borderColor',
                                                height: '50px',
                                                borderLeft: idx === 0 ? '1px solid editorPage.borderColor' : 0,
                                                // If last cell of last row
                                                borderBottomRightRadius: idx === row.cells.length - 1 && i === rows.length - 1 ? '5px' : 0,
                                                // If first cell of last row
                                                borderBottomLeftRadius: idx === 0 && i === rows.length - 1 ? '5px' : 0,
                                                borderTop: 0,
                                                pl: 1,
                                                textAlign: 'left',
                                                justifyContent: idx === row.cells.length - 1 ? 'center' : 'unset',
                                            }}>
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

const data = [
    {
        name: "Judy's computer",
        status: 'Online',
        groupCount: 1,
        lastPing: '13 Nov 2022 19:28:31',
        id: '12345',
    },
    {
        name: "Sam's computer",
        status: 'Offline',
        groupCount: 2,
        lastPing: '1 Nov 2022 8:00:01',
        id: '12345',
    },
];
