import { useState, useMemo, useEffect } from 'react';
import { Box, Grid, Typography, Button, Drawer } from '@mui/material';
import Search from '../components/Search';
import { useTable, useGlobalFilter } from 'react-table';
import { useHistory } from 'react-router-dom';
import CustomChip from '../components/CustomChip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDocker } from '@fortawesome/free-brands-svg-icons';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { formatDate } from '../utils/formatDate';
import { useGlobalEnvironmentState } from '../components/EnviromentDropdown';

// import { useGetUsers } from '../graphql/getUsers';
// import { useSnackbar } from 'notistack';

const tableWidth = '570px';

export default function Workers() {
    let history = useHistory();
    // const { enqueueSnackbar } = useSnackbar();

    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();

    // Users state
    const [data, setData] = useState([
        {
            id: '36474-6768-6768-67859',
            name: 'Python 1',
            description: 'Python workers for generic work loads.',
            type: 'Docker',
            workers: 3,
            cpu: 1,
            mb: 200,
            lastUpdate: '2022-01-20T11:56:08Z',
        },
    ]);

    // Get workers on load
    // const getUsers = useGetUsers();
    useEffect(() => {
        // retrieveUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Get users
    // const retrieveUsers = async () => {
    //     let users = await getUsers();
    //     !users.errors ? setData(users) : enqueueSnackbar('Unable to retrieve users', { variant: 'error' });
    // };

    const columns = useMemo(
        () => [
            {
                Header: 'Member',
                accessor: (row) => [row.name, row.description, row.type],
                Cell: (row) => <CustomWorker row={row} onClick={() => history.push(`/workers/${row.row.original.id}`)} />,
            },
            {
                Header: 'Status',
                accessor: (row) => [row.workers, formatDate(row.lastUpdate)],
                Cell: (row) => <CustomStatus row={row} />,
            },
        ],
        [history]
    );

    // Use the state and functions returned from useTable to build your UI
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, state, setGlobalFilter } = useTable(
        {
            columns,
            data,
        },
        useGlobalFilter
    );

    const { globalFilter } = state;

    useEffect(() => {
        console.log(globalFilter);
    }, [globalFilter]);

    return (
        <Box className="page">
            <Typography component="h2" variant="h2" color="text.primary">
                Worker groups
            </Typography>

            <Typography variant="subtitle2" mt=".20rem">
                Environment: {Environment.name.get()}
            </Typography>

            <Box mt={4} sx={{ width: tableWidth }}>
                <Grid container mt={4} direction="row" alignItems="center" justifyContent="flex-start">
                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center' }}>
                        <CustomChip amount={rows.length} label="Worker groups" margin={2} customColor="orange" />
                    </Grid>

                    <Grid item display="flex" alignItems="center" sx={{ marginLeft: 'auto', marginRight: '2px' }}>
                        <FontAwesomeIcon icon={faSearch} style={{ marginRight: 10 }} color="#0000006B" size="xs" />

                        <Search placeholder="Find workers" onChange={setGlobalFilter} width="290px" />
                    </Grid>
                </Grid>
            </Box>

            <Box component="table" mt={2} sx={{ width: tableWidth }} {...getTableProps()}>
                {/* <thead>
                    {headerGroups.map((headerGroup) => (
                        <Box
                            component="tr"
                            display="grid"
                            sx={{ '*:first-of-type': { ml: '22px' }, '*:last-child': { textAlign: 'center' } }}
                            gridTemplateColumns="repeat(3, 1fr)"
                            justifyContent="flex-start"
                            {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map((column) => (
                                <Box component="td" color="text.primary" fontWeight="600" fontSize="15px" textAlign="left" {...column.getHeaderProps()}>
                                    {column.render('Header')}
                                </Box>
                            ))}
                        </Box>
                    ))}
                </thead> */}
                <Box component="tbody" display="flex" sx={{ flexDirection: 'column' }} {...getTableBodyProps()}>
                    {rows.map((row, i) => {
                        prepareRow(row);
                        return (
                            <Box
                                component="tr"
                                {...row.getRowProps()}
                                display="grid"
                                gridTemplateColumns="repeat(2, 1fr)"
                                alignItems="start"
                                borderRadius="5px"
                                backgroundColor="background.secondary"
                                mt={2}
                                sx={{
                                    border: 1,
                                    borderColor: 'divider',
                                    padding: '15px 0',
                                    cursor: 'pointer',
                                    '&:hover': { background: 'background.hoverSecondary' },
                                    'td:last-child': { textAlign: 'center' },
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
        </Box>
    );
}

const CustomWorker = ({ row, onClick }) => {
    const [name, description, type] = row.value;

    return (
        <Grid container direction="column" mx="22px" alignItems="left" justifyContent="flex-start" onClick={onClick}>
            <Typography component="h4" variant="h3" mb={1} sx={{ color: 'cyan.main' }}>
                {name}
            </Typography>
            <Typography component="h5" variant="subtitle1">
                {description}
            </Typography>
            <Typography component="h5" mt={2} variant="subtitle1" style={{ fontSize: '17px' }}>
                <FontAwesomeIcon icon={faDocker} style={{ marginRight: 4 }} />
                {type}
            </Typography>
        </Grid>
    );
};

const CustomStatus = ({ row }) => {
    const [workers, lastUpdate] = row.value;
    return (
        <Grid container direction="column" alignItems="flex-end" pr={5}>
            {workers > 0 ? <CustomChip label={workers + ' Online'} customColor="green" /> : <CustomChip label="Offline" customColor="red" />}

            <Typography mt={4} variant="subtitle1">
                Last updated: {lastUpdate}
            </Typography>
        </Grid>
    );
};
