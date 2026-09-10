import { execSync } from "child_process";
import { platform } from "os";

const PORT = 4000;

async function cleanPort() {
	const isWindows = platform() === "win32";

	try {
		let pid;
		if (isWindows) {
			// Find PID on Windows
			const output = execSync(`netstat -ano | findstr :${PORT}`).toString();
			const lines = output.split("\n");
			const listeningLine = lines.find(
				(line) => line.includes("LISTENING") && line.includes(`:${PORT}`),
			);
			if (listeningLine) {
				const parts = listeningLine.trim().split(/\s+/);
				pid = parts[parts.length - 1];
			}
		} else {
			// Find PID on Unix/Linux/macOS
			try {
				pid = execSync(`lsof -ti:${PORT}`).toString().trim();
			} catch (e) {}
		}

		if (pid) {
			console.log(
				`🧹 Cleaning up existing processes on port ${PORT} (PID: ${pid})...`,
			);
			if (isWindows) {
				execSync(`taskkill /F /PID ${pid}`);
			} else {
				execSync(`kill -9 ${pid}`);
			}
			console.log(`✅ Port ${PORT} is now free`);
		} else {
			console.log(`✅ Port ${PORT} is already free`);
		}
	} catch (error) {}
}

async function start() {
	await cleanPort();
	console.log("🚀 Starting backend dev server...");
	const { spawn } = await import("child_process");
	// Use tsx watch src/index.ts
	const child = spawn("npx", ["tsx", "watch", "src/index.ts"], {
		stdio: "inherit",
		shell: true,
	});

	child.on("exit", (code) => {
		process.exit(code || 0);
	});
}

start();
