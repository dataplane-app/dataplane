const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
    webpack: {
        // output: {
        //     // path: path.resolve(__dirname, 'build'),
        //     publicPath: '/webapp',
        //   },
        plugins: [new MonacoWebpackPlugin({ publicPath: '/webapp/', languages: ['json', 'python', 'shell'] })],
    },
};

// publicPath: '/webapp',
