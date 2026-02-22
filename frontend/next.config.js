/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Solo en Windows local: evita iCloud/EPERM. En Vercel (Linux) usa .next por defecto.
  ...(process.platform === 'win32' && {
    distDir: 'node_modules/.cache/next-build',
  }),
};

module.exports = nextConfig;
