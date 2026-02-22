/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Evita iCloud: .next en node_modules suele excluirse del sync y reduce EPERM/readlink.
  distDir: 'node_modules/.cache/next-build',
};

module.exports = nextConfig;
