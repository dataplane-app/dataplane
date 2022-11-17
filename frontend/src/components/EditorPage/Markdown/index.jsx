import { Box } from '@mui/material';
import { forwardRef, useState } from 'react';
import CustomDragHandle from '../../CustomDragHandle';
import { useGlobalEditorState } from '../../../pages/Editor';
import styled from '@emotion/styled';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

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

    // Copy code state
    const [hover, setHover] = useState(false);
    const [copyActive, setCopyActive] = useState(false);

    const copy = (text) => {
        navigator.clipboard.writeText(text);
        setCopyActive(true);

        setTimeout(() => {
            setCopyActive(false);
        }, 2000);
    };

    // ** Styled  button
    const Button = styled.button((props) => ({
        alignItems: 'center',
        border: '1px solid #dadde1',
        borderRadius: '5px',
        display: 'flex',
        lineHeight: 0,
        opacity: props.hover ? 0.4 : 0,
        padding: '.4rem',
        transition: 'opacity .2s ease-in-out',
        '&:hover': {
            opacity: 1,
            background: 'transparent',
        },
    }));

    return (
        <Box
            sx={{
                height: bottomPadding ? 'calc(100% - 81px)' : '100%',
                padding: '0px 16px 10px 16px',
                overflowY: 'scroll',
                ...sx,
            }}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                children={EditorGlobal.selectedFile?.diffValue?.value || EditorGlobal.selectedFile?.content?.value}
                components={{
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');

                        if (!inline && match) {
                            console.log(String(children).replace(/\n$/, ''));
                            return (
                                <Box
                                    position="relative"
                                    onMouseOver={() => setHover(true)}
                                    onMouseLeave={() => {
                                        setCopyActive(false);
                                        setHover(false);
                                    }}>
                                    <SyntaxHighlighter
                                        copyToClipboard={true}
                                        showLineNumbers={true}
                                        children={String(children).replace(/\n$/, '')}
                                        language={match[1]}
                                        {...props}
                                    />
                                    <div
                                        style={{
                                            columnGap: '0.2rem',
                                            display: 'flex',
                                            position: 'absolute',
                                            right: '10px',
                                            top: '10px',
                                        }}>
                                        <Button
                                            onClick={() => copy(String(children).replace(/\n$/, ''))}
                                            hover={hover}
                                            type="button"
                                            aria-label="Copy code to clipboard"
                                            title="Copy">
                                            <ButtonSVGs aria-hidden="true">
                                                {copyActive ? (
                                                    <SVGClass2 viewBox="0 0 24 24">
                                                        <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"></path>
                                                    </SVGClass2>
                                                ) : (
                                                    <SVGClass1 viewBox="0 0 24 24">
                                                        <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"></path>
                                                    </SVGClass1>
                                                )}
                                            </ButtonSVGs>
                                        </Button>
                                    </div>
                                </Box>
                            );
                        } else {
                            return (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            );
                        }
                    },
                }}
            />
        </Box>
    );
}

// ** Styled components
const ButtonSVGs = styled.span({
    height: '1.125rem',
    position: 'relative',
    width: '1.125rem',
});

const SVGClass1 = styled.svg({
    height: 'inherit',
    left: 0,
    opacity: 'inherit',
    position: 'absolute',
    top: 0,
    transition: '.15s',
    width: 'inherit',
});

const SVGClass2 = styled.svg({
    fill: 'green',
    left: ' 50%',
    opacity: 1,
    top: '50%',
    transform: 'scale(1)',
    transitionDelay: '75ms',
});
