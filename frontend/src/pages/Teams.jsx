import { useState } from "react";
import { Box, Grid, Typography, IconButton, Chip ,Button, Drawer } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons'
import { useMemo } from 'react';
import Search from "../components/Search";
import { useTable, useGlobalFilter } from "react-table";
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import CustomChip from '../components/CustomChip';
import { useGetUsers } from '../graphql/getUsers';
import { useSnackbar } from 'notistack';
import AddUserDrawer from '../components/DrawerContent/AddUserDrawer';

const drawerWidth = 507;
const drawerStyles = {
width: drawerWidth,
flexShrink: 0,
zIndex: 9999,
[`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', background:'#F7FBFD'},
}

const Teams = () => {
    let history = useHistory();
    const { enqueueSnackbar } = useSnackbar();

    // Users state
    const [data, setData] = useState([])

    // Sidebar states
    const [isOpenDeleteUser, setIsOpenDeleteUser] = useState(false);

    // Get users on load
    const getUsers = useGetUsers();
    useEffect(() => {
        (async function(){
            let users = await getUsers();
            !users.errors ? setData(users) : enqueueSnackbar("Unable to retrieve users", { variant: "error" });
        })()
    }, [])

    const columns = useMemo(
        () => [
            {
                Header: "Member",
                accessor: row => [row.first_name, row.last_name, row.job_title],
                Cell: row => <CustomMember row={row} />,
            },
            {
                Header: "Email",
                accessor: row => [row.email, row.job_title],
                Cell: row => <CustomEmail row={row} />,
            },
            {
                Header: "Role",
                // accessor: "job_title",
                Cell: row => <Typography variant="subtitle2" color="text.primary">{row.value}</Typography>
            },
            {
                Header: "Permissions",
                accessor: "permissions",
                Cell: row => <Typography variant="subtitle2" color="text.primary">{row.value}</Typography>
            },
            {
                Header: "Status",
                accessor: "status",
                Cell: row => <Chip label={row.value} color="success" size="small" />
            },
            {
                Header: "Manage",
                accessor: "user_id",
                Cell: row => <IconButton onClick={() => history.push(`/teams/${row.value}`)}>
                    <Box component={FontAwesomeIcon} fontSize={20} icon={faEllipsisV} />
                    </IconButton>
            },
        ],
        []
    );

    // Use the state and functions returned from useTable to build your UI
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, state, setGlobalFilter } =
        useTable({
            columns,
            data,
        }, useGlobalFilter);

    const { globalFilter } = state;

    useEffect(() => {
        console.log(globalFilter)
    }, [globalFilter])

    return (
        <Box className="page">
            <Typography component="h2" variant="h2" color="text.primary">
                Team
            </Typography>

            <Box mt={4} sx={{ width: { lg: "80%" } }}>
                <Grid container mt={4} direction="row" alignItems="center" justifyContent="flex-start">
                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: "center" }}>
                        <CustomChip amount={data.length} label="Members" margin={2} customColor="orange" />
                    </Grid>

                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: "center", flex: 1 }}>
                        <Search placeholder="Find members" setGlobalFilter={setGlobalFilter}/>
                    </Grid>

                    <Grid display="flex">
                        <Button onClick={() => setIsOpenDeleteUser(true)} variant="contained" color="primary" width="3.81rem" >Add</Button>
                    </Grid>
                </Grid>
            </Box>

            <Box component="table" mt={4} sx={{ width: { lg: "80%" } }} {...getTableProps()}>
                <thead>
                    {headerGroups.map((headerGroup) => (
                        <Box component="tr" display="grid" gridTemplateColumns="repeat(6, 1fr)" justifyContent="flex-start" {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map((column) => (
                                <Box component="td" color="text.primary" fontWeight="600" fontSize="15px" textAlign="center" {...column.getHeaderProps()}>
                                    {column.render("Header")}
                                </Box>
                            ))}
                        </Box>
                    ))}
                </thead>
                <Box component="tbody" display="flex" sx={{ flexDirection: "column" }} {...getTableBodyProps()}>
                    {rows.map((row, i) => {
                        prepareRow(row);
                        return (
                            <Box component="tr" {...row.getRowProps()} display="grid" gridTemplateColumns="repeat(6, 1fr)" alignItems="center" borderRadius="5px" backgroundColor="background.secondary" mt={2} sx={{ border: 1, borderColor: "divider", padding: "15px 0", cursor: "pointer", "&:hover": { background: "background.hoverSecondary" } }}>
                                {row.cells.map((cell) => {
                                    return (
                                        <Box component="td" {...cell.getCellProps()} textAlign="center" >
                                            {cell.render("Cell")}
                                        </Box>
                                    );
                                })}
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            <Drawer anchor="right" open={isOpenDeleteUser} onClose={() => setIsOpenDeleteUser(!isOpenDeleteUser)} sx={drawerStyles}>
                <AddUserDrawer user="Saul Frank" handleClose={() => setIsOpenDeleteUser(false)}/>
            </Drawer>
        </Box>
    );
};

const CustomMember = ({ row }) => {
    const [first_name, last_name, job_title] = row.value

    return (
        <Grid container direction="column" alignItems="center" justifyContent="flex-start">
            <Typography component="h4" variant="h3" color="primary" className="text-blue font-black text-lg ">{first_name} {last_name}</Typography>
            <Typography component="h5" variant="subtitle1" >{job_title}</Typography>
        </Grid>
    )
}

const CustomEmail = ({ row }) => {
    const [email, job_title] = row.value

    return (
        <Grid container direction="column" alignItems="flex-start" ml={2}>
            <Typography component="h4" variant="subtitle1" color="text.primary" mb={.7}>{email}</Typography>
            <CustomChip label={job_title} customColor="orange" size="small" />
        </Grid>
    )
}


export default Teams;

