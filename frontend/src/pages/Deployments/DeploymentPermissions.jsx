import { Box, Button, Drawer, Grid, Typography } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useGlobalFilter, useTable } from 'react-table';
import CustomChip from '../../components/CustomChip';
import AddDeploymentPermissionsDrawer from '../../components/DrawerContent/AddDeploymentPermissionsDrawer';
import Search from '../../components/Search';
import { useDeploymentPermissions } from '../../graphql/deployments/getDeploymentPermissions';
import { useSnackbar } from 'notistack';
import { useGlobalEnvironmentState } from '../../components/EnviromentDropdown';
import { useGlobalMeState } from '../../components/Navbar';
import { useGlobalAuthState } from '../../Auth/UserAuth';
import EditDeploymentPermissionsDrawer from '../../components/DrawerContent/EditDeploymentPermissionsDrawer';

export const DEFAULT_OPTIONS = {
    view: false,
    run: false,
    assign_permissions: false,
};

const DeploymentPermissions = () => {
    // React router
    const { state: name } = useLocation();

    // Ref for scroll to top
    const scrollRef = useRef(null);

    // Global state
    const Environment = useGlobalEnvironmentState();
    const MeData = useGlobalMeState();

    // Local state
    const [permissions, setPermissions] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState({
        user_id: '',
        first_name: '',
        last_name: '',
        email: '',
        type: '',
    });

    const authState = useGlobalAuthState();
    const jwt = authState.authToken.get();

    // Drawer state
    const [isOpenAddPermissions, setIsOpenAddPermissions] = useState(false);
    const [isOpenEditPermissions, setIsOpenEditPermissions] = useState(false);
    const [type, setType] = useState('User');

    // Custom GraphQL hooks
    const deploymentPermissions = useDeploymentPermissionsHook(Environment.id.get(), setPermissions, MeData.user_id.get());

    useEffect(() => {
        // Scroll to top on load
        if (Environment.id.get() && MeData.user_id.get()) {
            scrollRef.current.parentElement.scrollIntoView();
            deploymentPermissions();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.id.get(), MeData.user_id.get()]);

    const handleClick = (permission) => {
        permission.Subject === 'user' ? setType('User') : setType('Access group');
        setSelectedSubject({
            ...selectedSubject,
            user_id: permission.SubjectID,
            first_name: permission.FirstName,
            last_name: permission.LastName,
            email: permission.Email,
            type: permission.Subject,
        });

        setIsOpenEditPermissions(true);
    };

    // table
    const columns = useMemo(
        () => [
            {
                Header: 'Member',
                accessor: (row) => [row.FirstName + ' ' + row.LastName, row.JobTitle],
                Cell: (row) => <CustomName row={row} onClick={() => handleClick(row.row.original)} />,
            },
            {
                Header: 'Email',
                accessor: (row) => [row.Subject, row.Email],
                Cell: (row) => <CustomEmail row={row} />,
            },
            {
                Header: 'Access',
                accessor: 'Access',
                Cell: (row) => <CustomAccess row={row} onClick={() => handleClick(row.row.original)} />,
            },
            {
                Header: 'Active',
                accessor: 'Active',
                Cell: (row) => (row.value === true ? <CustomChip label="Active" customColor="green" /> : <CustomChip label="Inactive" customColor="red" />),
            },
        ],

        // eslint-disable-next-line react-hooks/exhaustive-deps
        [jwt]
    );

    const { getTableProps, getTableBodyProps, rows, prepareRow, setGlobalFilter } = useTable(
        {
            columns,
            data: permissions,
        },
        useGlobalFilter
    );

    return (
        <Box className="page" ref={scrollRef}>
            <Typography component="h2" variant="h2" color="text.primary">
                Deployment permissions {'>'} {name}
            </Typography>

            <Box mt={4} sx={{ width: { md: '800px' } }}>
                <Grid container mt={4} direction="row" alignItems="center" justifyContent="flex-start">
                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center' }}>
                        <CustomChip amount={rows.length} label="Permissions" margin={2} customColor="orange" />
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
                                    gridTemplateColumns="1fr 1fr 1fr .4fr"
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

            <Drawer
                anchor="right"
                open={isOpenAddPermissions}
                onClose={() => {
                    setIsOpenAddPermissions(!isOpenAddPermissions);
                    setSelectedSubject({
                        user_id: '',
                        first_name: '',
                        last_name: '',
                        email: '',
                        type: '',
                    });
                }}>
                <AddDeploymentPermissionsDrawer
                    typeToAdd={type}
                    subjectsWithPermissions={permissions.map((a) => a.SubjectID)}
                    selectedSubject={selectedSubject}
                    handleClose={() => setIsOpenAddPermissions(false)}
                    refreshPermissions={deploymentPermissions}
                />
            </Drawer>

            <Drawer
                anchor="right"
                open={isOpenEditPermissions}
                onClose={() => {
                    setIsOpenEditPermissions(false);
                    setSelectedSubject({
                        user_id: '',
                        first_name: '',
                        last_name: '',
                        email: '',
                        type: '',
                    });
                }}>
                <EditDeploymentPermissionsDrawer
                    selectedSubject={selectedSubject}
                    handleClose={() => {
                        setIsOpenEditPermissions(false);
                        setSelectedSubject({
                            user_id: '',
                            first_name: '',
                            last_name: '',
                            email: '',
                            type: '',
                        });
                    }}
                    refreshPermissions={deploymentPermissions}
                />
            </Drawer>
        </Box>
    );
};

const CustomName = ({ row, onClick }) => {
    const [name, job_title] = row.value;

    return (
        <Grid container direction="column" mx="22px" alignItems="left" justifyContent="flex-start" onClick={onClick}>
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
    const [subject, email] = row.value;

    return (
        <Box>
            <CustomChip label={subject === 'user' ? 'User' : 'Access group'} customColor={subject === 'user' ? 'purple' : 'orange'} />
            <Typography component="h5" variant="subtitle1" mt={0.5}>
                {email}
            </Typography>
        </Box>
    );
};

const CustomAccess = ({ row, onClick }) => {
    const access = row.value.split(','); //["read", "write"]

    const accessDictionary = {
        view: 'read',
        run: 'run',
        assign_permissions: 'assign_deployment_permission',
    };

    return (
        <Box display="flex" flexDirection="column">
            {Object.keys(DEFAULT_OPTIONS).map((option) => (
                <Box key={option} display="flex" flexDirection="row" alignItems="center" onClick={onClick}>
                    <Box
                        component={FontAwesomeIcon}
                        sx={{
                            flex: 0.2,
                            fontSize: 14,
                            fontWeight: 900,
                            paddingY: '2px',
                            mr: '10px',
                            color: access.includes(accessDictionary[option]) ? 'status.pipelineOnline' : '#F80000',
                        }}
                        icon={access.includes(accessDictionary[option]) ? faCheck : faTimes}
                    />
                    <Typography flex={4} variant="subtitle1" lineHeight="16px">
                        {prettyAccess(option)}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
};

export default DeploymentPermissions;

// ------ Custom Hook
const useDeploymentPermissionsHook = (environmentID, setPermissions, userID) => {
    // GraphQL hook
    const deploymentPermissions = useDeploymentPermissions();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // URI parameter
    const { deploymentId } = useParams();

    // Get permissions
    return async () => {
        const response = await deploymentPermissions({ userID, environmentID, deploymentID: deploymentId });

        if (response === null) {
            setPermissions([]);
        } else if (response.r || response.error) {
            closeSnackbar();
            enqueueSnackbar("Can't get permissions: " + (response.msg || response.r || response.error), { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message, { variant: 'error' }));
        } else {
            setPermissions(response);
        }
    };
};

// Utility function
function prettyAccess(access) {
    access = access[0].toUpperCase() + access.slice(1);
    access = access.replace('_', ' ');
    return access;
}
