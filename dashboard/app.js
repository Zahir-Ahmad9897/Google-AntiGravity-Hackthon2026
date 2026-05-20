// 1. STATE & ELEMENTS
const API_BASE = '/api';
let currentScenarioMeta = null;
let currentPipelineResult = null;
let currentIterationIndex = 0;
let currentMapPayload = null;
let appConfig = null;
let googleMapsPromise = null;
let realMap = null;
let realMapObjects = [];

const els = {
  clock: document.getElementById('liveClock'),
  grid: document.getElementById('scenarioGrid'),
  progressBox: document.getElementById('runProgressBox'),
  progressBar: document.getElementById('runProgressBar'),
  progressLabel: document.getElementById('runProgressLabel'),
  agentList: document.getElementById('agentList'),
  iterTracker: document.getElementById('iterTracker'),
  crisisSummary: document.getElementById('crisisSummary'),
  widgetGrid: document.getElementById('widgetGrid'),
  bottomGrid: document.getElementById('bottomGrid'),
  csTitle: document.getElementById('csTitle'),
  csLoc: document.getElementById('csLoc'),
  csBadge: document.getElementById('csBadge'),
  csConfVal: document.getElementById('csConfVal'),
  csConfFill: document.getElementById('csConfFill'),
  csReasoning: document.getElementById('csReasoning'),
  csImpact: document.getElementById('csImpact'),
  svgMap: document.getElementById('cityMap'),
  realMap: document.getElementById('realMap'),
  mapSourceBadge: document.getElementById('mapSourceBadge'),
  rainOverlay: document.getElementById('rainOverlay'),
  wwIcon: document.getElementById('wwIcon'),
  wwTemp: document.getElementById('wwTemp'),
  wwCond: document.getElementById('wwCond'),
  wwWind: document.getElementById('wwWind'),
  wwRain: document.getElementById('wwRain'),
  wwTag: document.getElementById('wwTag'),
  execLog: document.getElementById('execLog'),
  beforeCol: document.getElementById('beforeCol'),
  afterCol: document.getElementById('afterCol'),
  manualForm: document.getElementById('manualReportForm'),
  manualText: document.getElementById('manualText'),
  manualLocation: document.getElementById('manualLocation'),
  manualSeverity: document.getElementById('manualSeverity'),
  manualPermission: document.getElementById('manualPermission'),
  manualError: document.getElementById('manualError'),
};

const AGENT_PIPELINE = [
  { id: 'signal_watcher', name: 'CIRO Commander', icon: '🕵️' },
  { id: 'weather_risk', name: 'Weather Risk Agent', icon: '🌧️' },
  { id: 'traffic_analysis', name: 'Traffic Analysis Agent', icon: '🚦' },
  { id: 'social_signal', name: 'Social/Public Signal Agent', icon: '📱' },
  { id: 'crisis_detector', name: 'Verification Agent', icon: '🔍' },
  { id: 'situation_analyst', name: 'Crisis Reasoning Agent', icon: '🧠' },
  { id: 'response_planner', name: 'Rescue Planning Agent', icon: '📋' },
  { id: 'execution_simulator', name: 'Action Execution Agent', icon: '⚡' },
  { id: 'impact_reporter', name: 'Evaluation/Replanning Agent', icon: '📊' }
];

// 2. INITIALIZATION
function init() {
  setInterval(() => {
    els.clock.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
  }, 1000);

  els.manualForm.addEventListener('submit', (event) => {
    event.preventDefault();
    runCustomReport();
  });
  
  initAgentList();
  loadAppConfig();
  loadScenarios();
}

function initAgentList() {
  els.agentList.innerHTML = AGENT_PIPELINE.map(a => `
    <div class="agent-node" id="node_${a.id}">
      <div class="agent-icon-wrap">${a.icon}</div>
      <div class="agent-info">
        <div class="agent-name-row">
          <div class="agent-name">${a.name}</div>
          <div class="agent-status" id="status_${a.id}">WAITING</div>
        </div>
        <div class="agent-summary" id="sum_${a.id}">Pending execution...</div>
      </div>
    </div>
  `).join('');
}

async function loadAppConfig() {
  try {
    const res = await fetch(`${API_BASE}/config`);
    appConfig = await res.json();
    if (appConfig.google_maps_public_browser_key) {
      loadGoogleMaps();
    }
  } catch (err) {
    console.warn('App config unavailable; map will use SVG fallback.', err);
  }
}

function loadGoogleMaps() {
  if (googleMapsPromise) return googleMapsPromise;
  const key = appConfig?.google_maps_public_browser_key;
  if (!key) {
    googleMapsPromise = Promise.reject(new Error('Google Maps browser key is missing.'));
    return googleMapsPromise;
  }
  if (window.google?.maps) {
    googleMapsPromise = Promise.resolve(window.google.maps);
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = `ciroMapsReady_${Date.now()}`;
    window[callbackName] = () => {
      delete window[callbackName];
      resolve(window.google.maps);
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      delete window[callbackName];
      reject(new Error('Google Maps JavaScript API failed to load.'));
    };
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

async function fetchMapPayload() {
  try {
    const res = await fetch(`${API_BASE}/artifacts/map_route_trace.json?ts=${Date.now()}`);
    if (!res.ok) throw new Error(`map artifact HTTP ${res.status}`);
    currentMapPayload = await res.json();
    return currentMapPayload;
  } catch (err) {
    console.warn('Map route trace unavailable; using local map fallback.', err);
    currentMapPayload = null;
    return null;
  }
}

// 3. SCENARIOS & METADATA
async function loadScenarios() {
  try {
    const res = await fetch(`${API_BASE}/iterative/scenarios`);
    const scenarios = await res.json();
    renderScenarioCards(scenarios);
  } catch (err) {
    console.error('Failed to load scenarios', err);
  }
}

function getScenarioIcon(id) {
  if (id.includes('flood')) return '🌊';
  if (id.includes('blast')) return '💥';
  if (id.includes('ambulance')) return '🚑';
  return '⚠️';
}

function renderScenarioCards(scenarios) {
  els.grid.innerHTML = scenarios.map(s => `
    <div class="scenario-card" id="card_${s.scenario_id}">
      <div class="card-header">
        <div>
          <div class="card-loc">${s.title.split(' ')[0]}</div>
          <h3 class="card-title">${s.title}</h3>
        </div>
        <div class="card-icon">${getScenarioIcon(s.scenario_id)}</div>
      </div>
      <p class="card-desc">${s.description}</p>
      <button class="run-btn" onclick="runScenario('${s.scenario_id}')">Run Scenario</button>
    </div>
  `).join('');
}

async function fetchScenarioMeta(id) {
  try {
    const res = await fetch(`${API_BASE}/scenario/${id}/meta`);
    if (res.ok) {
      currentScenarioMeta = await res.json();
      renderWidgetsBefore();
    }
  } catch (err) {
    console.error('Meta fetch failed', err);
  }
}

function buildCustomMeta(location, severity) {
  const high = severity.toLowerCase() === 'critical' || severity.toLowerCase() === 'high';
  const rainfall = high ? 8.8 : severity.toLowerCase() === 'medium' ? 4.8 : 1.5;
  return {
    scenario_id: 'custom_permission_input',
    display_name: `Custom report - ${location}`,
    location,
    crisis_type: 'User reported crisis',
    description: 'User-approved manual report routed through CIRO.',
    map_layout_id: 'custom_permission_input',
    map_layout: 'g10_grid',
    weather: {
      condition: high ? 'Heavy Rain' : 'Rain Watch',
      temp: 'unavailable',
      wind: 'simulated',
      rainfall: `${rainfall.toFixed(1)} mm/hr`,
      rainfallMmHr: rainfall,
      windKmh: 0,
      temperatureC: 0,
      isCrisisFactor: rainfall >= 5,
      status: rainfall >= 5 ? 'CONTRIBUTING TO CRISIS' : 'WATCHING CONDITIONS'
    },
    before_state: {
      blocked: high ? 2 : 1,
      stranded: high ? 30 : 12,
      units: 0,
      alerted: 0,
      level: high ? 'HIGH' : 'MEDIUM'
    },
    after_state: {
      cleared: 1,
      rerouted: high ? 25 : 10,
      units: 1,
      alerted: high ? 650 : 180,
      level: severity.toLowerCase() === 'critical' ? 'HIGH' : 'MEDIUM'
    }
  };
}

function buildCustomMetaFromResult(result, fallbackLocation, severity) {
  const meta = buildCustomMeta(fallbackLocation, severity);
  const finalTrace = result.iterations[result.iterations.length - 1];
  const weatherOutput = findAgentOutput(finalTrace, 'Weather Risk Agent');
  const trafficOutput = findAgentOutput(finalTrace, 'Traffic Analysis Agent');
  const reasoningOutput = findAgentOutput(finalTrace, 'Crisis Reasoning Agent');
  const weather = weatherOutput?.output?.weather_signal;
  const traffic = trafficOutput?.output?.traffic_signals?.[0];
  const analysis = reasoningOutput?.output?.analysis;

  meta.display_name = result.scenario_name || meta.display_name;
  meta.location = analysis?.location || weather?.district || fallbackLocation;
  meta.crisis_type = analysis?.detected_situation || meta.crisis_type;
  if (weather) {
    meta.weather.condition = weather.alert_type || 'simulated_weather';
    meta.weather.rainfall = `${Number(weather.rainfall_mm_per_hour || 0).toFixed(1)} mm/hr`;
    meta.weather.rainfallMmHr = Number(weather.rainfall_mm_per_hour || 0);
    meta.weather.isCrisisFactor = Boolean(weather.alert_active);
    meta.weather.status = weather.alert_active ? 'CONTRIBUTING TO CRISIS' : 'WATCHING CONDITIONS';
  }
  if (traffic) {
    meta.before_state.blocked = traffic.speed_kmh <= 5 || traffic.congestion_level >= 5 ? 1 : 0;
    meta.before_state.stranded = Math.max(8, Math.round((traffic.normal_speed_kmh - traffic.speed_kmh) * 1.5));
    meta.after_state.rerouted = Math.max(10, Math.round((traffic.normal_speed_kmh - traffic.speed_kmh) * 2));
  }
  meta.before_state.level = finalTrace.crisis_level === 'crisis' ? 'HIGH' : 'MEDIUM';
  meta.after_state.level = finalTrace.risk_score >= 0.9 ? 'HIGH' : 'MEDIUM';
  return meta;
}

function findAgentOutput(trace, agentName) {
  return trace?.agent_outputs?.find(output => output.agent_name === agentName);
}

// 4. RUN PIPELINE
function prepareRunUi() {
  document.querySelectorAll('.scenario-card').forEach(c => c.classList.add('disabled'));
  els.manualForm.querySelectorAll('input, textarea, select, button').forEach(el => el.disabled = true);
  els.manualError.textContent = '';
  currentMapPayload = null;
  showSvgMap('Mock map');
  els.progressBox.style.display = 'block';
  els.progressLabel.style.display = 'block';
  els.progressBar.style.width = '10%';
  els.widgetGrid.style.display = 'grid';
  els.bottomGrid.style.display = 'grid';
  els.crisisSummary.style.display = 'none';
  els.iterTracker.style.display = 'flex';
  document.getElementById('step1').classList.remove('active');
  document.getElementById('step2').classList.add('active');

  initAgentList(); // Reset agent visualizer
}

function unlockRunUi() {
  document.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('disabled'));
  els.manualForm.querySelectorAll('input, textarea, select, button').forEach(el => el.disabled = false);
}

async function runScenario(id) {
  prepareRunUi();
  
  // Pre-fetch metadata for weather and map
  await fetchScenarioMeta(id);

  try {
    els.progressBar.style.width = '30%';
    const res = await fetch(`${API_BASE}/iterative/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: id })
    });
    
    if (!res.ok) throw new Error('Pipeline failed');
    currentPipelineResult = await res.json();
    await fetchMapPayload();
    els.progressBar.style.width = '60%';
    
    // Simulate pipeline animation
    await animatePipeline();
    
  } catch (err) {
    console.error(err);
    els.manualError.textContent = 'Pipeline execution failed: ' + err.message;
    unlockRunUi();
    els.progressBox.style.display = 'none';
    els.progressLabel.style.display = 'none';
  }
}

async function runCustomReport() {
  const text = els.manualText.value.trim();
  const location = els.manualLocation.value.trim() || 'Unknown location';
  const severity = els.manualSeverity.value;
  const permission = els.manualPermission.checked;

  if (!text) {
    els.manualError.textContent = 'Enter a crisis report before running the agent pipeline.';
    els.manualText.focus();
    return;
  }
  if (!permission) {
    els.manualError.textContent = 'Permission is required before CIRO can analyze user-provided text.';
    return;
  }

  prepareRunUi();
  currentScenarioMeta = buildCustomMeta(location, severity);
  renderWidgetsBefore();

  try {
    els.progressBar.style.width = '30%';
    const res = await fetch(`${API_BASE}/iterative/run-custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        source: 'Dashboard manual report',
        location,
        permission_granted: permission,
        severity
      })
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.detail || 'Custom pipeline failed');
    currentPipelineResult = payload;
    await fetchMapPayload();
    currentScenarioMeta = buildCustomMetaFromResult(payload, location, severity);
    renderWidgetsBefore();
    els.progressBar.style.width = '60%';
    await animatePipeline();
  } catch (err) {
    console.error(err);
    els.manualError.textContent = 'Pipeline execution failed: ' + err.message;
    unlockRunUi();
    els.progressBox.style.display = 'none';
    els.progressLabel.style.display = 'none';
  }
}

// 5. ANIMATIONS & VISUALS
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function animatePipeline() {
  const finalIter = currentPipelineResult.iterations[currentPipelineResult.iterations.length - 1];
  const outputs = finalIter.agent_outputs || [];
  
  for (let i = 0; i < AGENT_PIPELINE.length; i++) {
    const agent = AGENT_PIPELINE[i];
    const node = document.getElementById(`node_${agent.id}`);
    const status = document.getElementById(`status_${agent.id}`);
    const summary = document.getElementById(`sum_${agent.id}`);
    
    // Set to RUNNING
    node.classList.add('active');
    status.textContent = 'RUNNING';
    
    await sleep(400); // 400ms delay as requested
    
    // Set to DONE
    node.classList.remove('active');
    node.classList.add('done');
    status.textContent = 'DONE';
    
    // Find output or mock it
    const out = outputs.find(o => o.agent_name.toLowerCase().includes(agent.id.split('_')[0])) || outputs[i] || { summary: `Execution completed successfully for ${agent.name}` };
    summary.textContent = out.summary;
    
    els.progressBar.style.width = `${60 + ((i+1)/AGENT_PIPELINE.length)*40}%`;
  }

  // Iterations
  for(let i=1; i<=3; i++) {
    document.getElementById(`iter${i}`).classList.add('done');
    await sleep(200);
  }

  finishPipeline(finalIter);
}

function finishPipeline(finalIter) {
  els.progressBox.style.display = 'none';
  els.progressLabel.style.display = 'none';
  document.getElementById('step2').classList.remove('active');
  document.getElementById('step3').classList.add('active');
  unlockRunUi();
  
  renderCrisisSummary(finalIter);
  renderWidgetsAfter(finalIter);
}

// 6. CRISIS SUMMARY
function renderCrisisSummary(trace) {
  els.crisisSummary.style.display = 'block';
  els.csTitle.textContent = currentPipelineResult.scenario_name;
  els.csLoc.textContent = currentMapPayload?.markers?.crisis?.label || currentScenarioMeta?.location || "Target Area";
  
  const level = (trace.crisis_level || 'LOW').toUpperCase();
  els.csBadge.textContent = level;
  els.csBadge.className = 'level-badge ' + level.toLowerCase();
  
  const conf = Math.round((trace.confidence_score || 0.85) * 100);
  els.csConfVal.textContent = `${conf}%`;
  els.csConfFill.style.width = `${conf}%`;
  els.csConfFill.className = 'meter-fill ' + (conf < 50 ? 'green' : (conf < 80 ? 'orange' : 'red'));
  
  els.csReasoning.textContent = trace.concise_reasoning_summary || 'Analysis complete. Simulated response generated.';
  
  els.csImpact.innerHTML = `
    <div class="impact-item"><i class="icon">🚨</i> Escalate: YES</div>
    <div class="impact-item"><i class="icon">📈</i> Risk Score: ${Math.round((trace.risk_score || 0.9) * 100)}%</div>
    <div class="impact-item"><i class="icon">✔️</i> ${trace.evaluation_result || 'Impact mitigated'}</div>
  `;
}

// 7. WIDGETS & MAP
function renderWidgetsBefore() {
  if (!currentScenarioMeta) return;
  const m = currentScenarioMeta;
  
  // Weather
  els.wwIcon.textContent = m.weather.condition.split(' ')[0];
  els.wwCond.textContent = m.weather.condition;
  els.wwTemp.textContent = m.weather.temp;
  els.wwWind.textContent = m.weather.wind;
  els.wwRain.textContent = m.weather.rainfall;
  els.wwTag.style.display = 'block';
  els.wwTag.textContent = m.weather.status;
  els.wwTag.style.background = m.weather.status.includes('NORMAL') ? 'rgba(0,204,102,0.2)' : 'rgba(255,68,68,0.2)';
  els.wwTag.style.color = m.weather.status.includes('NORMAL') ? 'var(--ok)' : 'var(--danger)';
  
  // Rain overlay
  if (m.weather.rainfall !== '0.0 mm/hr') {
    els.rainOverlay.innerHTML = Array.from({length:30}).map(()=>
      `<div class="rain-drop" style="left:${Math.random()*100}%; animation-duration:${0.5+Math.random()}s; animation-delay:${Math.random()}s"></div>`
    ).join('');
  } else {
    els.rainOverlay.innerHTML = '';
  }

  // Outcome Before
  const b = m.before_state;
  els.beforeCol.innerHTML = `
    <h4>Before</h4>
    <div class="metric-row"><span>Roads Blocked:</span> <span class="metric-val">${b.blocked}</span></div>
    <div class="metric-row"><span>Vehicles Stranded:</span> <span class="metric-val">${b.stranded}</span></div>
    <div class="metric-row"><span>Emergency Units:</span> <span class="metric-val">${b.units}</span></div>
    <div class="metric-row"><span>Alert Coverage:</span> <span class="metric-val">${b.alerted} users</span></div>
    <div class="metric-row"><span>Crisis Level:</span> <span class="metric-val">${b.level}</span></div>
  `;
  els.afterCol.innerHTML = `<h4>After</h4><div style="font-size:12px;color:var(--muted)">Awaiting pipeline completion...</div>`;

  // Draw Map Before
  drawMap(m.map_layout_id, 'before');
  els.execLog.innerHTML = '<div class="log-line">Waiting for scenario execution...</div>';
}

async function renderWidgetsAfter(trace) {
  const m = currentScenarioMeta;
  if(!m) return;
  
  // Update Map
  drawMap(m.map_layout_id, 'after');

  // Outcome After
  const a = m.after_state;
  const b = m.before_state;
  const executionOutput = findAgentOutput(trace, 'Action Execution Agent');
  const stateChanges = executionOutput?.output?.execution?.execution?.state_changes || [];
  const stateChangeRows = stateChanges.slice(0, 4).map(change => `
    <div class="metric-row"><span>${formatMetric(change.metric)}:</span> <span class="metric-val improved">${change.before} to ${change.after}</span></div>
  `).join('');

  els.afterCol.innerHTML = `
    <h4>After</h4>
    <div class="metric-row"><span>Roads Cleared:</span> <span class="metric-val improved">${a.cleared}</span></div>
    <div class="metric-row"><span>Rerouted Vehicles:</span> <span class="metric-val improved">~${a.rerouted}</span></div>
    <div class="metric-row"><span>Emergency Units:</span> <span class="metric-val improved">${a.units}</span></div>
    <div class="metric-row"><span>Alert Coverage:</span> <span class="metric-val improved">${a.alerted} users</span></div>
    <div class="metric-row"><span>Crisis Level:</span> <span class="metric-val">${a.level}</span></div>
    ${stateChangeRows}
  `;

  // Exec Log
  els.execLog.innerHTML = '';
  const actions = trace.simulated_actions || [];
  for(let i=0; i<actions.length; i++) {
    const line = document.createElement('div');
    line.className = 'log-line';
    const time = new Date(Date.now() + i*1000).toLocaleTimeString('en-US', {hour12:false});
    line.innerHTML = `<span class="log-time">${time}</span> <span class="log-icon check">[✓]</span> ${actions[i]}`;
    els.execLog.appendChild(line);
    els.execLog.scrollTop = els.execLog.scrollHeight;
    await sleep(300); // Stagger log
  }
}

function formatMetric(metric) {
  return String(metric || '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());
}

// 8. MAP DRAWING (Real Google Map with SVG fallback)
function drawMap(layoutId, state) {
  if (state === 'after' && currentMapPayload) {
    renderRealMap(currentMapPayload).catch((err) => {
      console.warn('Real map unavailable; falling back to SVG.', err);
      drawSvgMap(layoutId, state);
    });
    return;
  }
  drawSvgMap(layoutId, state);
}

async function renderRealMap(payload) {
  await loadGoogleMaps();
  const maps = window.google.maps;
  if (!payload?.center?.lat || !payload?.center?.lng) {
    throw new Error('Map payload has no center.');
  }

  els.realMap.classList.add('active');
  els.mapSourceBadge.textContent = payload.route_intelligence?.fallback_used
    ? 'Real map + simulated route'
    : 'Google map + route';

  const center = toLatLng(payload.center);
  realMap = new maps.Map(els.realMap, {
    center,
    zoom: 13,
    mapTypeId: 'roadmap',
    gestureHandling: 'greedy',
    fullscreenControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    styles: [
      { elementType: 'geometry', stylers: [{ color: '#1b2436' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#d8e2f0' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#172033' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b4a6f' }] },
    ],
  });

  clearRealMapObjects();
  addRealRoute(payload.blocked_route, '#ff4444', 7, 'Blocked / original route');
  addRealRoute(payload.alternate_route, '#00cc66', 7, 'Recommended alternate route');
  addRealMarkers(payload.markers || {});

  const bounds = new maps.LatLngBounds();
  let hasBounds = false;
  [payload.blocked_route, payload.alternate_route].forEach((route) => {
    (route?.polyline || []).forEach((point) => {
      bounds.extend(toLatLng(point));
      hasBounds = true;
    });
  });
  Object.values(payload.markers || {}).forEach((marker) => {
    if (marker?.position) {
      bounds.extend(toLatLng(marker.position));
      hasBounds = true;
    }
  });
  if (hasBounds) {
    realMap.fitBounds(bounds, 48);
  }

  setTimeout(() => maps.event.trigger(realMap, 'resize'), 100);
}

function showSvgMap(label = 'Mock map') {
  els.realMap.classList.remove('active');
  els.mapSourceBadge.textContent = label;
  clearRealMapObjects();
}

function clearRealMapObjects() {
  realMapObjects.forEach((object) => object.setMap(null));
  realMapObjects = [];
}

function addRealRoute(route, color, weight, title) {
  if (!route?.polyline?.length || !realMap) return;
  const maps = window.google.maps;
  const line = new maps.Polyline({
    path: route.polyline.map(toLatLng),
    geodesic: true,
    strokeColor: color,
    strokeOpacity: 0.92,
    strokeWeight: weight,
    map: realMap,
    title: route.label || title,
  });
  realMapObjects.push(line);
}

function addRealMarkers(markers) {
  if (!realMap) return;
  const maps = window.google.maps;
  const icons = {
    crisis: 'red-dot',
    weather: 'blue-dot',
    rescue: 'green-dot',
  };
  Object.entries(markers).forEach(([type, marker]) => {
    if (!marker?.position) return;
    const googleMarker = new maps.Marker({
      map: realMap,
      position: toLatLng(marker.position),
      title: marker.label || type,
      icon: `https://maps.google.com/mapfiles/ms/icons/${icons[type] || 'yellow-dot'}.png`,
    });
    const info = new maps.InfoWindow({
      content: `<strong>${escapeHtml(marker.label || type)}</strong><br>${escapeHtml(marker.severity || marker.condition || marker.status || '')}`,
    });
    googleMarker.addListener('click', () => info.open({ anchor: googleMarker, map: realMap }));
    realMapObjects.push(googleMarker, info);
  });
}

function toLatLng(point) {
  return { lat: Number(point.lat), lng: Number(point.lng) };
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char]));
}

function drawSvgMap(layoutId, state) {
  showSvgMap('Mock map fallback');
  let svg = '';
  // Base Grid
  svg += `<rect width="100%" height="100%" fill="#0f1629"/>`;
  for(let i=100; i<800; i+=100) svg += `<line x1="${i}" y1="0" x2="${i}" y2="500" stroke="#1e2638" stroke-width="2"/>`;
  for(let i=100; i<500; i+=100) svg += `<line x1="0" y1="${i}" x2="800" y2="${i}" stroke="#1e2638" stroke-width="2"/>`;

  if (layoutId === 'g10_urban_flooding') {
    svg += `
      <path class="road-line ${state==='before'?'blocked':'rerouted'}" d="M 100 250 L 400 250 L 400 400" />
      <path class="road-line" d="M 400 250 L 700 250" />
      <path class="road-line ${state==='after'?'rerouted':''}" d="M 100 150 L 500 150 L 500 400" />
      <text x="420" y="240" class="map-label">Khayaban-e-Iqbal</text>
      <text x="520" y="140" class="map-label">Margalla Rd</text>
      <circle cx="400" cy="250" r="15" fill="var(--danger)" opacity="0.5"/>
      <circle cx="400" cy="250" r="5" fill="var(--danger)"/>
    `;
    if(state==='after') {
      svg += `<circle cx="100" cy="150" r="8" class="vehicle active"><animateMotion path="M 0 0 L 400 0 L 400 250" dur="4s" repeatCount="indefinite"/></circle>`;
    }
  } 
  else if (layoutId === 'peshawar_ring_road_blast') {
    svg += `
      <path class="road-line ${state==='before'?'blocked':'congested'}" d="M 50 400 Q 400 50 750 400" fill="none"/>
      <path class="road-line ${state==='after'?'rerouted':''}" d="M 200 280 L 600 280" />
      <text x="350" y="100" class="map-label">Ring Road</text>
      <text x="350" y="270" class="map-label">University Rd Div.</text>
      <circle cx="400" cy="155" r="15" fill="var(--danger)" opacity="0.5"/>
      <circle cx="400" cy="155" r="5" fill="var(--danger)"/>
    `;
    if(state==='after') {
      svg += `<rect x="190" y="275" width="15" height="10" fill="var(--ok)" class="vehicle active"><animateMotion path="M 0 0 L 400 0" dur="3s" repeatCount="indefinite"/></rect>`;
    }
  }
  else {
    // Ambulance
    svg += `
      <path class="road-line ${state==='before'?'congested':'congested'}" d="M 100 300 L 700 300" />
      <path class="road-line ${state==='before'?'blocked':'rerouted'}" d="M 400 100 L 400 300" />
      <path class="road-line ${state==='after'?'rerouted':''}" d="M 400 100 L 600 100 L 600 300" />
      <text x="120" y="290" class="map-label">Srinagar Hwy</text>
      <text x="420" y="150" class="map-label">G-10 Underpass</text>
      <circle cx="400" cy="300" r="15" fill="var(--warn)" opacity="0.5"/>
    `;
    if(state==='before') {
      svg += `<text x="390" y="290" font-size="20">🚑</text>`;
    } else {
      svg += `<text x="590" y="150" font-size="20" class="vehicle active"><animateMotion path="M -190 -40 L 0 -40 L 0 140" dur="3s" fill="freeze"/></text>`;
    }
  }
  els.svgMap.innerHTML = svg;
}

// 9. STARTUP
init();
