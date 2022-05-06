const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
    webpack: {
        plugins: [new MonacoWebpackPlugin()],
    },
};
