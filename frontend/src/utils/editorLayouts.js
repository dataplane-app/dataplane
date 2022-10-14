// 1 - File Manager
// 2 - Packages
// 3 - Editor
// 4 - Logs

export const getGridLayouts = (language, markdownState, isMarkdown) => {
    const fileManagerHeight = language === 'python' ? 2.5 : 4;
    const markdownEditorWidthLg = markdownState === 'view' && isMarkdown ? 10 : 5;
    const markdownEditorWidthMd = markdownState === 'view' && isMarkdown ? 4 : 2;
    const markdownEditorWidthSm = markdownState === 'view' && isMarkdown ? 2 : 1;

    return {
        lg: [
            { i: '1', x: 0, y: 0, w: 2, h: fileManagerHeight },
            { i: '2', x: 0, y: 2, w: 2, h: 1.5 },
            { i: '3', x: 2, y: 0, w: markdownEditorWidthLg, h: 4 },
            { i: '4', x: 7, y: 0, w: 5, h: 4 },
        ],
        md: [
            { i: '1', x: 0, y: 0, w: 2, h: fileManagerHeight },
            { i: '2', x: 0, y: 2, w: 2, h: 1.5 },
            { i: '3', x: 2, y: 0, w: markdownEditorWidthMd, h: 4 },
            { i: '4', x: 6, y: 0, w: 2, h: 4 },
        ],
        sm: [
            { i: '1', x: 0, y: 0, w: 1, h: fileManagerHeight },
            { i: '2', x: 0, y: 2, w: 1, h: 1.5 },
            { i: '3', x: 1, y: 0, w: markdownEditorWidthSm, h: 4 },
            { i: '4', x: 2, y: 0, w: 1, h: 4 },
        ],
    };
};

export default getGridLayouts;
