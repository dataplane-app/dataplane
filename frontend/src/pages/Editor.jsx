import { faPlayCircle } from '@fortawesome/free-regular-svg-icons';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Editor from '@monaco-editor/react';
import { AppBar, Box, Button, Chip, Drawer, FormControl, Grid, InputLabel, MenuItem, Select, Toolbar, Typography, useTheme } from '@mui/material';
import Navbar from '../components/Navbar';
import { FileManager, FileNavigator } from '@opuscapita/react-filemanager';
import connectorNodeV1 from '@opuscapita/react-filemanager-connector-node-v1';
import { useContext, useRef, useState } from 'react';
import LogsDrawer from '../components/DrawerContent/LogsDrawer';
import customDrawerStyles from '../utils/drawerStyles';
import { ColorModeContext } from '../App';

const drawerWidth = 240;
const apiOptions = {
    ...connectorNodeV1.apiOptions,
    apiRoot: `https://demo.core.dev.opuscapita.com/filemanager/master`, // Or you local Server Node V1 installation.
};

const PipelineEditor = () => {
    // States
    const [isOpenLogs, setIsOpenLogs] = useState(false);
    const [selectedFile, setSelectedFile] = useState(FILE_MANAGER_MOCK['1']);
    const [locations, setLocations] = useState([]);

    // Ref
    const editorRef = useRef(null);

    // Hooks
    const theme = useTheme();
    const colorMode = useContext(ColorModeContext);

    // Functions
    const handleThemeSelect = (e) => {
        const color = e.target.value;
        localStorage.setItem('theme', color);
        colorMode.toggleColorMode();
    };

    const handleEditorOnMount = (editor) => {
        editorRef.current = editor;

        window.addEventListener('resize', () => {
            editor.layout({
                width: 'auto',
                height: 'auto',
            });
        });
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                elevation={0}
                position="fixed"
                sx={{ zIndex: (theme) => theme.zIndex.drawer, background: (theme) => theme.palette.background.secondary, borderBottom: 1, borderColor: 'divider' }}>
                <Toolbar>
                    <Navbar />
                </Toolbar>
            </AppBar>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    zIndex: 1100,

                    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', backgroundColor: 'editorPageBg.main', border: 'none' },
                }}>
                <Toolbar />
                <Box sx={{ height: '100%', pr: 1, pl: 1 }}>
                    <Box mt={5.5}>
                        <FormControl size="small" sx={{ backgroundColor: 'background.main', width: '100%' }}>
                            <InputLabel id="demo-simple-select-standard-label">Theme</InputLabel>
                            <Select
                                IconComponent={() => <Box component={FontAwesomeIcon} icon={faCaretDown} fontSize="1.5rem" mr={1} color="divider" />}
                                labelId="demo-simple-select-standard-label"
                                id="demo-simple-select-standard"
                                value={theme.palette.mode}
                                onChange={handleThemeSelect}
                                label="Theme">
                                <MenuItem value="light">Light</MenuItem>
                                <MenuItem value="dark">Dark</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ mt: 2, backgroundColor: 'background.main', width: '100%' }}>
                            <InputLabel id="demo-simple-select-standard-label">Dev worker</InputLabel>
                            <Select
                                IconComponent={() => <Box component={FontAwesomeIcon} icon={faCaretDown} fontSize="1.5rem" mr={1} color="divider" />}
                                labelId="demo-simple-select-standard-label"
                                id="demo-simple-select-standard"
                                value=""
                                onChange={() => {}}
                                label="Dev worker"></Select>
                        </FormControl>

                        <FormControl size="small" sx={{ mt: 2, backgroundColor: 'background.main', width: '100%' }}>
                            <InputLabel id="demo-simple-select-standard-label">Draft</InputLabel>
                            <Select
                                IconComponent={() => <Box component={FontAwesomeIcon} icon={faCaretDown} fontSize="1.5rem" mr={1} color="divider" />}
                                labelId="demo-simple-select-standard-label"
                                id="demo-simple-select-standard"
                                value=""
                                onChange={() => {}}
                                label="Draft"></Select>
                        </FormControl>

                        <Box sx={{ height: '332px', backgroundColor: 'background.main', border: '1px solid  #D3D3D3', mt: '28px', borderRadius: '7px' }}>
                            <FileManager>
                                <FileNavigator
                                    id="filemanager-1"
                                    api={connectorNodeV1.api}
                                    apiOptions={apiOptions}
                                    capabilities={connectorNodeV1.capabilities}
                                    listViewLayout={connectorNodeV1.listViewLayout}
                                    viewLayoutOptions={connectorNodeV1.viewLayoutOptions}
                                    onResourceLocationChange={(resourceLocation) => setLocations(resourceLocation)}
                                    onResourceItemDoubleClick={({ event, number, rowData }) => console.log(rowData)}
                                    onResourceItemClick={({ event, number, rowData }) => setSelectedFile({ rowData, ...FILE_MANAGER_MOCK[rowData.id] })}
                                />
                            </FileManager>
                        </Box>
                    </Box>
                </Box>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 4, height: '100vh' }} backgroundColor="editorPageBg.main">
                <Toolbar />
                <Box width="100%">
                    <Grid pt={1} container alignItems="center" justifyContent="space-between">
                        <Grid item>
                            <Typography component="h2" variant="h4" fontWeight={700} color="text.primary">
                                Pipeline permissions {'>'} Remove Logs {'>'} Clear the logs
                            </Typography>
                            <Typography variant="h4" mt={0.4}>
                                /{locations.map((loc, idx) => `${idx !== 0 ? '/' : ''}${loc.name}`)} /{selectedFile && selectedFile.name}
                            </Typography>
                        </Grid>

                        <Grid item sx={{ mt: { xxs: 2, lg: 0 } }}>
                            <Button variant="contained">Save</Button>
                            <Button variant="outlined" sx={{ mr: 1.4, ml: 1.4, backgroundColor: 'background.main' }}>
                                Save draft
                            </Button>
                            <Button variant="outlined" sx={{ backgroundColor: 'background.main' }}>
                                Close
                            </Button>
                        </Grid>
                    </Grid>

                    <Grid container mt={3} alignItems="center">
                        <Chip
                            avatar={<Box component={FontAwesomeIcon} sx={{ color: '#ffffff!important', fontSize: 18 }} icon={faPlayCircle} />}
                            label="Play"
                            sx={{ mr: 0, bgcolor: 'primary.main', color: '#fff', fontWeight: 600 }}
                        />
                        <Button variant="text" sx={{ ml: 2, color: 'cyan.main' }} onClick={() => setIsOpenLogs(true)}>
                            Logs
                        </Button>
                    </Grid>
                </Box>

                <Box mt={4}>
                    <Editor
                        onMount={handleEditorOnMount}
                        language={selectedFile.language}
                        path={selectedFile.name}
                        defaultValue={selectedFile.content}
                        value={selectedFile.content}
                        theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'customTheme'}
                        height="357px"
                    />
                </Box>
            </Box>

            <Drawer anchor="right" open={isOpenLogs} onClose={() => setIsOpenLogs(!isOpenLogs)} sx={customDrawerStyles}>
                <LogsDrawer />
            </Drawer>
        </Box>
    );
};

const PYTHON_CODE_EXAMPLE = `import banana

    
    class Monkey:
        # Bananas the monkey can eat
        capacity = 10
        def eat(self, n):
            """Make the monkey eat n bananas!"""
            self.capacity -= n * banana.size

        def feeding_frenzy(self):
            self.eat(9.25)
            return "Yum yum"

`;

const FILE_MANAGER_MOCK = {
    1: {
        language: 'python',
        name: 'monkey.py',
        content: PYTHON_CODE_EXAMPLE,
    },
    L2hlbGxvLXdvcmxkLmpz: {
        language: 'javascript',
        name: 'hello_world.js',
        content: `
            const message = 'Hello world';

            console.log(message)
        `,
    },
};

export default PipelineEditor;
