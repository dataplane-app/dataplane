const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
    webpack: {
        plugins: [new MonacoWebpackPlugin({ publicPath: '/webapp/', languages: ['json', 'python', 'shell', 'python']})],
    },
};

// publicPath: '/webapp',
