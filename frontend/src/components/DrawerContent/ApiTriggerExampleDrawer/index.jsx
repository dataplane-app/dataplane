import { Box, Typography, Button, useTheme } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
// import MonacoEditor, { monaco } from 'react-monaco-editor';
import Editor, { useMonaco } from '@monaco-editor/react';
import { useState, useEffect } from 'react';

const ApiTriggerExampleDrawer = ({ handleClose, host, triggerID }) => {
    // Theme hook
    const theme = useTheme();

    // Local state
    const [isCurl, setIsCurl] = useState(true);

    // Monaco editor
    const monaco = useMonaco();


    // Editor configs
    useEffect(() => {


        monaco?.editor.defineTheme('dp-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#0e1928',
                'editorLineNumber.foreground': '#3C7790',
                'editorLineNumber.activeForeground': '#0E236B',
            },
        });

    }, [monaco]);

    // // Editor configs
    // useEffect(() => {
    //     monaco.editor.defineTheme('dp-dark', {
    //         base: 'vs-dark',
    //         inherit: true,
    //         rules: [],
    //         colors: {
    //             'editor.background': '#0e1928',
    //             'editorLineNumber.foreground': '#3C7790',
    //             'editorLineNumber.activeForeground': '#0E236B',
    //         },
    //     });
    //     if (theme.palette.mode === 'dark') {
    //         monaco.editor.setTheme('dp-dark', {
    //             base: 'vs-dark',
    //             inherit: true,
    //             rules: [],
    //             colors: {
    //                 'editor.background': '#0e1928',
    //                 'editorLineNumber.foreground': '#3C7790',
    //                 'editorLineNumber.activeForeground': '#0E236B',
    //             },
    //         });
    //     }
    // }, [theme.palette.mode]);

    return (
        <Box position="relative">
            <Box sx={{ p: '4.125rem' }}>
                <Box position="absolute" top="26px" right="39px" display="flex" alignItems="center">
                    <Button variant="text" onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} startIcon={<FontAwesomeIcon icon={faTimes} />}>
                        Close
                    </Button>
                </Box>

                <Typography component="h2" variant="h2" mb={3}>
                    Examples
                </Typography>

                <Box display="flex" mb={2}>
                    <Typography //
                        onClick={() => setIsCurl(true)}
                        color="primary.main"
                        fontSize="1.0625rem"
                        fontWeight={isCurl ? 700 : null}
                        sx={{ textDecoration: isCurl ? 'underline' : null, cursor: 'pointer' }}>
                        Curl
                    </Typography>
                    <Typography
                        onClick={() => setIsCurl(false)}
                        color="primary.main"
                        fontSize="1.0625rem"
                        fontWeight={!isCurl ? 700 : null}
                        ml={4}
                        sx={{ textDecoration: !isCurl ? 'underline' : null, cursor: 'pointer' }}>
                        Python
                    </Typography>
                </Box>

                <Box height="600px">
                    <Editor
                        value={isCurl ? curlExample(host, triggerID) : pythonExample(host, triggerID)}
                        language="python"
                        theme={theme.palette.mode === 'light' ? 'vs' : 'dp-dark'}
                        height="100%"
                        options={{
                            minimap: { enabled: false },
                            hideCursorInOverviewRuler: { enabled: true },
                            wordWrap: true,
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default ApiTriggerExampleDrawer;

function pythonExample(host, triggerID) {
    return `import json
    import requests
    
    # optional api key per settings
    apikey = "{{api key}}"
    
    # Publish Url
    url = "${host + triggerID}"
    
    # optional pay load
    payload = {“key”: “value”} 
    
    headers= {
      "DataplaneAuth": apikey,
      'Content-type': 'application/json', 
      'Accept': 'text/plain'
    }
    
    response = requests.request("POST", url, headers=headers, data=payload)
    
    status_code = response.status_code
    print(str(status_code) + ": " + response.text)
    `;
}

function curlExample(host, triggerID) {
    return `curl --location --request POST '${host + triggerID}' \
    --header 'Content-Transfer-Encoding: application/json' \
    --header 'Accept: text/plain' \
    --header 'apikey: {{api key}}' \
    --header 'Content-Type: application/json' \
    --data-raw '{"hello":"hello"}'
    `;
}
