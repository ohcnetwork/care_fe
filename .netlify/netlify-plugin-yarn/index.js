module.exports = {
  onPreBuild: async ({ utils: { build, run } }) => {
    const cacheDir = ".yarn_cache";

    process.env["YARN_CACHE_FOLDER"] = `${process.env.HOME}/${cacheDir}`;
    process.env[
      "NETLIFY_CACHE_DIR"
    ] = `${process.env.NETLIFY_BUILD_BASE}/cache`;

    try {
      await run.command(
        `mv ${process.env.NETLIFY_CACHE_DIR}/${cacheDir} ${process.env.YARN_CACHE_FOLDER}`
      );
    } catch (error) {
      console.log("No yarn cache found");
    }

    try {
      await run.command("corepack enable");
    } catch (error) {
      return build.failBuild(error);
    }
  },
};
