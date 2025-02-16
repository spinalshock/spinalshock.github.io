module.exports = function customWebpackPlugin() {
  return {
    name: "custom-webpack", // Give your plugin a name
    configureWebpack() {
      return {
        experiments: {
          asyncWebAssembly: true,
        },
        module: {
          rules: [
            {
              test: /\.wasm$/,
              type: "webassembly/async",
            },
          ],
        },
      };
    },
  };
};
