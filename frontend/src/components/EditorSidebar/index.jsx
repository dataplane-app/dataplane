import { faClock } from '@fortawesome/free-regular-svg-icons';
import { faGlobe, faMapMarkedAlt, faPlayCircle, faRunning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Grid, Typography } from '@mui/material';

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
};

const EditorSidebar = () => {
    const onDragStart = (event, nodeType, id) => {
        const data = { nodeType, id };
        event.dataTransfer.setData('application/reactflow', JSON.stringify(data));
        event.dataTransfer.effectAllowed = 'move';
    };

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
                    <>
                        <Typography fontWeight={700} fontSize={14} mt={2.5} key={inpt.id}>
                            {inpt.parent}
                        </Typography>
                        {inpt.content.map((cont) => (
                            <Grid
                                key={cont.id}
                                container
                                alignItems="center"
                                sx={defaultParentStyle}
                                draggable
                                onDragStart={(event) => onDragStart(event, cont.eventType, cont.id)}>
                                <Box sx={defaultIconStyle} component={FontAwesomeIcon} icon={cont.icon} />
                                <Typography sx={defaultTypographyStyle}>{cont.text}</Typography>
                            </Grid>
                        ))}
                    </>
                ))}
            </Box>
        </Box>
    );
};

const inputs = [
    {
        id: 1,
        parent: 'Triggers',
        content: [
            {
                id: 'djdsfjdf',
                icon: faPlayCircle,
                text: 'Play trigger',
                eventType: 'playNode',
            },
            {
                id: 'djdsfjdf3',
                icon: faClock,
                text: 'Scheduler',
                eventType: 'scheduleNode',
            },
            {
                id: 'djdsfjdf4',
                icon: faGlobe,
                text: 'API trigger',
                eventType: 'apiNode',
            },
        ],
    },
    {
        id: 2,
        parent: 'Processors',
        content: [
            {
                id: 'djdsfjdf5',
                icon: faRunning,
                text: 'Python',
                eventType: 'clearLogsNode',
            },
            {
                id: 'djdsfjdf6',
                icon: faRunning,
                text: 'Bash',
                eventType: 'clearLogsNode',
            },
        ],
    },
    {
        id: 3,
        parent: 'Checkpoints',
        content: [
            {
                id: 1,
                icon: faMapMarkedAlt,
                text: 'Checkpoint',
                eventType: 'input',
            },
        ],
    },
];

export default EditorSidebar;
