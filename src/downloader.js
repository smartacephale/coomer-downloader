import fetch from "node-fetch";
import fs from "node:fs";
import path from "node:path";

export async function downloadFiles(data, downloadDir) {
    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
    }

    for (const [index, { name, src }] of data.entries()) {
        try {
            const response = await fetch(src);
            if (!response.ok) {
                console.error(`\nFailed to download ${src}: ${response.statusText}`);
                continue;
            }

            const filePath = path.join(downloadDir, name);
            if (fs.existsSync(filePath)) continue;
            const fileStream = fs.createWriteStream(filePath);

            await new Promise((resolve, reject) => {
                response.body.pipe(fileStream);
                response.body.on("error", reject);
                fileStream.on("finish", resolve);
            });

            process.stdout.write(`\rDownloading files: ${index + 1}/${data.length}`);
        } catch (error) {
            console.error(`\nError downloading ${name}:`, error.message);
        }
    }
    console.log("\n");
}