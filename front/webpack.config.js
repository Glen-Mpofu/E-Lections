const { withExpo } = require('@expo/webpack-config');
const Dotenv = require('dotenv-webpack');

module.exports = async function (env, argv) {
    const config = await withExpo(env, argv);

    // Add dotenv plugin for web
    config.plugins = [
        ...(config.plugins || []),
        new Dotenv({
            path: './.env', // path to your .env file
            systemvars: true,
        }),
    ];

    return config;
};
