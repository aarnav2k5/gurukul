import { build } from 'esbuild';
await build({ entryPoints: ['supabase-client.js'], bundle: true, format: 'iife', outfile: 'supabase-client.bundle.js', minify: true });
