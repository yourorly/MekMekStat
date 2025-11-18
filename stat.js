const LOCAL_CONFIG = './config/config.json';
const REMOTE_CONFIG = 'https://raw.githubusercontent.com/yourorly/MekMekStat/main/config/config.json';

function _cfgHasMaintenance(cfg) {
	if (!cfg) return false;
	return (cfg.maintinance === true || cfg.maintenance === true || cfg.maintain === true || cfg.maint === true);
}

async function checkMaintenanceConfig() {
	let localCfg = null;
	let remoteCfg = null;

	// try local config first (same-origin file if served)
	try {
		const rLocal = await fetch(LOCAL_CONFIG, { cache: 'no-store' });
		if (rLocal && rLocal.ok) {
			localCfg = await rLocal.json();
			console.log('Loaded local maintenance config:', localCfg);
		}
	} catch (err) {
		// ignore local fetch errors (file may not exist when serving from remote)
		console.debug('Local config load failed:', err && err.message ? err.message : err);
	}

	// always attempt remote as well (useful for central control)
	try {
		const rRemote = await fetch(REMOTE_CONFIG, { cache: 'no-store' });
		if (rRemote && rRemote.ok) {
			remoteCfg = await rRemote.json();
			console.log('Loaded remote maintenance config:', remoteCfg);
		}
	} catch (err) {
		console.debug('Remote config load failed:', err && err.message ? err.message : err);
	}

	// Determine maintenance: enable if either config says maintenance
	const maintenance = _cfgHasMaintenance(localCfg) || _cfgHasMaintenance(remoteCfg);

	// determine maintenance text: remote overrides local
	const maintenanceText = (remoteCfg && remoteCfg.maintenance_text) || (localCfg && localCfg.maintenance_text) || null;

	if (maintenance) {
		enableMaintenanceMode(maintenanceText);
	} else {
		disableMaintenanceMode();
	}
}

function enableMaintenanceMode() {
	const maintainEl = document.getElementById('maintain');
	// Show any prominent maintenance heading inside the page (if present)
	const overlay = (maintainEl && maintainEl.querySelector('h1')) || document.querySelector('.chart-area h1');
	if (overlay) {
		overlay.style.display = 'block';
		overlay.style.zIndex = '9999';
		overlay.style.pointerEvents = 'auto';
		overlay.style.opacity = '1';
	}

	if (maintainEl) {
		// Apply blur to the element
		maintainEl.style.transition = 'filter 200ms ease, opacity 200ms ease';
		maintainEl.style.filter = 'blur(4px)';
		maintainEl.style.opacity = '0.7';
	}
}

function disableMaintenanceMode() {
	const maintainEl = document.getElementById('maintain');
	const overlay = (maintainEl && maintainEl.querySelector('h1')) || document.querySelector('.chart-area h1');
	if (overlay) {
		// keep the element in DOM but hide overlay text if it was added solely for maintenance
		overlay.style.display = '';
		overlay.style.zIndex = '';
		overlay.style.pointerEvents = '';
		overlay.style.opacity = '';
	}

	if (maintainEl) {
		maintainEl.style.filter = '';
		maintainEl.style.opacity = '';
	}
}

// Run initial check and poll periodically (every 60s)
checkMaintenanceConfig();
setInterval(checkMaintenanceConfig, 60 * 1000);