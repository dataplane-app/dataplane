import { Autocomplete, Box, Button, Drawer, Grid, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import ct from 'countries-and-timezones';
import Search from '../components/Search';
import CustomChip from '../components/CustomChip';
import { useGetEnvironments } from '../graphql/getEnvironments';
import { useEffect, useMemo, useState } from 'react';
import { useTable, useGlobalFilter } from 'react-table';
import { useHistory } from 'react-router-dom';
import AddEnvironmentDrawer from '../components/DrawerContent/AddEnvironmentDrawer';
import drawerStyles from '../utils/drawerStyles';
import { useGetPlatform } from '../graphql/getPlatform';

const Settings = () => {
    let history = useHistory();

    // User states
    const [platform, setPlatform] = useState({});
    const [data, setData] = useState([]);
    const [isOpenAddEnv, setIsOpenAddEnv] = useState(false);

    // GraphQL Hooks
    const getEnvironments = useGetEnvironments();
    const getPlatform = useGetPlatform();

    // Form hook
    const { register, handleSubmit, reset } = useForm();

    // Retrieve environments and me query on load
    useEffect(() => {
        let active = true;

        (async () => {
            const getPlatformResponse = await getPlatform();
            const getEnvironmentsResponse = await getEnvironments();

            if (active && !getPlatformResponse.errors) {
                setPlatform(getPlatformResponse);

                reset({
                    business_name: getPlatformResponse?.business_name,
                    timezone: getPlatformResponse?.timezone,
                });
            }

            if (active && getEnvironmentsResponse) {
                setData(getEnvironmentsResponse);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function onSubmit(data) {
        console.log(data);
    }

    // Environment table
    const columns = useMemo(
        () => [
            {
                Header: 'Environments',
                accessor: (row) => [row.name],
                Cell: (row) => <CustomEnvName row={row} onClick={() => history.push(`/settings/environment/${row.row.original.id}`)} />,
            },
            {
                Header: 'Status',
                accessor: 'status',
                Cell: (row) => (row.value === 'active' ? <CustomChip label="Active" customColor="green" /> : <CustomChip label="Inactive" customColor="red" />),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, setGlobalFilter } = useTable(
        {
            columns,
            data,
        },
        useGlobalFilter
    );

    return (
        <>
            <Box className="page">
                <Typography component="h2" variant="h2" color="text.primary">
                    Settings
                </Typography>

                <Box mt={4} sx={{ width: '212px' }}>
                    {platform.timezone ? (
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <TextField
                                label="Business name"
                                id="business_name"
                                size="small"
                                required
                                sx={{ mb: 2, fontSize: '.75rem', display: 'flex' }}
                                {...register('business_name', { required: true })}
                            />

                            <Autocomplete
                                disablePortal
                                value={platform?.timezone}
                                id="combo-box-demo"
                                options={Object.keys(ct.getAllTimezones())}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Timezone"
                                        id="timezone"
                                        size="small"
                                        sx={{ mt: 2, fontSize: '.75rem', display: 'flex' }}
                                        {...register('timezone')}
                                    />
                                )}
                            />

                            <Grid mt={3} display="flex" alignItems="center">
                                <Button type="submit" variant="contained" color="primary" style={{ width: '100%' }}>
                                    Save
                                </Button>
                            </Grid>
                        </form>
                    ) : null}
                </Box>

                <Box mt={10} sx={{ width: { md: '570px' } }}>
                    <Grid container mt={4} direction="row" alignItems="center" justifyContent="flex-start">
                        <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center' }}>
                            <CustomChip amount={data ? data.length : 0} label="Environments" margin={2} customColor="orange" />
                        </Grid>

                        <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center', flex: 1 }}>
                            <Search placeholder="Find environments" width="100%" onChange={setGlobalFilter} />
                        </Grid>

                        <Grid display="flex" sx={{ marginLeft: 'auto', margin: '0 2px 0 25px' }}>
                            <Button variant="contained" color="primary" width="3.81rem" onClick={() => setIsOpenAddEnv(true)}>
                                Add
                            </Button>
                        </Grid>
                    </Grid>

                    {data && data.length > 0 ? (
                        <Box component="table" mt={4} {...getTableProps()}>
                            <thead>
                                {headerGroups.map((headerGroup) => (
                                    <Box
                                        component="tr"
                                        display="grid"
                                        sx={{ '*:first-child': { ml: '22px' }, '*:last-child': { textAlign: 'center' } }}
                                        gridTemplateColumns="repeat(2, 1fr)"
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
                    ) : null}
                </Box>
            </Box>

            <Drawer anchor="right" open={isOpenAddEnv} onClose={() => setIsOpenAddEnv(!isOpenAddEnv)} sx={drawerStyles}>
                <AddEnvironmentDrawer
                    handleClose={() => {
                        setIsOpenAddEnv(false);
                    }}
                />
            </Drawer>
        </>
    );
};

const CustomEnvName = ({ row, onClick }) => {
    const [title] = row.value;

    return (
        <Grid container direction="column" mx="22px" alignItems="left" justifyContent="flex-start" onClick={onClick}>
            <Typography component="h4" noWrap variant="h3" color="primary" sx={{ maxWidth: { md: 200 } }}>
                {title}
            </Typography>
            <Typography component="h5" variant="subtitle1">
                Play pen to try out new concepts and innovate
            </Typography>
        </Grid>
    );
};

export default Settings;
