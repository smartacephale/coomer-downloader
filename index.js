#!/usr/bin/env node
import fetch from "node-fetch";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv))
	.option("url", {
		alias: "u",
		type: "string",
		description: "Coomer/Kemono URL",
		demandOption: true,
	})
	.option("dir", {
		type: "string",
		description: "Directory to download files to",
		default: "./",
	})
	.help()
	.alias("help", "h").argv;

async function downloadFiles(data, downloadDir) {
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

const userPostsAPI = (user, offset) =>
	`${user.domain}/api/v1/${user.service}/user/${user.name}?o=${offset}`;

async function getUserFiles(user) {
	const userPosts = [];

	const offset = 50;
	for (let i = 0; i < 1000; i++) {
		const posts = await fetch(userPostsAPI(user, offset * i)).then((r) =>
			r.json(),
		);
		userPosts.push(...posts);
		if (posts.length < 50) break;
	}

	const files = [];

	for (const p of userPosts) {
		const title = p.title.match(/\w+/g)?.join(" ") || "";
		const date = p.published.replace(/T/, " ");
		const datentitle = `${date} ${title}`.trim();

		// if (p.user !== user.name) continue; // ignore reposts?

		const postFiles = [...p.attachments, p.file]
			.filter((p) => p.path)
			.map((f) => {
				const ext = f.name.split(".").pop();
				const name = `${datentitle}.${ext}`;
				const src = `${user.domain}/${f.path}`;
				return { name, src };
			});

		files.push(...postFiles);
	}

	return files;
}

function parseUser(url) {
	const res = url.match(/(https:\/\/\w+\.\w+)\/(\w+)\/user\/([\w|\.|-]+)/);
	if (!res || res.length < 4) {
		console.error(res);
		throw new Error("Invalid URL");
	}

	const user = {
		domain: res[1],
		service: res[2],
		name: res[3],
	};

	return user;
}

async function run() {
	const { url, dir } = argv;
	const user = parseUser(url);
  const userDir = `${user.name}-${user.service}`;
	const downloadDir =
		dir === "./" ? path.resolve(dir, userDir) : 
    path.join(os.homedir(), path.join(dir, userDir));
	const files = await getUserFiles(user);
	await downloadFiles(files, downloadDir);
}

run();
