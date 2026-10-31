/*
 | Draws the app's launcher icons and splash screens from the brand the
 | admin's Branding page sets, as the player site serves it:
 |
 |   <site>/shared/app/icon-512.png           the mark on the dark square
 |   <site>/shared/app/icon-maskable-512.png  the same with a wider margin
 |
 | Run it before a build whenever the brand's icon changes:
 |
 |   DIKO_SITE_URL=http://192.168.1.20:3000 npm run icons
 */

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const site = (process.env.DIKO_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const root = path.resolve(import.meta.dirname, '..');
const BACKGROUND = '#111111';

async function download (file) {
	const url = `${site}/shared/app/${file}?v=${Date.now()}`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`${url}: ${res.status}`);
	return Buffer.from(await res.arrayBuffer());
}

const square = (icon, size) => sharp(icon).resize(size, size, { kernel : 'lanczos3' }).png().toBuffer();

const circle = async (icon, size) => sharp(await square(icon, size))
	.composite([{ input : Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></svg>`), blend : 'dest-in' }])
	.png().toBuffer();

/** the icon, `part` of the shorter side, centred on the dark background */
async function splash (icon, w, h, part = 0.45) {
	const size = Math.round(Math.min(w, h) * part);
	return sharp({ create : { width : w, height : h, channels : 3, background : BACKGROUND } })
		.composite([{ input : await square(icon, size), gravity : 'center' }]).png().toBuffer();
}

async function save (file, body) {
	await writeFile(path.join(root, file), await body);
	console.log(file);
}

const icon = await download('icon-512.png');
const maskable = await download('icon-maskable-512.png');

// Android: legacy and round launcher icons (48dp), adaptive foreground (108dp)
const RES = 'android/app/src/main/res';
const DENSITIES = { mdpi : 1, hdpi : 1.5, xhdpi : 2, xxhdpi : 3, xxxhdpi : 4 };
for (const [d, k] of Object.entries(DENSITIES)) {
	await save(`${RES}/mipmap-${d}/ic_launcher.png`, square(icon, 48 * k));
	await save(`${RES}/mipmap-${d}/ic_launcher_round.png`, circle(icon, 48 * k));
	await save(`${RES}/mipmap-${d}/ic_launcher_foreground.png`, square(maskable, 108 * k));
}
await save(`${RES}/values/ic_launcher_background.xml`,
	`<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BACKGROUND}</color>\n</resources>\n`);

// Android splash screens: keep each file's size
for (const dir of ['drawable', ...Object.keys(DENSITIES).flatMap(d => [`drawable-port-${d}`, `drawable-land-${d}`])]) {
	const file = `${RES}/${dir}/splash.png`;
	const { width, height } = await sharp(path.join(root, file)).metadata();
	await save(file, splash(icon, width, height));
}

// iOS: one 1024 icon (no transparency allowed) and the 2732 splash at three scales
const ASSETS = 'ios/App/App/Assets.xcassets';
await save(`${ASSETS}/AppIcon.appiconset/AppIcon-512@2x.png`, sharp(await square(icon, 1024)).flatten({ background : BACKGROUND }).png().toBuffer());
const iosSplash = await splash(icon, 2732, 2732, 0.25);
for (const f of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) await save(`${ASSETS}/Splash.imageset/${f}`, iosSplash);
