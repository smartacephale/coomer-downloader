import fetch from "node-fetch";
import fs from "node:fs";
import path from "node:path";
import { isImage } from "./utils.js";

async function resumeDownload(url, outputFile) {
	try {
		let existingFileSize = 0;
		try {
			existingFileSize = (await fs.promises.stat(outputFile)).size;
		} catch (err) {
			existingFileSize = 0;
		}

		const response = await fetch(url, {
			headers: {
				Range: `bytes=${existingFileSize}-`,
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		if (!response.headers.get("Content-Range")) {
			throw new Error("Server does not support byte ranges.");
		}

		const fileStream = fs.createWriteStream(outputFile, { flags: "a" }); // Append to existing file

		const contentRange = response.headers.get("Content-Range");
		const match = contentRange.match(/bytes (\d+)-(\d+)\/(\d+)/);

		if (match) {
			const start = Number.parseInt(match[1]);
			const end = Number.parseInt(match[2]);
			console.log(
				`Resumed download: bytes ${start}-${end} of ${url} to ${outputFile}`,
			);
		} else {
			console.warn("Could not parse Content-Range header.");
		}

		await new Promise((resolve, reject) => {
			response.body.pipe(fileStream);
			response.body.on("error", reject);
			fileStream.on("finish", resolve);
		});
	} catch (error) {
		console.error(`Error resuming download: ${error}`);
	}
}

export async function downloadFiles(data, downloadDir) {
	if (!fs.existsSync(downloadDir)) {
		fs.mkdirSync(downloadDir, { recursive: true });
	}

	for (const [index, { name, src }] of data.entries()) {
		const filePath = path.join(downloadDir, name);
		try {
			process.stdout.write(`\rDownloading files: ${index + 1}/${data.length}`);

			if (fs.existsSync(filePath)) {
				console.log("op");
				if (!isImage(name)) {
					console.log("here");
					await resumeDownload(src, filePath);
				}
				console.log("end");
				continue;
			}

			const response = await fetch(src);
			if (!response.ok) {
				console.error(`\nFailed to download ${src}: ${response.statusText}`);
				continue;
			}

			const fileStream = fs.createWriteStream(filePath);

			await new Promise((resolve, reject) => {
				response.body.pipe(fileStream);
				response.body.on("error", reject);
				fileStream.on("finish", resolve);
			});
		} catch (error) {
			console.error(`\nError downloading ${name}:`, error.message);
		}
	}
	console.log("\n");
}
