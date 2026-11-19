/**
 * Minimal module federation remote for Playwright tests.
 *
 * It mimics the shape `@originjs/vite-plugin-federation` expects from a
 * remote (`init` + `get`) and reads React and the router from the host share
 * scope, so the test does not depend on a built plugin. Serve it with
 * `page.route()` and point a mocked `/api/v1/plug_config/` entry at it.
 */
let shareScope;

export const init = (scope) => {
  shareScope = scope;
};

async function importShared(name) {
  const entry = Object.values(shareScope[name])[0];
  const module = await (await entry.get())();
  return module.default ?? module;
}

export const get = (name) => {
  if (name !== "./manifest") {
    return Promise.reject(new Error(`Unknown module ${name}`));
  }
  return Promise.resolve(async () => {
    const React = await importShared("react");
    const Router = await importShared("@tanstack/react-router");

    // Uses the host router through the shared module: reads the location and
    // navigates with an absolute path.
    const RouterPage = () => {
      const { pathname } = Router.useLocation();
      const navigate = Router.useNavigate();
      return React.createElement(
        "button",
        {
          "data-cy": "test-plugin-router",
          onClick: () => navigate({ to: "/test-plugin/items/7" }),
        },
        pathname,
      );
    };

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
          "/test-plugin/router": () => React.createElement(RouterPage),
          // Under the settings layout: takes the settings workspace.
          "/facility/:facilityId/settings/test-plugin": ({ facilityId }) =>
            React.createElement(
              "h1",
              { "data-cy": "test-plugin-settings-page" },
              `Test plugin settings ${facilityId}`,
            ),
        },
        extends: [],
        components: {},
      },
    };
  });
};
