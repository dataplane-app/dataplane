import { faClock } from '@fortawesome/free-regular-svg-icons';
import { faMapMarkedAlt, faPlayCircle, faRunning, faPlug } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Grid, Typography } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { useGlobalMeState } from '../Navbar';

const defaultTypographyStyle = {
    fontSize: 11,
    fontWeight: 700,
    ml: 1.3,
};

const defaultIconStyle = {
    fontSize: 19,
    color: 'secondary.main',
};

const defaultParentStyle = {
    border: 3,
    borderColor: '#C4C4C4',
    padding: '7px 9px',
    flexWrap: 'noWrap',
    borderRadius: '9px',
    marginTop: 1.2,
    cursor: 'pointer',
    backgroundColor: 'transparent',
};

const EditorSidebar = () => {
    const pythonUUID = uuidv4();
    const bashUUID = uuidv4();

    const MeData = useGlobalMeState();
    const timezone = MeData.timezone.get();

    const onDragStart = (event, nodeType, id, nodeData) => {
        const data = { nodeType, id, nodeData };
        event.dataTransfer.setData('application/reactflow', JSON.stringify(data));
        event.dataTransfer.effectAllowed = 'move';
    };

    const inputs = [
        {
            id: 1,
            parent: 'Triggers',
            content: [
                {
                    id: uuidv4(),
                    icon: faPlayCircle,
                    text: 'Play',
                    eventType: 'playNode',
                    data: { triggerOnline: true },
                },
                {
                    id: uuidv4(),
                    icon: faClock,
                    text: 'Scheduler',
                    eventType: 'scheduleNode',
                    data: { triggerOnline: false, genericdata: { schedule: '', timezone, scheduleType: '' } },
                },
                {
                    id: uuidv4(),
                    icon: faPlug,
                    text: 'API',
                    eventType: 'apiNode',
                    data: { triggerOnline: true },
                },
            ],
        },
        {
            id: 2,
            parent: 'Processors',
            content: [
                {
                    id: pythonUUID,
                    icon: faRunning,
                    text: 'Python',
                    data: {
                        language: 'Python',
                        name: 'Python',
                        description: '',
                        triggerOnline: false,
                        workerGroup: '',
                        // eslint-disable-next-line no-template-curly-in-string
                        commands: [{ command: 'python3 -u ${{nodedirectory}}dp-entrypoint.py' }],
                    },
                    eventType: 'pythonNode',
                },
                {
                    id: bashUUID,
                    icon: faRunning,
                    data: { language: 'Bash', name: 'Bash', description: '', triggerOnline: false, workerGroup: '', commands: [{ command: `echo "Node ${bashUUID}"` }] },
                    text: 'Bash',
                    eventType: 'bashNode',
                },
            ],
        },
        {
            id: 3,
            parent: 'Checkpoints',
            content: [
                {
                    id: uuidv4(),
                    icon: faMapMarkedAlt,
                    text: 'Checkpoint',
                    eventType: 'checkpointNode',
                    data: { triggerOnline: false },
                },
            ],
        },
    ];

    return (
        <Box
            sx={{
                position: 'absolute',
                top: -20,
                right: -30,
                bottom: -40,
                border: 1,
                borderColor: 'divider',
                width: 158,
                padding: '12px 18px',
                zIndex: 10,
                backgroundColor: 'background.main',
            }}>
            <Box>
                {inputs.map((inpt) => (
                    <Box key={inpt.id} id={inpt.parent}>
                        <Typography fontWeight={700} fontSize={14} mt={2.5}>
                            {inpt.parent}
                        </Typography>
                        {inpt.content.map((cont) => (
                            <Grid
                                key={cont.id}
                                id={`drag_${cont.eventType}`}
                                container
                                alignItems="center"
                                sx={{ ...defaultParentStyle, '&:hover': { backgroundColor: 'sidebar.main' } }}
                                draggable
                                onDragStart={(event) => onDragStart(event, cont.eventType, cont.id, cont.data)}>
                                <Box sx={defaultIconStyle} component={FontAwesomeIcon} icon={cont.icon} />
                                <Typography sx={defaultTypographyStyle}>{cont.text}</Typography>
                            </Grid>
                        ))}
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default EditorSidebar;
