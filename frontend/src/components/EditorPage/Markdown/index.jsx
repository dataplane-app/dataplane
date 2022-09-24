import { Box } from '@mui/material';
import { forwardRef } from 'react';
import CustomDragHandle from '../../CustomDragHandle';
import { useGlobalEditorState } from '../../../pages/Editor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';

const Markdown = forwardRef(({ children, ...rest }, ref) => {
    return (
        <div {...rest} ref={ref}>
            <Box
                sx={{
                    border: '1px solid',
                    borderColor: 'editorPage.borderColor',
                    overflowY: 'scroll',
                    height: '100%',
                }}>
                <MarkdownContent />
            </Box>
            {children}
            <CustomDragHandle left={16} />
        </div>
    );
});

export default Markdown;

export function MarkdownContent({ bottomPadding = false, sx }) {
    // Global states
    const EditorGlobal = useGlobalEditorState();

    return (
        <Box
            sx={{
                height: bottomPadding ? 'calc(100% - 81px)' : '100%',
                padding: '0px 16px 10px 16px',
                overflowY: 'scroll',
                ...sx,
            }}>
            <ReactMarkdown
                children={EditorGlobal.selectedFile?.diffValue?.value || EditorGlobal.selectedFile?.content?.value}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
            />
        </Box>
    );
}
