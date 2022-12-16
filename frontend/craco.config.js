const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const CracoSwcPlugin = require('craco-swc');

module.exports = {
    plugins: [{ plugin: CracoSwcPlugin }],
    webpack: {
        // output: {
        //     // path: path.resolve(__dirname, 'build'),
        //     publicPath: '/webapp',
        //   },
        plugins: [new MonacoWebpackPlugin({ publicPath: '/webapp/', languages: ['json', 'python', 'shell'] })],
    },
};

// publicPath: '/webapp',
