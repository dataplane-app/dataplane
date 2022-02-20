import { Box, Button, Drawer, Grid, Typography } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useGlobalFilter, useTable } from 'react-table';
import CustomChip from '../components/CustomChip';
import AddPipelinesPermissionDrawer from '../components/DrawerContent/AddPipelinesPermissionDrawer';
import Search from '../components/Search';
import { useGetUserPermissions } from '../graphql/getUserPermissions';
import { useSnackbar } from 'notistack';
import { useGlobalEnvironmentState } from '../components/EnviromentDropdown';

const PipelinesPermission = () => {
    // React router
    const history = useHistory();

    // Ref for scroll to top
    const scrollRef = useRef(null);

    // Global state
    const Environment = useGlobalEnvironmentState();

    // Local state
    const [permissions, setPermissions] = useState([]);

    // Drawer state
    const [isOpenAddPermissions, setIsOpenAddPermissions] = useState(false);
    const [type, setType] = useState('User');

    // Custom GraphQL hooks
    const getUserPermissions = useGetUserPermissions_(Environment.id.get(), setPermissions);

    useEffect(() => {
        // Scroll to top on load
        scrollRef.current.parentElement.scrollIntoView();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // table
    const columns = useMemo(
        () => [
            {
                Header: 'Member',
                accessor: (row) => [row.info.name, row.info.job_title],
                Cell: (row) => <CustomName row={row} onClick={() => history.push(`/teams/${row.row.original.user_id}`)} />,
            },
            {
                Header: 'Email',
                accessor: (row) => [row.type.title, row.type.email],
                Cell: (row) => <CustomEmail row={row} />,
            },
            {
                Header: 'Active',
                accessor: 'active',
                Cell: (row) => (row.value === true ? <CustomChip label="Active" customColor="green" /> : <CustomChip label="Inactive" customColor="red" />),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const { getTableProps, getTableBodyProps, rows, prepareRow, setGlobalFilter } = useTable(
        {
            columns,
            data: PIPELINE_MOCK_DATA,
        },
        useGlobalFilter
    );

    return (
        <Box className="page" ref={scrollRef}>
            <Typography component="h2" variant="h2" color="text.primary">
                Pipeline permissions {'>'} Remove Logs
            </Typography>

            <Box mt={4} sx={{ width: { md: '630px' } }}>
                <Grid container mt={4} direction="row" alignItems="center" justifyContent="flex-start">
                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center' }}>
                        <CustomChip amount={2} label="Permissions" margin={2} customColor="orange" />
                    </Grid>

                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center', flex: 1 }}>
                        <Search placeholder="Find permissions" width="100%" onChange={setGlobalFilter} />
                    </Grid>

                    <Grid display="flex" sx={{ marginLeft: 'auto', margin: '0 2px 0 25px' }}>
                        <Button
                            onClick={() => {
                                setType('User');
                                setIsOpenAddPermissions(true);
                            }}
                            variant="contained"
                            color="primary"
                            width="3.81rem">
                            Add user
                        </Button>

                        <Button
                            onClick={() => {
                                setType('Access group');
                                setIsOpenAddPermissions(true);
                            }}
                            variant="contained"
                            color="primary"
                            sx={{ ml: 2 }}
                            width="3.81rem">
                            Add access group
                        </Button>
                    </Grid>
                </Grid>

                <Box component="table" mt={3} sx={{ width: '100%' }} {...getTableProps()}>
                    <Box component="tbody" display="flex" sx={{ flexDirection: 'column' }} {...getTableBodyProps()}>
                        {rows.map((row, i) => {
                            prepareRow(row);
                            return (
                                <Box
                                    component="tr"
                                    {...row.getRowProps()}
                                    display="grid"
                                    gridTemplateColumns="1fr 1fr .4fr"
                                    alignItems="center"
                                    borderRadius="5px"
                                    backgroundColor="background.secondary"
                                    mt={2}
                                    sx={{
                                        border: 1,
                                        borderColor: 'divider',
                                        padding: '15px 0',
                                        cursor: 'pointer',
                                        '&:hover': { background: 'background.hoverSecondary' },
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

            <Drawer anchor="right" open={isOpenAddPermissions} onClose={() => setIsOpenAddPermissions(!isOpenAddPermissions)}>
                <AddPipelinesPermissionDrawer
                    typeToAdd={type}
                    handleClose={() => {
                        setIsOpenAddPermissions(false);
                    }}
                />
            </Drawer>
        </Box>
    );
};

const CustomName = ({ row }) => {
    const [name, job_title] = row.value;

    return (
        <Grid container direction="column" mx="22px" alignItems="left" justifyContent="flex-start">
            <Typography component="h4" variant="h3" sx={{ color: 'cyan.main' }}>
                {name}
            </Typography>
            <Typography component="h5" variant="subtitle1">
                {job_title}
            </Typography>
        </Grid>
    );
};

const CustomEmail = ({ row }) => {
    const [title, email] = row.value;

    return (
        <Box>
            <CustomChip label={title} customColor={title === 'User' ? 'purple' : 'orange'} />
            <Typography component="h5" variant="subtitle1" mt={0.5}>
                {email}
            </Typography>
        </Box>
    );
};

const PIPELINE_MOCK_DATA = [
    {
        id: 1,
        info: {
            name: 'Saul Frank',
            job_title: 'Data Engineer',
        },
        type: {
            title: 'User',
            email: 'saulfrank@email.com',
        },
        active: true,
    },
    {
        id: 2,
        info: {
            name: 'Run team',
            job_title: '',
        },
        type: {
            title: 'Access group',
            email: '',
        },
        active: true,
    },
];

export default PipelinesPermission;

// ------ Custom Hook
const useGetUserPermissions_ = (environmentID, setPermissions) => {
    // GraphQL hook
    const getUserPermissions = useGetUserPermissions();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const accessDictionary = {
        read: 'view',
        write: 'edit',
        run: 'run',
        assign_pipeline_permission: 'assign_permissions',
    };

    // Get permissions
    return async (userID, clearStates) => {
        const response = await getUserPermissions({ userID, environmentID });

        if (response === null) {
            clearStates();
        } else if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get permissions: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': get permissions', { variant: 'error' }));
        } else {
            const permissions = response.filter((a) => a.Resource === 'specific_pipeline');

            // Create an object and add Access types that are set to true. Pass it to state
            const incomingPermissions = {};
            permissions.map((a) => (incomingPermissions[accessDictionary[a.Access]] = true));

            // setIncomingPermissionsState({ ...DEFAULT_OPTIONS, ...incomingPermissions });
            // setOutgoingPermissionsState({ ...DEFAULT_OPTIONS, ...incomingPermissions });
        }
    };
};
