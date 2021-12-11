import { Box, Typography, Grid, IconButton, Avatar } from "@mui/material";
import { useMemo } from "react";
import { useTable, useGlobalFilter } from "react-table";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisV, faRedo } from '@fortawesome/free-solid-svg-icons'
import { faPlayCircle, faClock } from '@fortawesome/free-regular-svg-icons'
import CustomChip from "../../CustomChip";

const PipelineTable = () => {
    const columns = useMemo(
        () => [
            {
                Header: "Trigger",
                accessor: "trigger",
                Cell: row => (
                    <Grid container alignItems="center" justifyContent="center" flexWrap="nowrap">
                        <Box component={FontAwesomeIcon} fontSize={15} color="error.main" icon={faClock} />
                        <Typography fontSize={15} ml={.7} fontWeight={500} lineHeight="16.94px" >{row.value}</Typography>
                    </Grid>
                )
            },
            {
                Header: "Next run",
                accessor: "next_run",
                Cell: row => (
                    <Grid container alignItems="flex-start" flexDirection="column" justifyContent="center" mr={2} ml={2}>
                        <Typography fontSize={15} fontWeight={500}>{row.value}</Typography>
                        <Typography fontSize={15} fontWeight={500}>22:05</Typography>
                    </Grid>
                )
            },
            {
                Header: "Last run",
                accessor: "last_run",
                Cell: row => (
                    <Grid container alignItems="flex-start" flexDirection="column" justifyContent="flex-start">
                        <Typography fontSize={15} fontWeight={500}>{row.value}</Typography>
                        <Typography fontSize={15} fontWeight={500}>22:00 (1 min, 30s)</Typography>
                    </Grid>
                )
            },
            {
                Header: "Runs",
                accessor: "runs",
                Cell: row => (
                    <Grid container alignItems="center" justifyContent="center">
                        <Avatar sx={{ backgroundColor: "secondary.light", color: "secondary.main", mr: 1, width: 24, height: 24, fontSize: 14 }}>10</Avatar>
                        <Avatar sx={{ backgroundColor: "success.light", color: "success.main", width: 24, height: 24, fontSize: 14 }}>10</Avatar>
                    </Grid>
                )
            },
            {
                Header: "Actions",
                accessor: "actions",
                Cell: row => (
                    <Grid container alignItems="center" justifyContent="center">
                        <Box component={FontAwesomeIcon} fontSize={26} color="cyan.main" mr={.8} icon={faPlayCircle} />
                        <Box component={FontAwesomeIcon} fontSize={24} color="cyan.main" icon={faRedo} />
                    </Grid>
                )
                
            },
            {
                Header: "Status",
                accessor: "status",
                Cell: row => (
                    <Grid container alignItems="center" justifyContent="center">
                        <CustomChip amount={10} label="Running" customColor="green" />
                    </Grid>
                )
            },
            {
                Header: "Manage",
                accessor: "manage",
                Cell: row => (
                    <Grid container alignItems="center" justifyContent="center">
                        <IconButton>
                            <Box component={FontAwesomeIcon} fontSize={20} icon={faEllipsisV} />
                        </IconButton>
                    </Grid>
                )
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


    return(
        <Box component="table" mt={4} width="100%" {...getTableProps()}>
            <thead>
                {headerGroups.map((headerGroup) => (
                    <Box component="tr" display="grid" gridTemplateColumns="repeat(7, 1fr)" justifyContent="center" sx={{ padding: "0 24px 0 0" }} {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map((column) => (
                            <Box component="td" color="text.primary" fontWeight="600" fontSize="15px" textAlign="center" {...column.getHeaderProps()} >
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
                        <Box component="tr" {...row.getRowProps()} display="flex" flexDirection="column" borderRadius="5px" backgroundColor="background.secondary" sx={{ border: 1 ,borderColor: "divider", padding: 3, cursor: "pointer", "&:hover": { background: "background.hoverSecondary" }, mt: 2 }}>
                            <Grid display="flex" alignItems="center" justifyContent="space-between">
                                <Grid item>
                                    <Typography variant="h3" color="cyan.main">Remove logs</Typography>
                                    <Typography fontSize={15} color="text.primary" mt={.3}>This removes the logs that build up. </Typography>
                                </Grid>

                                <Grid display="flex" alignItems="center" pr={2}>
                                    <Box height={16} width={16} backgroundColor="rgba(114, 184, 66, 1)" borderRadius="100%"></Box>
                                    <Typography ml={1} fontSize={14}>Online</Typography>
                                </Grid>
                            </Grid>
                            <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" alignItems="center" mt={2}>
                                {row.cells.map((cell) => {
                                    return (
                                        <Box component="td" {...cell.getCellProps()} textAlign="center" >
                                            {cell.render("Cell")}
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    )
}

const data = [
    {
        id: 1,
        trigger: "Every 5 minutes",
        next_run: "27 Nov 2021",
        last_run: "27 Nov 2021",
        runs: [10, 10],
        actions: "",
        status: "",
        manage: ""
    },
    {
        id: 2,
        trigger: "Every 5 minutes",
        next_run: "27 Nov 2021",
        last_run: "27 Nov 2021",
        runs: [10, 10],
        actions: "",
        status: "",
        manage: ""
    },
]


export default PipelineTable;