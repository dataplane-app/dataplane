export default function isMarkdown(file) {
    if (!file) return;
    return file.slice(-3).toLowerCase() === '.md';
}
