/**
 * Minimal module federation remote for Playwright tests.
 *
 * It mimics the shape `@originjs/vite-plugin-federation` expects from a
 * remote (`init` + `get`) and reads React from the host share scope, so the
 * test does not depend on a built plugin. Serve it with `page.route()` and
 * point a mocked `/api/v1/plug_config/` entry at it.
 */
let shareScope;

export const init = (scope) => {
  shareScope = scope;
};

export const get = (name) => {
  if (name !== "./manifest") {
    return Promise.reject(new Error(`Unknown module ${name}`));
  }
  return Promise.resolve(async () => {
    const reactEntry = Object.values(shareScope.react)[0];
    const reactModule = await (await reactEntry.get())();
    const React = reactModule.default ?? reactModule;

    return {
      __esModule: true,
      default: {
        plugin: "care_test_plugin",
        routes: {
          "/test-plugin/items/:itemId": ({ itemId }) =>
            React.createElement(
              "h1",
              { "data-cy": "test-plugin-page" },
              `Test plugin item ${itemId}`,
            ),
        },
        extends: [],
        components: {},
      },
    };
  });
};
