const CARE_API = process.env.CARE_API;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: "export", // Outputs a Single-Page Application (SPA).
  // distDir: "./dist", // Changes the build output directory to `./dist/`.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${CARE_API}/api/:path*/`,
      },
    ];
  },
};
export default nextConfig;
