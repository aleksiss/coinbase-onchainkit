import { PHASE_PRODUCTION_BUILD } from 'next/constants.js';
 
export default (phase) => {
  console.log('\n');
  console.log('Build Phase:', phase);
  console.log('Build Env:', process.env);
  console.log('\n');
  const isProdBuild = phase === PHASE_PRODUCTION_BUILD;
  const isVercelProd = process.env.VERCEL_ENV === 'production';
  const assetPrefix = isProdBuild && isVercelProd ? 'https://onchainkit.xyz/playground' : '';
  /**
   * @type {import('next').NextConfig}
   */
  const nextConfig = {
    assetPrefix,
    typescript: {
      ignoreBuildErrors: true,
    }
  }
  return nextConfig
}
