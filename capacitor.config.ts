/*
 | Diko for Android and iOS: a native shell around the player site's phone
 | pages. The app shows the site at DIKO_SITE_URL (read when you run
 | `npx cap sync`), so games, sign-in, bets and branding are the site's own.
 |
 |   DIKO_SITE_URL=https://games.example.com npx cap sync
 |
 | The site recognises the app by "DikoApp" in the user agent (it then skips
 | the browser's "play in full screen?" prompt). The app runs full screen:
 | on Android, MainActivity hides the status and navigation bars until they
 | are swiped in. www/offline.html shows when the site can't be reached.
 */

import type { CapacitorConfig } from '@capacitor/cli';

const site = (process.env.DIKO_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

const config: CapacitorConfig = {
	appId   : 'com.casinodiko.app',
	appName : 'Diko',
	webDir  : 'www',
	appendUserAgent : 'DikoApp/1.0',
	backgroundColor : '#111111',
	server : {
		url        : site,
		// plain http only for testing against a development server
		cleartext  : site.startsWith('http:'),
		errorPath  : 'offline.html'
	},
	plugins : {
		SplashScreen : { launchShowDuration : 1200, backgroundColor : '#111111', showSpinner : false }
	}
};

export default config;
