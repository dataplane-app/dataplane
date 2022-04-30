const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
    webpack: {
        plugins: [new MonacoWebpackPlugin()],
        configure: (webpackConfig, { env, paths }) => {
            webpackConfig.output.filename = 'webapp/static/js/bundle.js';
            webpackConfig.output.chunkFilename = 'webapp/static/js/[name].chunk.js';

            //webpackConfig.output.publicPath = '/webapp/';

            return webpackConfig;
        },
    },
};
