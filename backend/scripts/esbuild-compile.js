const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

async function compile() {
	console.log("🚀 Starting ultra-fast compilation with esbuild...");
	const start = Date.now();

	const srcPath = path.join(__dirname, "../src");
	const distPath = path.join(__dirname, "../dist");

	// 1. Clean dist directory safely
	if (fs.existsSync(distPath)) {
		fs.rmSync(distPath, { recursive: true, force: true });
	}
	fs.mkdirSync(distPath, { recursive: true });

	// 2. Find all TS files recursively in src/ (supported in Node 20+)
	const files = fs
		.readdirSync(srcPath, { recursive: true })
		.filter(
			(f) =>
				f.endsWith(".ts") && !f.endsWith(".spec.ts") && !f.endsWith(".test.ts"),
		)
		.map((f) => path.join(srcPath, f));

	console.log(`📦 Found ${files.length} files to compile.`);

	// 3. Run Esbuild
	try {
		await esbuild.build({
			entryPoints: files,
			outdir: distPath,
			outbase: srcPath, // Ensures folder structure relative to src/
			platform: "node",
			target: "node20",
			format: "cjs",
			tsconfig: path.join(__dirname, "../tsconfig.json"),
			sourcemap: false,
			minify: false,
			logLevel: "warning",
		});

		console.log(`✅ Build completed in ${Date.now() - start}ms!`);
	} catch (err) {
		console.error("❌ Compilation failed:", err);
		process.exit(1);
	}
}

compile();
