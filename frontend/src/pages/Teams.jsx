import { Box, Grid, Typography, Chip, Avatar, IconButton, Button } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons'
import { useMemo } from 'react';
import Search from "../components/Search";
import { useTable, useGlobalFilter } from "react-table";
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Teams = () => {
    let navigate = useNavigate();

    const columns = useMemo(
        () => [
            {
                Header: "Member",
                accessor: "member",
                // sortable: true,
                // maxWidth: '600px',
                Cell: row => <CustomMember row={row} />,
            },
            {
                Header: "Email",
                accessor: "email",
                Cell: row => <CustomEmail row={row} />,
            },
            {
                Header: "Role",
                accessor: "role",
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
                Cell: row => <Chip label={row.value} color="primary" size="small" />
            },
            {
                Header: "Manage",
                accessor: "manage",
                Cell: row => <IconButton>
                    <Box component={FontAwesomeIcon} fontSize={20} icon={faEllipsisV} onClick={() => navigate(`/teams/${row.value.id}`)}/>
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
        <Box className="team">
            <Typography component="h2" variant="h2" color="text.primary">
                Team
            </Typography>

            <Box mt={4} width="80%">
                <Grid container mt={4} direction="row" alignItems="center" justifyContent="flex-start">
                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: "center" }}>
                        <Chip color="primary" avatar={<Avatar>2</Avatar>} label="Members" sx={{ mr: 2 }} />
                    </Grid>

                    <Grid item display="flex" alignItems="center" sx={{ alignSelf: "center", flex: 1 }}>
                        <Search placeholder="Find members" />
                    </Grid>

                    <Grid display="flex">
                        <Button variant="contained" color="secondary" width="3.81rem" >Add</Button>
                    </Grid>
                </Grid>
            </Box>

            <Box component="table" mt={4} width="80%" {...getTableProps()}>
                <thead>
                    {headerGroups.map((headerGroup) => (
                        <Box component="tr" display="grid" gridTemplateColumns="repeat(6, 1fr)" justifyContent="flex-start" {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map((column) => (
                                <Box component="td" color="text.primary" fontWeight="900" fontSize="1.0625rem" textAlign="center" {...column.getHeaderProps()}>
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
                            <Box component="tr" {...row.getRowProps()} display="grid" gridTemplateColumns="repeat(6, 1fr)" alignItems="center" borderRadius="5px" mt={2} sx={{ border: 1, borderColor: "divider", padding: "15px 0", cursor: "pointer", "&:hover": { background: "rgba(244, 244, 244, 1)" } }}>
                                {row.cells.map((cell) => {
                                    return (
                                        <Box component="td" {...cell.getCellProps()} textAlign="center">
                                            {cell.render("Cell")}
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
};

const CustomMember = ({ row }) => {
    return (
        <Grid container direction="column" alignItems="center" justifyContent="flex-start">
            <Typography component="h4" variant="h3" color="secondary" className="text-blue font-black text-lg ">{row.value.name}</Typography>
            <Typography component="h5" variant="subtitle1" >{row.value.occupation}</Typography>
        </Grid>
    )
}

const CustomEmail = ({ row }) => {
    return (
        <Grid container direction="column" alignItems="center">
            <Typography component="h4" variant="subtitle1" color="text.primary">{row.value.email}</Typography>
            <Chip label={row.value.role} color="primary" size="small" />
        </Grid>
    )
}

const data = [
    {
        id: 1,
        member: {
            name: "Saul Frank",
            occupation: "Data Engineer"
        },
        email: {
            email: "saulfrank@email.com",
            role: "Admin"
        },
        role: "Admin",
        permissions: "Admin",
        status: "Active",
        manage: {
            id: 1
        }
    },
    {
        id: 2,
        member: {
            name: "Nicolas Marqui",
            occupation: "Software Engineer"
        },
        email: {
            email: "saulfrank@email.com",
            role: "Admin"
        },
        role: "Admin",
        permissions: "Admin",
        status: "Active",
        manage: {
            id: 2
        }
    },
]

export default Teams;
