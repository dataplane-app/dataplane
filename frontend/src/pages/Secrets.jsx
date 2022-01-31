import { Box, Button, Grid, Typography } from '@mui/material';
import { useMemo, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useGlobalFilter, useTable } from 'react-table';
import CustomChip from '../components/CustomChip';
import Search from '../components/Search';
import { useSnackbar } from 'notistack';
import { useGetSecrets } from '../graphql/getSecrets';
import { useGlobalEnvironmentState } from '../components/EnviromentDropdown';
import { formatDate } from '../utils/formatDate';

const Secrets = () => {
    // React router
    const history = useHistory();

    // Ref for scroll to top
    const scrollRef = useRef(null);

    // Global environment state with hookstate
    const Environment = useGlobalEnvironmentState();

    // Secrets states
    const [data, setData] = useState([]);

    // Custom GraphQL hook
    const getSecrets = useGetSecrets_(setData);

    useEffect(() => {
        // Scroll to top on load
        scrollRef.current.parentElement.scrollIntoView();

        // Get secrets once the envrement id is available
        Environment.id.get() && getSecrets(Environment.id.get());

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.id.get()]);

    const columns = useMemo(
        () => [
            {
                Header: 'Secrets',
                accessor: (row) => [row.Secret],
                Cell: (row) => <CustomSecretName row={row} onClick={() => history.push(`/secrets/${row.row.original.Secret}`)} />,
            },
            {
                Header: 'Status',
                accessor: 'Active',
                Cell: (row) => (
                    <Box mr={4} display="flex" justifyContent="flex-end">
                        {row.row.original.SecretType === 'environment' ? (
                            <CustomChip label="Environment variable" customColor="green" />
                        ) : row.value === true ? (
                            <CustomChip label="Active" customColor="green" />
                        ) : (
                            <CustomChip label="Inactive" customColor="red" />
                        )}
                    </Box>
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <Box className="page" ref={scrollRef}>
            <Typography component="h2" variant="h2" color="text.primary">
                Secrets
            </Typography>

            <Box mt={4} sx={{ width: { md: '570px' } }}>
                <Grid container mt={4} direction="row" alignItems="center" justifyContent="flex-start">
                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center' }}>
                        <CustomChip amount={data.length} label="Secrets" margin={2} customColor="orange" />
                    </Grid>

                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center', flex: 1 }}>
                        <Search placeholder="Find secrets" width="100%" onChange={setGlobalFilter} />
                    </Grid>

                    <Grid display="flex" sx={{ marginLeft: 'auto', margin: '0 2px 0 25px' }}>
                        <Button onClick={() => history.push('/addsecret')} variant="contained" color="primary" width="3.81rem">
                            Add
                        </Button>
                    </Grid>
                </Grid>

                <Box component="table" mt={4} sx={{ width: '100%' }} {...getTableProps()}>
                    <thead>
                        {headerGroups.map((headerGroup) => (
                            <Box
                                component="tr"
                                display="grid"
                                sx={{ '*:first-of-type': { ml: '22px' }, '*:last-child': { textAlign: 'center' } }}
                                gridTemplateColumns="1fr .4fr"
                                justifyContent="flex-start"
                                {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map((column) => (
                                    <Box component="td" color="text.primary" fontWeight="600" fontSize="15px" textAlign="left" {...column.getHeaderProps()}>
                                        {column.render('Header')}
                                    </Box>
                                ))}
                            </Box>
                        ))}
                    </thead>
                    <Box component="tbody" display="flex" sx={{ flexDirection: 'column' }} {...getTableBodyProps()}>
                        {rows.map((row, i) => {
                            prepareRow(row);
                            return (
                                <Box
                                    component="tr"
                                    {...row.getRowProps()}
                                    display="grid"
                                    gridTemplateColumns="1fr .4fr"
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
        </Box>
    );
};

const CustomSecretName = ({ row, onClick }) => {
    const [name] = row.value;

    return (
        <Grid container direction="column" mx="22px" alignItems="left" justifyContent="flex-start" onClick={onClick}>
            <Box display="flex">
                <Typography component="h4" variant="h3" sx={{ color: `${row.row.original.SecretType !== 'environment' ? 'cyan.main' : 'text.main'}` }}>
                    {name}
                </Typography>

                <Typography ml={5} variant="subtitle1">
                    Last updated: {formatDate(row.row.original.UpdatedAt)}
                </Typography>
            </Box>
            {row.row.original.EnvVar && <Typography variant="subtitle1">Environment variable: {row.row.original.EnvVar}</Typography>}
            <Typography mt={1} component="h5" variant="subtitle1">
                {row.row.original.SecretType === 'custom' ? row.row.original.Description : '******'}
            </Typography>
        </Grid>
    );
};

export default Secrets;

// ----------- Custom Hooks
const useGetSecrets_ = (setSecrets) => {
    // GraphQL hook
    const getSecrets = useGetSecrets();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Get secrets
    return async (environmentId) => {
        const response = await getSecrets({ environmentId });

        if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get secrets: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': get secrets failed', { variant: 'error' }));
        } else {
            setSecrets(response.filter((a) => a.SecretType === 'environment' || a.EnvironmentId === environmentId));
        }
    };
};
