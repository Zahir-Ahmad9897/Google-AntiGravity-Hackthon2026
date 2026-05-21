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
let leafletMap = null;
let leafletPoiLayer = null;
let poiFetchTimer = null;

const els = {
  appMain: document.getElementById('appMain'),
  stageEyebrow: document.getElementById('stageEyebrow'),
  stageTitle: document.getElementById('stageTitle'),
  stageDescription: document.getElementById('stageDescription'),
  clock: document.getElementById('liveClock'),
  grid: document.getElementById('scenarioGrid'),
  resultTabs: document.getElementById('resultTabs'),
  showActionsView: document.getElementById('showActionsView'),
  showMapView: document.getElementById('showMapView'),
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
  wwSource: document.getElementById('wwSource'),
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
  els.showActionsView.addEventListener('click', () => setStage('actions'));
  els.showMapView.addEventListener('click', () => setStage('map'));
  
  setStage('input');
  initAgentList();
  loadAppConfig();
  loadScenarios();
}

function setStage(stage) {
  els.appMain.dataset.stage = stage;
  const activeStep = { input: 'step1', pipeline: 'step2', actions: 'step3', map: 'step4' }[stage] || 'step1';
  const stageCopy = {
    input: {
      eyebrow: 'Step 1',
      title: 'Input a crisis scenario',
      description: 'Start with one approved citizen report. CIRO will move through the agent pipeline, action plan, then map and weather intelligence.'
    },
    pipeline: {
      eyebrow: 'Step 2',
      title: 'Agents are checking the signal',
      description: 'The pipeline verifies public signal, weather, traffic, route context, response plan, and simulated execution in sequence.'
    },
    actions: {
      eyebrow: 'Step 3',
      title: 'Review response actions',
      description: 'Use this page for the decision summary, simulated action log, and before/after operational impact.'
    },
    map: {
      eyebrow: 'Step 4',
      title: 'Inspect map and weather',
      description: 'Use this page only when route, blockage, rainfall, or field conditions matter for the response.'
    }
  }[stage];

  if (stageCopy) {
    els.stageEyebrow.textContent = stageCopy.eyebrow;
    els.stageTitle.textContent = stageCopy.title;
    els.stageDescription.textContent = stageCopy.description;
  }

  document.querySelectorAll('.step').forEach(step => step.classList.toggle('active', step.id === activeStep));

  const resultsReady = stage === 'actions' || stage === 'map';
  els.resultTabs.style.display = resultsReady ? 'flex' : 'none';
  els.showActionsView.classList.toggle('active', stage === 'actions');
  els.showMapView.classList.toggle('active', stage === 'map');

  window.scrollTo({ top: 0, behavior: stage === 'input' ? 'auto' : 'smooth' });

  if (stage === 'map') {
    setTimeout(() => leafletMap?.invalidateSize(), 80);
    setTimeout(() => leafletMap?.invalidateSize(), 450);
    setTimeout(handleMapErrorFallback, 1200);
    setTimeout(handleMapErrorFallback, 2600);
    setTimeout(handleMapErrorFallback, 5000);
  }
}

function handleMapErrorFallback() {
  if (!els.realMap.classList.contains('active')) return;
  if (!els.realMap.querySelector('.gm-err-container, .gm-err-content, .gm-err-title')) return;
  const layoutId = currentScenarioMeta?.map_layout_id || currentScenarioMeta?.map_layout || 'peshawar_ring_road_blast';
  console.warn('Google Maps displayed an error surface; switching to tactical map fallback.');
  drawSvgMap(layoutId, 'after');
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

function applyWeatherIntelligence(payload) {
  const weather = payload?.weather_intelligence;
  if (!weather || !currentScenarioMeta?.weather) return;
  const rainfall = Number(weather.rainfall_mm_per_hour ?? weather.precipitation_mm ?? 0);
  const defaults = getLocalWeatherDefaults(weather.location || currentScenarioMeta.location || '');
  currentScenarioMeta.weather.condition = weather.condition || currentScenarioMeta.weather.condition;
  currentScenarioMeta.weather.temp = weather.temperature || currentScenarioMeta.weather.temp;
  if (!currentScenarioMeta.weather.temp || currentScenarioMeta.weather.temp === 'unavailable') {
    currentScenarioMeta.weather.temp = defaults.temp;
  }
  if (/^(none|mock_weather|no weather alert)$/i.test(String(currentScenarioMeta.weather.condition || ''))) {
    currentScenarioMeta.weather.condition = defaults.condition;
  }
  if (!currentScenarioMeta.weather.wind || currentScenarioMeta.weather.wind === 'simulated') {
    currentScenarioMeta.weather.wind = defaults.wind;
  }
  currentScenarioMeta.weather.rainfall = `${rainfall.toFixed(1)} mm/hr`;
  currentScenarioMeta.weather.rainfallMmHr = rainfall;
  currentScenarioMeta.weather.isCrisisFactor = ['high', 'medium'].includes(String(weather.risk_level || '').toLowerCase());
  currentScenarioMeta.weather.status = currentScenarioMeta.weather.isCrisisFactor
    ? 'CONTRIBUTING TO CRISIS'
    : 'NORMAL CONDITIONS';
  currentScenarioMeta.weather.source = weather.fallback_used ? 'simulated weather fallback' : weather.source;
  renderWidgetsBefore();
}

function getLocalWeatherDefaults(location) {
  const text = String(location).toLowerCase();
  if (text.includes('peshawar')) {
    return { temp: '31°C', condition: 'Partly Cloudy', wind: '18 km/h' };
  }
  if (text.includes('g-10') || text.includes('islamabad')) {
    return { temp: '24°C', condition: 'Cloudy', wind: '22 km/h' };
  }
  return { temp: '27°C', condition: 'Weather watch', wind: '16 km/h' };
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

function buildCustomMeta(location, severity, text = '') {
  const high = severity.toLowerCase() === 'critical' || severity.toLowerCase() === 'high';
  const lowered = `${text} ${location}`.toLowerCase();
  const isWeatherIncident = /(flood|pani|paani|rain|overflow|nullah|barish|baarish)/.test(lowered);
  const isBlastIncident = /(blast|explosion|dhamaka|accident|crash|collision)/.test(lowered);
  const rainfall = isWeatherIncident ? (high ? 8.8 : severity.toLowerCase() === 'medium' ? 4.8 : 1.5) : 0;
  const layoutId = isBlastIncident || lowered.includes('peshawar')
    ? 'peshawar_ring_road_blast'
    : isWeatherIncident
      ? 'g10_urban_flooding'
      : 'ambulance_rain_congestion';
  return {
    scenario_id: 'custom_permission_input',
    display_name: `Custom report - ${location}`,
    location,
    crisis_type: isBlastIncident ? 'Blast / road blockage' : 'User reported crisis',
    description: 'User-approved manual report routed through CIRO.',
    map_layout_id: layoutId,
    map_layout: layoutId,
    weather: {
      condition: isWeatherIncident ? (high ? 'Heavy Rain' : 'Rain Watch') : 'No weather alert',
      temp: 'unavailable',
      wind: 'simulated',
      rainfall: `${rainfall.toFixed(1)} mm/hr`,
      rainfallMmHr: rainfall,
      windKmh: 0,
      temperatureC: 0,
      isCrisisFactor: rainfall >= 5,
      status: rainfall >= 5 ? 'CONTRIBUTING TO CRISIS' : 'NORMAL CONDITIONS'
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
  const crisisType = String(analysis?.crisis_type || '').toLowerCase();
  const locationText = `${analysis?.location || fallbackLocation}`.toLowerCase();

  meta.display_name = result.scenario_name || meta.display_name;
  meta.location = analysis?.location || weather?.district || fallbackLocation;
  meta.crisis_type = analysis?.detected_situation || meta.crisis_type;
  if (crisisType.includes('accident') || crisisType.includes('blockage') || locationText.includes('peshawar')) {
    meta.map_layout_id = 'peshawar_ring_road_blast';
  } else if (crisisType.includes('flood')) {
    meta.map_layout_id = 'g10_urban_flooding';
  }
  if (weather) {
    const rainfall = Number(weather.rainfall_mm_per_hour || 0);
    meta.weather.condition = weather.alert_active || rainfall > 0
      ? (weather.alert_type || 'simulated_weather')
      : 'No weather alert';
    meta.weather.rainfall = `${Number(weather.rainfall_mm_per_hour || 0).toFixed(1)} mm/hr`;
    meta.weather.rainfallMmHr = rainfall;
    meta.weather.isCrisisFactor = Boolean(weather.alert_active);
    meta.weather.status = weather.alert_active ? 'CONTRIBUTING TO CRISIS' : 'NORMAL CONDITIONS';
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

function getWeatherBadge(weather) {
  const condition = String(weather?.condition || '').toLowerCase();
  if (condition.includes('rain') || condition.includes('flood')) return 'RAIN';
  if (condition.includes('alert') && !condition.includes('no weather')) return 'ALERT';
  if (weather?.isCrisisFactor) return 'RISK';
  return 'OK';
}

// 4. RUN PIPELINE
function prepareRunUi() {
  setStage('pipeline');
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
    applyWeatherIntelligence(currentMapPayload);
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
  currentScenarioMeta = buildCustomMeta(location, severity, text);
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
    applyWeatherIntelligence(currentMapPayload);
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
  unlockRunUi();
  
  renderCrisisSummary(finalIter);
  renderWidgetsAfter(finalIter);
  setStage('actions');
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
  els.wwIcon.textContent = getWeatherBadge(m.weather);
  els.wwCond.textContent = m.weather.condition;
  els.wwTemp.textContent = m.weather.temp;
  els.wwWind.textContent = m.weather.wind;
  els.wwRain.textContent = m.weather.rainfall;
  els.wwSource.textContent = m.weather.source || 'scenario signal';
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
    line.innerHTML = `<span class="log-time">${time}</span> <span class="log-icon check">[OK]</span> ${actions[i]}`;
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

// 8. MAP DRAWING (Actual map tiles with tactical SVG fallback)
function drawMap(layoutId, state) {
  if (state === 'after' && currentMapPayload) {
    renderActualTileMap(currentMapPayload, layoutId, state);
    return;
  }
  drawSvgMap(layoutId, state);
}

function renderActualTileMap(payload, layoutId, state) {
  if (window.L) {
    renderLeafletMap(payload, layoutId, state);
    return;
  }

  if (!payload?.center?.lat || !payload?.center?.lng) {
    drawSvgMap(layoutId, state);
    return;
  }

  els.realMap.classList.add('active');
  els.mapSourceBadge.textContent = 'Actual map + simulated route';
  clearRealMapObjects();

  const bounds = collectMapBounds(payload);
  const zoom = chooseOsmZoom(bounds);
  const container = els.realMap.getBoundingClientRect();
  const width = Math.max(640, Math.round(container.width || 800));
  const height = Math.max(320, Math.round(container.height || 410));
  const center = getBoundsCenter(bounds) || payload.center;
  const centerPx = latLngToWorldPixel(center, zoom);
  const topLeft = { x: centerPx.x - width / 2, y: centerPx.y - height / 2 };
  const tileMinX = Math.floor(topLeft.x / 256) - 1;
  const tileMaxX = Math.floor((topLeft.x + width) / 256) + 1;
  const tileMinY = Math.floor(topLeft.y / 256) - 1;
  const tileMaxY = Math.floor((topLeft.y + height) / 256) + 1;
  const maxTile = 2 ** zoom;
  const tiles = [];

  for (let x = tileMinX; x <= tileMaxX; x++) {
    for (let y = tileMinY; y <= tileMaxY; y++) {
      if (y < 0 || y >= maxTile) continue;
      const wrappedX = ((x % maxTile) + maxTile) % maxTile;
      tiles.push(`
        <img class="osm-tile"
          src="https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png"
          alt=""
          style="left:${Math.round(x * 256 - topLeft.x)}px; top:${Math.round(y * 256 - topLeft.y)}px;"
        >
      `);
    }
  }

  const routePath = (route) => (route?.polyline || [])
    .map((point) => projectToViewport(point, zoom, topLeft))
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
  const blockedPath = routePath(payload.blocked_route);
  const alternatePath = routePath(payload.alternate_route);
  const crisisPoint = payload.markers?.crisis?.position ? projectToViewport(payload.markers.crisis.position, zoom, topLeft) : null;
  const rescuePoint = payload.markers?.rescue?.position ? projectToViewport(payload.markers.rescue.position, zoom, topLeft) : null;
  const weatherPoint = payload.markers?.weather?.position ? projectToViewport(payload.markers.weather.position, zoom, topLeft) : null;

  els.realMap.innerHTML = `
    <div class="osm-map" style="width:${width}px;height:${height}px">
      ${tiles.join('')}
      <svg class="osm-route-layer" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        ${blockedPath ? `<path class="osm-route blocked" d="${blockedPath}" />` : ''}
        ${alternatePath ? `<path class="osm-route rerouted" d="${alternatePath}" />` : ''}
        ${crisisPoint ? `<g class="osm-marker crisis" transform="translate(${crisisPoint.x},${crisisPoint.y})"><circle r="12"/><text y="4">!</text></g>` : ''}
        ${rescuePoint ? `<g class="osm-marker rescue" transform="translate(${rescuePoint.x},${rescuePoint.y})"><circle r="10"/><text y="4">R</text></g>` : ''}
        ${weatherPoint ? `<g class="osm-marker weather" transform="translate(${weatherPoint.x},${weatherPoint.y})"><circle r="9"/><text y="3">W</text></g>` : ''}
      </svg>
      <div class="osm-route-card">
        <strong>${escapeHtml(payload.route_intelligence?.alternate_route || 'Recommended alternate')}</strong>
        <span>${escapeHtml(payload.route_intelligence?.estimated_travel_time || 'route ready')} · ${escapeHtml(payload.route_intelligence?.distance || 'distance simulated')}</span>
      </div>
      <div class="osm-attribution">© OpenStreetMap contributors · CIRO simulated overlay</div>
    </div>
  `;
}

function renderLeafletMap(payload, layoutId, state) {
  if (!payload?.center?.lat || !payload?.center?.lng) {
    drawSvgMap(layoutId, state);
    return;
  }

  els.realMap.classList.add('active');
  els.mapSourceBadge.textContent = 'Interactive map + simulated route';
  clearRealMapObjects();

  els.realMap.innerHTML = `
    <div id="leafletCiroMap" class="leaflet-map"></div>
    <form class="map-search" id="mapSearchForm">
      <input id="mapSearchInput" type="search" placeholder="Search place, road, shop..." autocomplete="off">
      <button type="submit">Search</button>
      <div class="map-search-results" id="mapSearchResults"></div>
    </form>
    <div class="map-hint">Click map for place details. Zoom in to discover shops and POIs.</div>
  `;

  const L = window.L;
  const center = toLatLng(payload.center);
  leafletMap = L.map('leafletCiroMap', {
    center: [center.lat, center.lng],
    zoom: 14,
    zoomControl: true,
    scrollWheelZoom: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  }).addTo(leafletMap);

  const bounds = [];
  const addRoute = (route, color, label, dashArray) => {
    const points = (route?.polyline || []).map((point) => [Number(point.lat), Number(point.lng)]);
    if (!points.length) return;
    points.forEach((point) => bounds.push(point));
    L.polyline(points, {
      color,
      weight: 7,
      opacity: 0.9,
      dashArray,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(leafletMap).bindPopup(`<strong>${escapeHtml(label)}</strong><br>${escapeHtml(route.label || '')}`);
  };

  addRoute(payload.blocked_route, '#42d392', 'Normal/original route', null);
  addRoute(payload.alternate_route, '#ff5d5d', 'Recommended emergency reroute', '10 8');

  const markerConfig = {
    crisis: { color: '#ff5d5d', text: '!', label: 'Crisis point' },
    rescue: { color: '#42d392', text: 'R', label: 'Rescue unit' },
    weather: { color: '#23c7bd', text: 'W', label: 'Weather signal' },
  };

  Object.entries(payload.markers || {}).forEach(([type, marker]) => {
    if (!marker?.position) return;
    const point = toLatLng(marker.position);
    bounds.push([point.lat, point.lng]);
    const config = markerConfig[type] || { color: '#ffc857', text: '?', label: type };
    L.marker([point.lat, point.lng], { icon: createLeafletIcon(config.color, config.text) })
      .addTo(leafletMap)
      .bindPopup(`<strong>${escapeHtml(marker.label || config.label)}</strong><br>${escapeHtml(marker.severity || marker.condition || marker.status || '')}`);
  });

  if (bounds.length) {
    leafletMap.fitBounds(bounds, { padding: [42, 42], maxZoom: 15 });
  }
  setTimeout(() => leafletMap?.invalidateSize(), 120);
  setTimeout(() => leafletMap?.invalidateSize(), 700);

  leafletPoiLayer = L.layerGroup().addTo(leafletMap);
  leafletMap.on('click', (event) => showClickedPlace(event.latlng));
  leafletMap.on('zoomend moveend', scheduleNearbyPoiLoad);
  setupMapSearch();
  scheduleNearbyPoiLoad();
}

function createLeafletIcon(color, text) {
  return window.L.divIcon({
    className: 'ciro-leaflet-marker',
    html: `<span style="background:${color}">${escapeHtml(text)}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function setupMapSearch() {
  const form = document.getElementById('mapSearchForm');
  const input = document.getElementById('mapSearchInput');
  const results = document.getElementById('mapSearchResults');
  if (!form || !input || !results || !leafletMap) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) return;
    results.textContent = 'Searching...';
    try {
      const items = await searchPlaces(query);
      if (!items.length) {
        results.textContent = 'No places found nearby.';
        return;
      }
      results.innerHTML = items.slice(0, 4).map((item, index) => `
        <button type="button" data-index="${index}">
          <strong>${escapeHtml(item.name || item.display_name.split(',')[0])}</strong>
          <span>${escapeHtml(item.display_name)}</span>
        </button>
      `).join('');
      results.querySelectorAll('button').forEach((button) => {
        button.addEventListener('click', () => {
          const item = items[Number(button.dataset.index)];
          const lat = Number(item.lat);
          const lng = Number(item.lon);
          leafletMap.setView([lat, lng], Math.max(17, leafletMap.getZoom()));
          window.L.marker([lat, lng], { icon: createLeafletIcon('#ffc857', 'S') })
            .addTo(leafletMap)
            .bindPopup(`<strong>${escapeHtml(item.name || 'Search result')}</strong><br>${escapeHtml(item.display_name)}`)
            .openPopup();
          results.innerHTML = '';
        });
      });
    } catch (error) {
      console.warn('Place search failed', error);
      results.textContent = 'Search temporarily unavailable.';
    }
  });
}

async function searchPlaces(query) {
  const center = leafletMap?.getCenter();
  const fullQuery = center ? `${query} near ${center.lat.toFixed(4)},${center.lng.toFixed(4)}` : query;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=pk&q=${encodeURIComponent(fullQuery)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Nominatim HTTP ${response.status}`);
  return response.json();
}

async function showClickedPlace(latlng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}&zoom=18&addressdetails=1`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Reverse geocode HTTP ${response.status}`);
    const place = await response.json();
    window.L.popup()
      .setLatLng(latlng)
      .setContent(`<strong>${escapeHtml(place.name || place.display_name?.split(',')[0] || 'Selected point')}</strong><br>${escapeHtml(place.display_name || `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`)}`)
      .openOn(leafletMap);
  } catch (error) {
    window.L.popup()
      .setLatLng(latlng)
      .setContent(`<strong>Selected point</strong><br>${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`)
      .openOn(leafletMap);
  }
}

function scheduleNearbyPoiLoad() {
  clearTimeout(poiFetchTimer);
  poiFetchTimer = setTimeout(loadNearbyPois, 550);
}

async function loadNearbyPois() {
  if (!leafletMap || !leafletPoiLayer) return;
  leafletPoiLayer.clearLayers();
  if (leafletMap.getZoom() < 16) return;

  const bounds = leafletMap.getBounds();
  const south = bounds.getSouth().toFixed(5);
  const west = bounds.getWest().toFixed(5);
  const north = bounds.getNorth().toFixed(5);
  const east = bounds.getEast().toFixed(5);
  const query = `
    [out:json][timeout:8];
    (
      node["shop"](${south},${west},${north},${east});
      node["amenity"](${south},${west},${north},${east});
    );
    out center 30;
  `;
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);
    const payload = await response.json();
    (payload.elements || []).slice(0, 30).forEach((item) => {
      if (!item.lat || !item.lon || !item.tags?.name) return;
      window.L.circleMarker([item.lat, item.lon], {
        radius: 4,
        color: '#10110f',
        fillColor: '#ffc857',
        fillOpacity: 0.94,
        weight: 1,
      }).addTo(leafletPoiLayer).bindTooltip(item.tags.name, {
        direction: 'top',
        offset: [0, -4],
        opacity: 0.95,
      }).bindPopup(`<strong>${escapeHtml(item.tags.name)}</strong><br>${escapeHtml(item.tags.shop || item.tags.amenity || 'local place')}`);
    });
  } catch (error) {
    console.warn('Nearby POI lookup failed', error);
  }
}

function collectMapBounds(payload) {
  const points = [];
  [payload.center, payload.markers?.crisis?.position, payload.markers?.rescue?.position, payload.markers?.weather?.position]
    .filter(Boolean)
    .forEach((point) => points.push(toLatLng(point)));
  [payload.blocked_route, payload.alternate_route].forEach((route) => {
    (route?.polyline || []).forEach((point) => points.push(toLatLng(point)));
  });
  if (!points.length) return null;
  return points.reduce((bounds, point) => ({
    minLat: Math.min(bounds.minLat, point.lat),
    maxLat: Math.max(bounds.maxLat, point.lat),
    minLng: Math.min(bounds.minLng, point.lng),
    maxLng: Math.max(bounds.maxLng, point.lng),
  }), { minLat: points[0].lat, maxLat: points[0].lat, minLng: points[0].lng, maxLng: points[0].lng });
}

function getBoundsCenter(bounds) {
  if (!bounds) return null;
  return { lat: (bounds.minLat + bounds.maxLat) / 2, lng: (bounds.minLng + bounds.maxLng) / 2 };
}

function chooseOsmZoom(bounds) {
  if (!bounds) return 13;
  const span = Math.max(
    Math.max(0.002, Math.abs(bounds.maxLat - bounds.minLat)),
    Math.max(0.002, Math.abs(bounds.maxLng - bounds.minLng))
  );
  if (span > 0.22) return 11;
  if (span > 0.1) return 12;
  if (span > 0.045) return 13;
  if (span > 0.018) return 14;
  return 15;
}

function latLngToWorldPixel(point, zoom) {
  const sinLat = Math.sin((Number(point.lat) * Math.PI) / 180);
  const scale = 256 * 2 ** zoom;
  return {
    x: ((Number(point.lng) + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function projectToViewport(point, zoom, topLeft) {
  const world = latLngToWorldPixel(point, zoom);
  return { x: world.x - topLeft.x, y: world.y - topLeft.y };
}

async function renderRealMap(payload, layoutId, state) {
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
  addRealRoute(payload.blocked_route, '#00cc66', 7, 'Normal / original route');
  addRealRoute(payload.alternate_route, '#ff4444', 7, 'Recommended emergency reroute');
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
  const fallbackIfMapFailed = () => {
    const mapText = els.realMap.textContent || '';
    const hasGoogleError = Boolean(els.realMap.querySelector('.gm-err-container, .gm-err-content, .gm-err-title'));
    if (hasGoogleError || /oops|went wrong|didn't load google maps/i.test(mapText)) {
      console.warn('Google Maps rendered an auth/error surface; using SVG fallback.');
      drawSvgMap(layoutId, state);
      return true;
    }
    return false;
  };
  setTimeout(fallbackIfMapFailed, 900);
  setTimeout(fallbackIfMapFailed, 1800);
  setTimeout(fallbackIfMapFailed, 3200);
  let mapHealthChecks = 0;
  const mapHealthInterval = setInterval(() => {
    mapHealthChecks += 1;
    if (fallbackIfMapFailed() || mapHealthChecks >= 16) {
      clearInterval(mapHealthInterval);
    }
  }, 500);
}

function showSvgMap(label = 'Mock map') {
  els.realMap.classList.remove('active');
  els.mapSourceBadge.textContent = label;
  clearRealMapObjects();
}

function clearRealMapObjects() {
  if (leafletMap) {
    leafletMap.remove();
    leafletMap = null;
    leafletPoiLayer = null;
  }
  clearTimeout(poiFetchTimer);
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

// ═══════════════════════════════════════════════════════════════
// FEATURE 1: Real-time Voice Narration (Web Speech API)
// Narrates each agent's output as it completes during the pipeline.
// ═══════════════════════════════════════════════════════════════
const ciroNarration = (() => {
  let enabled = false;
  const btn = document.getElementById('btnNarrate');
  
  btn.addEventListener('click', () => {
    enabled = !enabled;
    btn.classList.toggle('active', enabled);
    btn.textContent = enabled ? '🔊 ON' : '🔊 Narrate';
    if (!enabled) window.speechSynthesis?.cancel();
  });

  function speak(text) {
    if (!enabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.1;
    utter.pitch = 0.9;
    utter.volume = 0.8;
    // Prefer a calm English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utter.voice = preferred;
    window.speechSynthesis.speak(utter);
  }

  // Pre-load voices
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }

  return { speak, isEnabled: () => enabled };
})();

// ═══════════════════════════════════════════════════════════════
// FEATURE 3: Sound Effects (Web Audio API — no external files)
// Generates tones programmatically using oscillators.
// ═══════════════════════════════════════════════════════════════
const ciroSounds = (() => {
  let muted = false;
  let ctx = null;
  const btn = document.getElementById('btnMute');

  btn.addEventListener('click', () => {
    muted = !muted;
    btn.textContent = muted ? '🔇' : '🔔';
    btn.classList.toggle('active', muted);
  });

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function playTone(freq, duration, type = 'sine', gain = 0.15) {
    if (muted) return;
    try {
      const c = getCtx();
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.value = gain;
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
      osc.connect(g);
      g.connect(c.destination);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + duration);
    } catch (e) { /* Audio not available */ }
  }

  return {
    ping:    () => playTone(880, 0.15, 'sine', 0.1),      // Agent complete
    alert:   () => { playTone(440, 0.3, 'square', 0.08); setTimeout(() => playTone(440, 0.3, 'square', 0.08), 350); }, // HIGH crisis
    success: () => { playTone(523, 0.15, 'sine', 0.1); setTimeout(() => playTone(659, 0.15, 'sine', 0.1), 150); setTimeout(() => playTone(784, 0.25, 'sine', 0.1), 300); }, // Pipeline done
    isMuted: () => muted
  };
})();

// ═══════════════════════════════════════════════════════════════
// FEATURE 2: Live Threat Timeline
// Shows agent completions as timestamped nodes on a timeline.
// ═══════════════════════════════════════════════════════════════
const ciroTimeline = (() => {
  const container = document.getElementById('threatTimeline');
  const track = document.getElementById('timelineTrack');

  function show() { container.style.display = 'block'; track.innerHTML = ''; }
  function hide() { container.style.display = 'none'; }

  function addNode(agentName, status) {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    // Add connector if not first
    if (track.children.length > 0) {
      const conn = document.createElement('div');
      conn.className = 'tl-connector' + (status === 'done' ? ' active' : '');
      track.appendChild(conn);
    }
    const node = document.createElement('div');
    node.className = `tl-node ${status}`;
    node.innerHTML = `<div class="tl-dot"></div><div class="tl-name">${agentName}</div><div class="tl-time">${time}</div>`;
    track.appendChild(node);
    // Auto-scroll to latest
    container.scrollLeft = container.scrollWidth;
  }

  function updateLast(status) {
    const nodes = track.querySelectorAll('.tl-node');
    const last = nodes[nodes.length - 1];
    if (last) { last.className = `tl-node ${status}`; }
    const conns = track.querySelectorAll('.tl-connector');
    const lastConn = conns[conns.length - 1];
    if (lastConn && status === 'done') lastConn.classList.add('active');
  }

  return { show, hide, addNode, updateLast };
})();

// ═══════════════════════════════════════════════════════════════
// FEATURE 4: Particle Network Background (Canvas)
// Subtle animated dots that drift and connect with lines.
// ═══════════════════════════════════════════════════════════════
(() => {
  const canvas = document.getElementById('particleBg');
  if (!canvas) return;
  const c = canvas.getContext('2d');
  const particles = [];
  const PARTICLE_COUNT = 60;
  const MAX_DIST = 120;

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize);
  resize();

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: 1.5 + Math.random() * 1.5
    });
  }

  function draw() {
    c.clearRect(0, 0, canvas.width, canvas.height);
    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          c.strokeStyle = `rgba(0, 212, 255, ${1 - dist / MAX_DIST})`;
          c.lineWidth = 0.5;
          c.beginPath();
          c.moveTo(particles[i].x, particles[i].y);
          c.lineTo(particles[j].x, particles[j].y);
          c.stroke();
        }
      }
    }
    // Draw particles
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      c.fillStyle = 'rgba(0, 212, 255, 0.6)';
      c.beginPath();
      c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      c.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

// ═══════════════════════════════════════════════════════════════
// FEATURE 5: Export Crisis Report as PDF (window.print)
// ═══════════════════════════════════════════════════════════════
(() => {
  const btn = document.getElementById('btnDownload');
  // Add print header to DOM (hidden by default, shown in @media print)
  const printHeader = document.createElement('div');
  printHeader.className = 'print-header';
  printHeader.innerHTML = `<h1>🛡️ CIRO Crisis Report</h1><p>Generated: ${new Date().toLocaleString()}</p>`;
  document.querySelector('main')?.prepend(printHeader);

  btn.addEventListener('click', () => {
    printHeader.querySelector('p').textContent = `Generated: ${new Date().toLocaleString()}`;
    window.print();
  });
})();

// ═══════════════════════════════════════════════════════════════
// FEATURE 6: Keyboard Shortcuts
// ═══════════════════════════════════════════════════════════════
document.addEventListener('keydown', (e) => {
  // Don't trigger when typing in inputs
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

  const scenarioCards = document.querySelectorAll('.scenario-card .run-btn');
  if (e.key === '1' && scenarioCards[0]) scenarioCards[0].click();
  if (e.key === '2' && scenarioCards[1]) scenarioCards[1].click();
  if (e.key === '3' && scenarioCards[2]) scenarioCards[2].click();
  if (e.key.toLowerCase() === 'r') { location.reload(); }
  if (e.key.toLowerCase() === 'm') { document.getElementById('btnMute')?.click(); }
  if (e.key.toLowerCase() === 'n') { document.getElementById('btnNarrate')?.click(); }
});

// ═══════════════════════════════════════════════════════════════
// HOOK: Integrate features into existing pipeline animation
// Monkey-patch animatePipeline to add sounds, narration, timeline
// ═══════════════════════════════════════════════════════════════
const _originalAnimatePipeline = animatePipeline;
animatePipeline = async function() {
  const finalIter = currentPipelineResult.iterations[currentPipelineResult.iterations.length - 1];
  const outputs = finalIter.agent_outputs || [];

  // Show timeline and download button
  ciroTimeline.show();
  document.getElementById('btnDownload').style.display = 'inline-flex';

  for (let i = 0; i < AGENT_PIPELINE.length; i++) {
    const agent = AGENT_PIPELINE[i];
    const node = document.getElementById(`node_${agent.id}`);
    const status = document.getElementById(`status_${agent.id}`);
    const summary = document.getElementById(`sum_${agent.id}`);

    // Set to RUNNING
    node.classList.add('active');
    status.textContent = 'RUNNING';
    ciroTimeline.addNode(agent.name, 'running');

    await sleep(400);

    // Set to DONE
    node.classList.remove('active');
    node.classList.add('done');
    status.textContent = 'DONE';

    const out = outputs.find(o => o.agent_name.toLowerCase().includes(agent.id.split('_')[0])) || outputs[i] || { summary: `Completed for ${agent.name}` };
    summary.textContent = out.summary;

    // Sound ping
    ciroSounds.ping();

    // Timeline update
    ciroTimeline.updateLast('done');

    // Narration
    ciroNarration.speak(`${agent.name} reports: ${out.summary}`);

    els.progressBar.style.width = `${60 + ((i+1)/AGENT_PIPELINE.length)*40}%`;
  }

  // Iterations
  for (let i = 1; i <= 3; i++) {
    document.getElementById(`iter${i}`).classList.add('done');
    await sleep(200);
  }

  // Final sounds
  const level = (finalIter.crisis_level || '').toUpperCase();
  if (level === 'HIGH' || level === 'CRISIS') {
    ciroSounds.alert();
    ciroNarration.speak(`Warning: Crisis level is ${level}. Escalation recommended.`);
  } else {
    ciroSounds.success();
    ciroNarration.speak('Pipeline complete. Crisis response plan generated successfully.');
  }

  finishPipeline(finalIter);
};
