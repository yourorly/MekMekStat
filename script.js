// default addresses (will be overridden by remote config if available)
let serverAddress1 = 'radio-authorization.gl.at.ply.gg:14365';
let serverAddress2 = 'apr-analysts.gl.at.ply.gg:1619';

function serverip1(){
	const url = `https://api.mcsrvstat.us/bedrock/3/${encodeURIComponent(serverAddress1)}`;
	return fetch(url)
		.then(response => response.json())
		.then(data => {
			console.log(data);
			const img = document.getElementById("server1stat");
			const pc = document.getElementById("plrcount");
			const ver = document.getElementById("version");
			const motd = document.getElementById("motd");
			const servergm = document.getElementById("servergm");

			if (img) img.src = data.online ? "res/green.png" : "res/red.png";
			if (pc) {
				const online = data && data.players && typeof data.players.online === 'number' ? data.players.online : undefined;
				const max = data && data.players && typeof data.players.max === 'number' ? data.players.max : undefined;
				pc.textContent = (online !== undefined && max !== undefined) ? `${online} / ${max}` : "?";
			}
			if (ver) ver.textContent = data && data.version ? data.version : "?";
			if (motd) motd.textContent = data && data.motd && data.motd.clean ? data.motd.clean.join(" ") : "?";
			if (servergm) servergm.textContent = data && data.gamemode ? data.gamemode : "?";

			return !!data.online;
		})
		.catch(err => {
			console.error(err);
			const img = document.getElementById("server1stat");
			if (img) img.src = "res/red.png";
			return false;
		});
}

function serverip2(){
	const url = `https://api.mcsrvstat.us/bedrock/3/${encodeURIComponent(serverAddress2)}`;
	return fetch(url)
		.then(response => response.json())
		.then(data => {
			if(!data) throw new Error("No data received");
			
			console.log(data);
			const img = document.getElementById("server2stat");
			const pc = document.getElementById("plrcount");
			const ver = document.getElementById("version");
			const motd = document.getElementById("motd");
			const servergm = document.getElementById("servergm");

			if (img) img.src = data.online ? "res/green.png" : "res/red.png";
			if(data.online){
				if (pc) {
				const online = data && data.players && typeof data.players.online === 'number' ? data.players.online : undefined;
				const max = data && data.players && typeof data.players.max === 'number' ? data.players.max : undefined;
				pc.textContent = (online !== undefined && max !== undefined) ? `${online} / ${max}` : "?";
				}
				if (ver) ver.textContent = data && data.version ? data.version : "?";
				if (motd) motd.textContent = data && data.motd && data.motd.clean ? data.motd.clean.join(" ") : "?";
				if (servergm) servergm.textContent = data && data.gamemode ? data.gamemode : "?";
			}
			

			return !!data.online;
		})
		.catch(err => {
			console.error(err);
			const img = document.getElementById("server2stat");
			if (img) img.src = "res/red.png";
			return false;
		});
}

// Per-server monitors
function createMonitor(targetId) {
	const el = document.getElementById(targetId);
	const state = { startedAt: Date.now(), upCount: 0, downCount: 0 };
	function render() {
		if (!el) return;
		const elapsedMin = Math.floor((Date.now() - state.startedAt) / 60000);
		el.innerHTML = `Uptime : ${state.upCount}<br> Downtime : ${state.downCount}<br> Elapsed : ${elapsedMin} min`;
	}
	return { state, render };
}

const monitor1 = createMonitor('statusdata1');
const monitor2 = createMonitor('statusdata2');

async function checkOnce1() {
	const r = await Promise.resolve(serverip1()).catch(() => false);
	const up = !!r;
	if (up) monitor1.state.upCount++; else monitor1.state.downCount++;
	monitor1.render();
	console.log("Heartbeat IP1");
}

async function checkOnce2() {
	const r = await Promise.resolve(serverip2()).catch(() => false);
	const up = !!r;
	if (up) monitor2.state.upCount++; else monitor2.state.downCount++;
	monitor2.render();
	console.log("Heartbeat IP2");
}

// Backward-compatible wrapper if something calls checkOnce()
async function checkOnce(){
	await Promise.all([checkOnce1(), checkOnce2()]);
}

// Initialize and schedule every 1 minute
(function initPerServerUptime(){
	// prefer local config file, fallback to remote GitHub raw
	const LOCAL_CONFIG = './config/config.json';
	const REMOTE_CONFIG = 'https://raw.githubusercontent.com/yourorly/MekMekStat/main/config/config.json';

	async function loadConfigPreferLocal() {
		let cfg = null;
		// try local first
		try {
			const resLocal = await fetch(LOCAL_CONFIG, { cache: 'no-store' });
			if (resLocal && resLocal.ok) {
				cfg = await resLocal.json();
				console.log('Loaded local config:', LOCAL_CONFIG, cfg);
			} else {
				// fallback to remote
				const resRemote = await fetch(REMOTE_CONFIG, { cache: 'no-store' });
				if (resRemote && resRemote.ok) {
					cfg = await resRemote.json();
					console.log('Loaded remote config:', REMOTE_CONFIG, cfg);
				} else {
					throw new Error(`Local and remote config fetch failed (local: ${resLocal ? resLocal.status : 'no-res'}, remote: ${resRemote ? resRemote.status : 'no-res'})`);
				}
			}
		} catch (err) {
			console.warn('Config load error:', err.message || err);
		}

		if (cfg) {

			// try common config shapes
			// 1) cfg.servers -> array of strings or objects
			if (Array.isArray(cfg.servers) && cfg.servers.length) {
				const s0 = cfg.servers[0];
				const s1 = cfg.servers[1];
				if (typeof s0 === 'string') serverAddress1 = s0;
				else if (s0 && (s0.address || s0.host)) serverAddress1 = s0.address || (s0.host + (s0.port ? ':' + s0.port : ''));
				if (typeof s1 === 'string') serverAddress2 = s1;
				else if (s1 && (s1.address || s1.host)) serverAddress2 = s1.address || (s1.host + (s1.port ? ':' + s1.port : ''));
			}

			// 2) flat values
			if (!cfg.servers) {
				if (cfg.server1) serverAddress1 = cfg.server1;
				if (cfg.server2) serverAddress2 = cfg.server2;
				if (cfg.default_server) serverAddress1 = cfg.default_server;
			}

			// 3) scan for any host:port strings in the JSON (fallback)
			function collectAddresses(obj, out) {
				if (!obj) return;
				if (typeof obj === 'string') {
					const m = obj.match(/([a-zA-Z0-9._-]+:\d{2,5})/);
					if (m) out.push(m[1]);
				} else if (Array.isArray(obj)) {
					obj.forEach(v => collectAddresses(v, out));
				} else if (typeof obj === 'object') {
					Object.values(obj).forEach(v => collectAddresses(v, out));
				}
			}

			const found = [];
			collectAddresses(cfg, found);
			// prefer not to overwrite existing if already set from servers, but if they are defaults keep
			if (found.length) {
				if (!serverAddress1 && found[0]) serverAddress1 = found[0];
				// override only if serverAddress2 is default or not present
				if (found[1]) serverAddress2 = found[1];
			}

		}

		// start checks using whatever addresses are present (local/remote or defaults)
		checkOnce1();
		checkOnce2();
		setInterval(checkOnce1, 60 * 1000);
		setInterval(checkOnce2, 60 * 1000);
	}

	// expose loader and start it
	window.loadConfigPreferLocal = loadConfigPreferLocal;
	loadConfigPreferLocal();
})();
