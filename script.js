function serverip1(){
	return fetch("https://api.mcsrvstat.us/bedrock/3/radio-authorization.gl.at.ply.gg:14365")
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
	return fetch("https://api.mcsrvstat.us/bedrock/3/apr-analysts.gl.at.ply.gg:1619")
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
	checkOnce1();
	checkOnce2();
	setInterval(checkOnce1, 60 * 1000);
	setInterval(checkOnce2, 60 * 1000);
})();
