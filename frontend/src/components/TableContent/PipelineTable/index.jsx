import { Box, Typography, Grid, Drawer, Avatar, AvatarGroup } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTable, useGlobalFilter } from 'react-table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlayCircle, faClock } from '@fortawesome/free-regular-svg-icons';
import CustomChip from '../../CustomChip';
import MoreInfoMenu from '../../MoreInfoMenu';
import PipelineItemTable from '../../MoreInfoContent/PipelineTableItem';
import customDrawerStyles from '../../../utils/drawerStyles';
import ShowYAMLCodeDrawer from '../../DrawerContent/ShowYAMLCodeDrawer';
import { useHistory } from 'react-router-dom';

const PipelineTable = ({ data, filter, setPipelineCount }) => {
    // React router
    const history = useHistory();

    // Table item states
    const [isOpenYAML, setIsOpenYAML] = useState(false);

    useEffect(() => {
        setGlobalFilter(filter);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const columns = useMemo(
        () => [
            {
                Header: 'Trigger',
                accessor: (row) => [row.name, row.description],
                Cell: (row) => (
                    <Grid container alignItems="flex-start" flexWrap="nowrap">
                        <Box component={FontAwesomeIcon} fontSize={19} color="error.main" icon={faClock} />
                        <Box ml={0.7}>
                            <Typography fontSize={15} fontWeight={500} lineHeight="16.94px">
                                Every 5 minutes
                            </Typography>
                            <Typography fontSize={15} fontWeight={500} mt={0.5} lineHeight="16.94px">
                                */5****
                            </Typography>
                        </Box>
                    </Grid>
                ),
            },
            {
                Header: 'Next run',
                accessor: 'next_run',
                Cell: (row) => (
                    <Grid container alignItems="flex-start" flexDirection="column" justifyContent="center">
                        <Typography fontSize={15} fontWeight={500}>
                            {row.value}
                        </Typography>
                        <Typography fontSize={15} fontWeight={500}>
                            22:05
                        </Typography>
                    </Grid>
                ),
            },
            {
                Header: 'Last run',
                accessor: 'last_run',
                Cell: (row) => (
                    <Grid container alignItems="flex-start" flexDirection="column" justifyContent="flex-start">
                        <Typography fontSize={15} fontWeight={500}>
                            {row.value}
                        </Typography>
                        <Typography fontSize={15} fontWeight={500}>
                            22:00 (1 min, 30s)
                        </Typography>
                    </Grid>
                ),
            },
            {
                Header: 'Runs',
                accessor: 'runs',
                Cell: (row) => (
                    <Grid container alignItems="center" justifyContent="flex-start" ml={-0.5}>
                        <AvatarGroup max={4}>
                            <Avatar sx={{ backgroundColor: 'secondary.light', color: 'secondary.main', mr: 1, width: 24, height: 24, fontSize: 14, fontWeight: 700 }}>10</Avatar>
                            <Avatar sx={{ backgroundColor: 'success.light', color: 'success.main', width: 24, height: 24, fontSize: 14, fontWeight: 700 }}>10</Avatar>
                        </AvatarGroup>
                    </Grid>
                ),
            },
            {
                accessor: 'status',
                Cell: (row) => {
                    console.log(row);
                    return (
                        <Grid container alignItems="center">
                            <CustomChip amount={row.value?.amount} label={row.value?.text} customColor="green" />
                        </Grid>
                    );
                },
            },
        ],
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

    useEffect(() => {
        setPipelineCount(rows.length);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows]);

    return (
        <>
            <Box component="table" mt={4} width="100%" {...getTableProps()}>
                <Box component="tbody" display="flex" sx={{ flexDirection: 'column' }} {...getTableBodyProps()}>
                    {rows.map((row, i) => {
                        console.log(row);
                        prepareRow(row);
                        return (
                            <Box
                                component="tr"
                                {...row.getRowProps()}
                                display="flex"
                                flexDirection="column"
                                borderRadius="5px"
                                backgroundColor="background.secondary"
                                sx={{ border: 1, borderColor: 'divider', padding: 3, cursor: 'pointer', '&:hover': { background: 'background.hoverSecondary' }, mt: 2 }}>
                                <Box component="td">
                                    <Grid display="flex" alignItems="flex-start" justifyContent="space-between">
                                        <Grid item onClick={() => history.push({ pathname: `/pipelines/view/${row.original.pipelineID}`, state: row.original })}>
                                            <Typography variant="h3" color="cyan.main">
                                                {row.original.name}
                                            </Typography>
                                            <Typography fontSize={15} color="text.primary" mt={0.3}>
                                                {row.original.description}
                                            </Typography>
                                        </Grid>

                                        <Grid display="flex" alignItems="center">
                                            <Box display="flex" alignItems="center" pr={2}>
                                                <Box component={FontAwesomeIcon} fontSize={30} sx={{ color: 'cyan.main' }} icon={faPlayCircle} mr={1.5} />
                                                <Typography variant="h3">Version {row.original.version} </Typography>
                                            </Box>

                                            <Box display="flex" alignItems="center" pr={2} ml={1.2}>
                                                <Box
                                                    height={16}
                                                    width={16}
                                                    backgroundColor={`${row.original.online ? 'status.pipelineOnline' : 'error.main'}`}
                                                    borderRadius="100%"></Box>
                                                <Typography ml={1} fontSize={16} sx={{ color: row.original.online ? 'status.pipelineOnlineText' : 'error.main' }}>
                                                    {row.original.online ? 'Online' : 'Offline'}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>

                                    <Grid container alignItems="center" wrap="nowrap">
                                        <Box mt={3} sx={{ flex: 8 }}>
                                            {headerGroups.map((headerGroup) => (
                                                <Box
                                                    component="tr"
                                                    display="grid"
                                                    justifyContent="flex-start"
                                                    sx={{
                                                        padding: '0 9px 0 0',
                                                        gridTemplateColumns: {
                                                            xxs: '2fr 1.5fr 1.8fr 1fr 1fr',
                                                            lg: '2fr 1.5fr 1.8fr 1fr 1fr 2fr',
                                                        },
                                                    }}
                                                    {...headerGroup.getHeaderGroupProps()}>
                                                    {headerGroup.headers.map((column) => (
                                                        <Box component="td" color="text.primary" fontSize="17px" fontWeight="900" {...column.getHeaderProps()}>
                                                            {column.render('Header')}
                                                        </Box>
                                                    ))}
                                                </Box>
                                            ))}
                                            <Box
                                                display="grid"
                                                alignItems="flex-start"
                                                mt={1.3}
                                                sx={{
                                                    gridTemplateColumns: {
                                                        xxs: '2fr 1.5fr 1.8fr 1fr 1fr',
                                                        lg: '2fr 1.5fr 1.8fr 1fr 1fr 2fr',
                                                    },
                                                }}>
                                                {row.cells.map((cell) => {
                                                    return <Box {...cell.getCellProps()}>{cell.render('Cell')}</Box>;
                                                })}
                                            </Box>
                                        </Box>

                                        <Grid item sx={{ flex: 1 }} display="flex" alignItems="center" justifyContent="center">
                                            <MoreInfoMenu>
                                                <PipelineItemTable id={row.original.id} handleOpenYaml={() => setIsOpenYAML(!isOpenYAML)} />
                                            </MoreInfoMenu>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            <Drawer anchor="right" open={isOpenYAML} sx={customDrawerStyles} onClose={() => setIsOpenYAML(!isOpenYAML)}>
                <ShowYAMLCodeDrawer handleClose={() => setIsOpenYAML(false)} />
            </Drawer>
        </>
    );
};

// const data = [
//     {
//         id: 1,
//         trigger: 'Every 5 minutes',
//         version: '0.0.1',
//         next_run: '27 Nov 2021',
//         last_run: '27 Nov 2021',
//         runs: [10, 10],
//         actions: '',
//         status: {
//             text: 'Running',
//             amount: 10,
//         },
//         active: true,
//     },
//     {
//         id: 2,
//         trigger: 'Every 5 minutes',
//         version: '0.0.1',
//         next_run: '27 Nov 2021',
//         last_run: '27 Nov 2021',
//         runs: [10, 10, 20, 30, 50],
//         actions: '',
//         status: {
//             text: 'Ready',
//         },
//         active: false,
//     },
// ];

export default PipelineTable;
