import { faPlayCircle } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Grid, MenuItem, TextField, Typography } from '@mui/material';
import CustomChip from '../components/CustomChip';
import RemoveLogsPageItem from '../components/MoreInfoContent/RemoveLogsPageItem';
import MoreInfoMenu from '../components/MoreInfoMenu';
import ReactFlow, { addEdge } from 'react-flow-renderer';
import ScheduleNode from '../components/CustomNodesContent/ScheduleNode';
import PlayNode from '../components/CustomNodesContent/PlayNode';
import ApiNode from '../components/CustomNodesContent/ApiNode';
import ClearLogsNode from '../components/CustomNodesContent/ClearLogsNode';
import { useState } from 'react';
import { useRef } from 'react';

const INITIAL_NODE_X_POSITION = 30;

const nodeTypes = {
    scheduleNode: ScheduleNode,
    playNode: PlayNode,
    apiNode: ApiNode,
    clearLogsNode: ClearLogsNode,
};

const RemoveLogs = () => {
    // Flow states
    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [elements, setElements] = useState(INITIAL_ELEMENTS);

    console.log(reactFlowInstance);

    //Flow methods
    const onLoad = (_reactFlowInstance) => setReactFlowInstance(_reactFlowInstance);
    const onConnect = (params) => setElements((els) => addEdge(params, els));

    return (
        <Box className="page">
            <Grid container alignItems="center" justifyContent="space-between" wrap="nowrap">
                <Box display="flex">
                    <Typography component="h2" variant="h2" color="text.primary">
                        Pipelines {'>'} Remove logs
                    </Typography>

                    <Grid display="flex" alignItems="flex-start">
                        <Box display="flex" alignItems="center" ml={4} mr={4}>
                            <Box height={16} width={16} backgroundColor="rgba(114, 184, 66, 1)" borderRadius="100%"></Box>
                            <Typography ml={1} fontSize={16} color="#2E6707">
                                Online
                            </Typography>
                        </Box>

                        <Box mr={3} textAlign="right">
                            <Typography variant="h3">{LOGS_MOCK.last_run}</Typography>
                            <Typography fontSize={17}>Last run</Typography>
                        </Box>

                        <Box ml={3} mr={3} textAlign="right">
                            <Typography variant="h3">{LOGS_MOCK.version}</Typography>
                            <Typography fontSize={17}>Version</Typography>
                        </Box>
                    </Grid>
                </Box>
                <MoreInfoMenu>
                    <RemoveLogsPageItem />
                </MoreInfoMenu>
            </Grid>

            <Grid mt={4} container alignItems="center" sx={{ width: { xl: '75%' }, flexWrap: 'nowrap' }}>
                <Grid item display="flex" alignItems="center" sx={{ alignSelf: 'center' }} flex={1.2}>
                    <CustomChip amount={2} label="Steps" margin={2} customColor="orange" />
                    <CustomChip amount={2} label="Running" margin={2} customColor="blue" />
                    <CustomChip amount={2} label="Succeeded" margin={2} customColor="green" />
                    <CustomChip amount={2} label="Failed" margin={2} customColor="red" />
                    <CustomChip amount={2} label="Workers online" margin={2} customColor="purple" />
                </Grid>

                <Grid item alignItems="center" display="flex" flex={1}>
                    <Typography variant="h3">Run</Typography>
                    <TextField label="Live" id="last" select size="small" sx={{ ml: 2, mr: 2, flex: 1 }}>
                        <MenuItem value="24">Last 24 hours</MenuItem>
                    </TextField>
                    <Box component={FontAwesomeIcon} fontSize={30} sx={{ color: 'cyan.main' }} icon={faPlayCircle} mr={1.5} />
                </Grid>
            </Grid>

            <Box mt={7} height={600} ref={reactFlowWrapper}>
                <ReactFlow nodeTypes={nodeTypes} elements={elements} onLoad={onLoad} onConnect={onConnect} snapToGrid={true} snapGrid={[15, 15]} />
            </Box>
        </Box>
    );
};

const INITIAL_ELEMENTS = [
    {
        id: '1',
        type: 'scheduleNode',
        sourcePosition: 'right',
        position: { x: INITIAL_NODE_X_POSITION, y: 5 },
    },
    {
        id: '2',
        type: 'playNode',
        sourcePosition: 'right',
        position: { x: INITIAL_NODE_X_POSITION, y: 110 },
    },
    {
        id: '3',
        type: 'apiNode',
        sourcePosition: 'right',
        position: { x: INITIAL_NODE_X_POSITION, y: 215 },
    },
    {
        id: '4',
        type: 'clearLogsNode',
        targetPosition: 'left',
        position: { x: 300, y: 50 },
    },
    { id: 'e1-4', source: '1', target: '4', animated: false },
];

const LOGS_MOCK = {
    id: 1,
    online: true,
    last_run: '22 Nov 2021 08:00',
    version: '0.0.1',
};

export default RemoveLogs;
