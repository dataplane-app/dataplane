import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, ButtonGroup, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { useTheme } from '@emotion/react';

const ShowYAMLCodeDrawer = ({ handleClose }) => {
    // States
    const [fileName, setFileName] = useState('YAML');

    // Theme hook
    const theme = useTheme();

    // Editor configs
    const monaco = useMonaco();
    const file = files[fileName];

    useEffect(() => {
        if (monaco) {
            monaco.editor.defineTheme('customTheme', {
                base: 'vs',
                inherit: true,
                rules: [],
                colors: {
                    'editor.foreground': '#000000',
                    'editor.background': '#fff',
                    'editor.lineHighlightBackground': '#F2F2F2',
                    'editorLineNumber.foreground': '#222',
                    'editor.selectionBackground': '#EDEDED',
                    'editorGutter.background': '#F2F2F2',
                },
            });
        }
    }, [monaco]);

    return (
        <Box position="relative">
            <Box sx={{ p: '4.125rem 2.5rem', pb: 0 }} display="flex" alignItems="center" justifyContent="space-between">
                <Typography component="h2" variant="h3">
                    Code
                </Typography>
                <Button variant="text" onClick={handleClose} style={{ paddingLeft: '16px', paddingRight: '16px' }} startIcon={<FontAwesomeIcon icon={faTimes} />}>
                    Close
                </Button>
            </Box>

            <Box mt={2} p="0 2.5rem">
                <ButtonGroup variant="text" aria-label="text button group">
                    <Button
                        onClick={() => setFileName('YAML')}
                        sx={{
                            background: (theme) => (fileName === 'YAML' ? theme.palette.editor.selectedTabColor : theme.palette.editor.tabColor),
                            color: (theme) => theme.palette.editor.tabTextColor,
                            padding: '7px 11px',
                        }}>
                        YAML
                    </Button>
                    <Button
                        onClick={() => setFileName('JSON')}
                        sx={{
                            background: (theme) => (fileName === 'JSON' ? theme.palette.editor.selectedTabColor : theme.palette.editor.tabColor),
                            color: (theme) => theme.palette.editor.tabTextColor,
                            padding: '0 11px',
                        }}>
                        JSON
                    </Button>
                </ButtonGroup>
                <Editor
                    theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'customTheme'}
                    height="357px"
                    path={file.name}
                    defaultLanguage={file.language}
                    defaultValue={file.value}
                    options={{
                        automaticLayout: true,
                    }}
                />
            </Box>
        </Box>
    );
};

const YAML_CODE_EXAMPLE = `%TAG ! tag:clarkevans.com,2002:
--- !shape
  # Use the ! handle for presenting
  # tag:clarkevans.com,2002:circle
- !circle
  center: &ORIGIN {x: 73, y: 129}
  radius: 7
- !line
  start: *ORIGIN
  finish: { x: 89, y: 102 }
- !label
  start: *ORIGIN
  color: 0xFFEEBB
  text: Pretty vector drawing.
`;

const files = {
    YAML: {
        name: 'YAML',
        language: 'yaml',
        value: YAML_CODE_EXAMPLE,
    },
    JSON: {
        name: 'JSON',
        language: 'json',
        value: formatJSON(`{
            "port": 8080,
            "exclude_from_auth": [
              "/login",
              "/check_token",
              "/battles:get",
              "/team"
            ],
            "db": {
              "default_data": {
                "battles": [],
                "active_battle_id": null,
                "admin": {},
                "secret": "",
                "active_tokens": []
              },
              "path": ".db.json"
            }
        }
      `),
    },
};

// This function will format the JSON code
export function formatJSON(val = {}) {
    try {
        const res = JSON.parse(val);
        return JSON.stringify(res, null, 2);
    } catch {
        const errorJson = {
            error: `Something went wrong${val}`,
        };
        return JSON.stringify(errorJson, null, 2);
    }
}

export default ShowYAMLCodeDrawer;
