const path = require("path");
require('dotenv').config({ path: '../../.env.local' });

module.exports = {
    reactStrictMode: true,
    webpack(config) {
    config.resolve.alias = {
        ...(config.resolve.alias || {}),
        // @api -> monorepo/packages/api
        "@api": path.resolve(__dirname, "../packages/api"),
        "@ui":  path.resolve(__dirname, "../packages/ui"),
        "@utils": path.resolve(__dirname, "../packages/utils"),
    };
    config.module.rules.push({
        test: /\ya?ml$/,
        use: 'yaml-loader',
    });
    return config;
    },
};