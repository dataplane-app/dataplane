import { Autocomplete, Box, Button, Drawer, Grid, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import ct from 'countries-and-timezones';
import Search from '../components/Search';
import CustomChip from '../components/CustomChip';
import { useGetEnvironments } from '../graphql/getEnvironments';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTable, useGlobalFilter } from 'react-table';
import { useHistory } from 'react-router-dom';
import AddEnvironmentDrawer from '../components/DrawerContent/AddEnvironmentDrawer';
import { useGetPlatform } from '../graphql/getPlatform';
import { useSnackbar } from 'notistack';
import { useUpdatePlatform } from '../graphql/updatePlatform';
import { useGlobalAuthState } from '../Auth/UserAuth';

const Settings = () => {
    let history = useHistory();
    const { enqueueSnackbar } = useSnackbar();

    // Ref for scroll to top
    const scrollRef = useRef(null);

    // User states
    const [platform, setPlatform] = useState({});
    const [data, setData] = useState([]);
    const [isOpenAddEnv, setIsOpenAddEnv] = useState(false);

    const authState = useGlobalAuthState();
    const jwt = authState.authToken.get();

    // Form hook
    const { register, handleSubmit, reset } = useForm();

    // GraphQL Hooks
    const getPlatform = useGetPlatData(setPlatform, enqueueSnackbar, reset);
    const environments = useGetEnvData(setData, enqueueSnackbar);

    // Retrieve environments, platform and me query on load
    useEffect(() => {
        // Scroll to top on load
        scrollRef.current.parentElement.scrollIntoView();

        let active = true;
        if (active) {
            environments();
            getPlatform();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Submit user data
    const onSubmit = useSubmitData(platform?.id, setPlatform);

    // Environment table
    const columns = useMemo(
        () => [
            {
                Header: 'Environments',
                accessor: (row) => [row.name, row.description],
                Cell: (row) => <CustomEnvName row={row} onClick={() => history.push(`/settings/environment/${row.row.original.id}`)} />,
            },
            {
                Header: 'Status',
                accessor: 'status',
                Cell: (row) => (row.row.original.active === true ? <CustomChip label="Active" customColor="green" /> : <CustomChip label="Inactive" customColor="red" />),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [jwt]
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
            <Box className="page" ref={scrollRef}>
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
                        <Box component="table" width="100%" mt={4} {...getTableProps()}>
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
                    ) : null}
                </Box>
            </Box>

            <Drawer anchor="right" open={isOpenAddEnv} onClose={() => setIsOpenAddEnv(!isOpenAddEnv)}>
                <AddEnvironmentDrawer
                    refreshData={environments}
                    handleClose={() => {
                        setIsOpenAddEnv(false);
                    }}
                />
            </Drawer>
        </>
    );
};

const CustomEnvName = ({ row, onClick }) => {
    const [title, description] = row.value;

    return (
        <Grid container direction="column" mx="22px" alignItems="left" justifyContent="flex-start" onClick={onClick}>
            <Typography component="h4" noWrap variant="h3" sx={{ maxWidth: { md: 200 }, color: 'cyan.main' }}>
                {title}
            </Typography>
            <Typography component="h5" variant="subtitle1">
                {description || '-'}
            </Typography>
        </Grid>
    );
};

export default Settings;

// --------- Custom hooks

const useGetEnvData = (setData, enqueueSnackbar) => {
    // GraphQL hook
    const getEnvironmentsResponse = useGetEnvironments();

    // Get user data
    return async () => {
        const envs = await getEnvironmentsResponse();

        if (!envs.errors) {
            setData(envs);
        } else {
            enqueueSnackbar('Unable to retrieve environments', { variant: 'error' });
        }
    };
};

const useGetPlatData = (setData, enqueueSnackbar, reset) => {
    // GraphQL hook
    const getPlatformResponse = useGetPlatform();

    // Get user platform data
    return async () => {
        const platform = await getPlatformResponse();

        if (!platform.errors) {
            setData(platform);

            reset({
                business_name: platform?.business_name,
                timezone: platform?.timezone,
            });
        } else {
            enqueueSnackbar('Unable to retrieve platform', { variant: 'error' });
        }
    };
};

const useSubmitData = (platform_id, setPlatform) => {
    // GraphQL hook
    const updatePlatform = useUpdatePlatform();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // Update user info
    return async function onSubmit(data) {
        const allData = {
            input: {
                id: platform_id,
                business_name: data.business_name,
                timezone: data.timezone,
                complete: true,
            },
        };

        let response = await updatePlatform(allData);
        if (response === 'Platform updated') {
            closeSnackbar();
            enqueueSnackbar(`Saved`, { variant: 'success' });

            setPlatform(allData.input);
        } else {
            if (response.errors) {
                response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
            }
            if (response.r === 'error') {
                enqueueSnackbar(response.msg, { variant: 'error' });
            }
        }
    };
};
