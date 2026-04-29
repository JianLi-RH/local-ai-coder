const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

async function main() {
    const ctx = await esbuild.context({
        entryPoints: ['src/extension.ts'],
        bundle: true,
        format: 'cjs',
        minify: production,
        sourcemap: !production,
        sourcesContent: false,
        platform: 'node',
        outfile: 'out/extension.js',
        external: ['vscode'],
        logLevel: 'silent',
        plugins: [{
            name: 'umd2esm',
            setup(build) {
                build.onResolve({ filter: /^(vscode)$/ }, args => {
                    return {
                        path: args.path,
                        namespace: 'umd2esm',
                    };
                });
                build.onLoad({ filter: /.*/, namespace: 'umd2esm' }, args => {
                    return {
                        contents: `export default require("${args.path}");`,
                        loader: 'js',
                    };
                });
            },
        }],
    });

    if (watch) {
        await ctx.watch();
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});