import { Box, Button, Drawer, Grid, Typography } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useGlobalFilter, useTable } from 'react-table';
import CustomChip from '../components/CustomChip';
import AddPipelinesPermissionDrawer from '../components/DrawerContent/AddPipelinesPermissionDrawer';
import Search from '../components/Search';
import { usePipelinePermissions } from '../graphql/getPipelinePermissions';
import { useSnackbar } from 'notistack';
import { useGlobalEnvironmentState } from '../components/EnviromentDropdown';
import { useGlobalMeState } from '../components/Navbar';

const PipelinesPermission = () => {
    // React router
    const history = useHistory();
    const { state: name } = useLocation();

    // Ref for scroll to top
    const scrollRef = useRef(null);

    // Global state
    const Environment = useGlobalEnvironmentState();
    const MeData = useGlobalMeState();

    // Local state
    const [permissions, setPermissions] = useState([]);

    // Drawer state
    const [isOpenAddPermissions, setIsOpenAddPermissions] = useState(false);
    const [type, setType] = useState('User');

    // Custom GraphQL hooks
    const pipelinePermissions = usePipelinePermissions_(Environment.id.get(), setPermissions, MeData.user_id.get());

    useEffect(() => {
        // Scroll to top on load
        // scrollRef.current.parentElement.scrollIntoView();
        if (Environment.id.get() && MeData.user_id.get()) {
            pipelinePermissions();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Environment.id.get(), MeData.user_id.get()]);

    // table
    const columns = useMemo(
        () => [
            {
                Header: 'Member',
                accessor: (row) => [row.FirstName + ' ' + row.LastName, row.JobTitle],
                Cell: (row) => <CustomName row={row} onClick={() => history.push(`/${row.row.original.Email ? 'teams' : 'teams/access'}/${row.row.original.SubjectID}`)} />,
            },
            {
                Header: 'Email',
                accessor: (row) => [row.Subject, row.Email],
                Cell: (row) => <CustomEmail row={row} />,
            },
            {
                Header: 'Active',
                accessor: 'Active',
                Cell: (row) => (row.value === true ? <CustomChip label="Active" customColor="green" /> : <CustomChip label="Inactive" customColor="red" />),
            },
        ],

        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
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
                Pipeline permissions {'>'} {name}
            </Typography>

            <Box mt={4} sx={{ width: { md: '630px' } }}>
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

            <Drawer
                anchor="right"
                open={isOpenAddPermissions}
                onClose={() => {
                    setIsOpenAddPermissions(!isOpenAddPermissions);
                    pipelinePermissions();
                }}>
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

export default PipelinesPermission;

// ------ Custom Hook
const usePipelinePermissions_ = (environmentID, setPermissions, userID) => {
    // GraphQL hook
    const pipelinePermissions = usePipelinePermissions();

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    // URI parameter
    const { pipelineId } = useParams();

    // Get permissions
    return async () => {
        const response = await pipelinePermissions({ userID, environmentID, pipelineID: pipelineId });

        if (response === null) {
            setPermissions([]);
        } else if (response.r === 'error') {
            closeSnackbar();
            enqueueSnackbar("Can't get permissions: " + response.msg, { variant: 'error' });
        } else if (response.errors) {
            response.errors.map((err) => enqueueSnackbar(err.message + ': get permissions', { variant: 'error' }));
        } else {
            setPermissions(response);
        }
    };
};
