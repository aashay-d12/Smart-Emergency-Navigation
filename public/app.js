"use strict";
/* ═══════════════════════════════════════════════════════════════════
   EVNF — app.js
   Leaflet map · Real GPS coords · OSRM road routing · Live simulation
═══════════════════════════════════════════════════════════════════ */

// ── Real geographic coordinates for each simulation node ─────────────────
// Extracted from KML and user requests
const GEO = {
  // University
  IIIT: [18.7639, 73.6975],     // IIIT Pune

  // Police Stations
  TPS:  [18.7326644, 73.6740344], // Talegaon Police Station
  DRPS: [18.6862715, 73.7218504], // Dehu Road Police Station
  SPPS: [18.696683, 73.6584713],  // Shirgao Parandwadi Police Station

  // Hospitals
  HSH:  [18.7332993, 73.6648639], // Harneshwar Multispeciality
  PMH:  [18.7030595, 73.6853591], // Pawana Multispeciality
  PH:   [18.7041471, 73.685618],  // Pioneer Hospital

  // Fire Stations
  TFS:  [18.7704619, 73.6890362], // Talegaon MIDC Fire Station
  PFS:  [18.7279734, 73.6540415], // Prapose Fire Station Baner

  // Army / NDRF
  OMH:  [18.6911752, 73.7141367], // Old Military Hospital
  NDF:  [18.7698037, 73.7617749], // 5 Bn NDRF

  // Incident Zones (Markets, Junctions, Populated Areas, Rivers)
  SOM:  [18.705, 73.690],         // Somatane Phata
  VAD:  [18.7414015, 73.6345233], // Vadgaon Maval
  TSM:  [18.725, 73.680],         // Talegaon Station Market
  CHK:  [18.7671, 73.8751],       // Chakan Industrial Area
  NGD:  [18.6500, 73.7667],       // Nigdi
  RVR:  [18.718, 73.700]          // Indrayani River
};

// Node metadata for markers
const NODE_META = {
  IIIT: { kind: "landmark", color: "#8e44ad", label: "★", name: "IIIT Pune" },
  TPS:  { kind: "police",   color: "#2980b9", label: "P", name: "Talegaon Police" },
  DRPS: { kind: "police",   color: "#2980b9", label: "P", name: "Dehu Road Police" },
  SPPS: { kind: "police",   color: "#2980b9", label: "P", name: "Shirgao Police" },
  HSH:  { kind: "hospital", color: "#e74c3c", label: "H", name: "Harneshwar Hospital" },
  PMH:  { kind: "hospital", color: "#e74c3c", label: "H", name: "Pawana Hospital" },
  PH:   { kind: "hospital", color: "#e74c3c", label: "H", name: "Pioneer Hospital" },
  TFS:  { kind: "fire",     color: "#e67e22", label: "F", name: "Talegaon Fire Station" },
  PFS:  { kind: "fire",     color: "#e67e22", label: "F", name: "Baner Fire Station" },
  OMH:  { kind: "ndrf",     color: "#27ae60", label: "M", name: "Old Military Hospital" },
  NDF:  { kind: "ndrf",     color: "#27ae60", label: "N", name: "5 Bn NDRF" },
  SOM:  { kind: "signal",   color: "#7f8c8d", label: "◉", name: "Somatane Phata" },
  VAD:  { kind: "signal",   color: "#7f8c8d", label: "◉", name: "Vadgaon Maval" },
  TSM:  { kind: "signal",   color: "#7f8c8d", label: "◉", name: "Talegaon Market" },
  CHK:  { kind: "signal",   color: "#7f8c8d", label: "◉", name: "Chakan Ind Area" },
  NGD:  { kind: "signal",   color: "#7f8c8d", label: "◉", name: "Nigdi" },
  RVR:  { kind: "signal",   color: "#7f8c8d", label: "◉", name: "Indrayani River" }
};

const VEHICLE_ICONS = { ambulance: "🚑", fire_truck: "🚒", police: "🚔" };
const VEHICLE_COLORS = { ambulance: "#c0392b", fire_truck: "#e67e22", police: "#2980b9" };

// ── DOM refs ──────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ── Clock ─────────────────────────────────────────────────────────────────
setInterval(() => $("clock").textContent = new Date().toLocaleTimeString("en-IN", { hour12: false }), 1000);
$("clock").textContent = new Date().toLocaleTimeString("en-IN", { hour12: false });

// ══════════════════════════════════════════════════════════════════════════
// LEAFLET MAP SETUP
// ══════════════════════════════════════════════════════════════════════════

const lmap = L.map("leafletMap", {
  center: [18.710, 73.838],
  zoom: 12,
  zoomControl: false
});

// OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 18
}).addTo(lmap);

L.control.zoom({ position: "bottomright" }).addTo(lmap);

// ── Node markers ──────────────────────────────────────────────────────────
function makeNodeIcon(nodeId) {
  const m = NODE_META[nodeId] || { color: "#7f8c8d", label: "●" };
  return L.divIcon({
    html: `<div style="
      width:26px;height:26px;
      background:${m.color};
      border:2px solid rgba(255,255,255,0.9);
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      color:white;font-size:11px;font-weight:700;font-family:Inter,sans-serif;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
    ">${m.label}</div>`,
    className: "", iconSize: [26, 26], iconAnchor: [13, 13], tooltipAnchor: [14, 0]
  });
}

const nodeMarkers = {};
for (const [id, coords] of Object.entries(GEO)) {
  const meta = NODE_META[id];
  nodeMarkers[id] = L.marker(coords, { icon: makeNodeIcon(id), zIndexOffset: 100 })
    .addTo(lmap)
    .bindTooltip(`<strong>${meta?.name || id}</strong>`, { direction: "right", className: "node-tooltip" });
}

// ── Vehicle marker ────────────────────────────────────────────────────────
function makeVehicleIcon(type) {
  const emoji = VEHICLE_ICONS[type] || "🚨";
  const color = VEHICLE_COLORS[type] || "#c0392b";
  return L.divIcon({
    html: `<div style="
      width:36px;height:36px;
      background:${color};
      border:2.5px solid white;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:18px;
      box-shadow:0 0 12px ${color}99, 0 2px 8px rgba(0,0,0,0.4);
    ">${emoji}</div>`,
    className: "", iconSize: [36, 36], iconAnchor: [18, 18]
  });
}

let vehicleMarker = L.marker(GEO.IIIT || Object.values(GEO)[0], {
  icon: makeVehicleIcon("ambulance"),
  zIndexOffset: 1000
}).addTo(lmap).bindTooltip("Emergency Vehicle", { permanent: false });

// ── Polyline layers ───────────────────────────────────────────────────────
const edgeLines = {};          // edgeId → L.polyline (traffic heatmap)
const altRouteLine = L.polyline([], {
  color: "#95a5a6", weight: 3, opacity: 0.8, dashArray: "5, 8"
}).addTo(lmap);
const routeLine = L.polyline([], {
  color: "#c0392b", weight: 6, opacity: 0.9,
  lineCap: "round", lineJoin: "round",
  dashArray: null
}).addTo(lmap);

const prevRouteLine = L.polyline([], {
  color: "#7f8c8d", weight: 3, opacity: 0.5, dashArray: "8 6"
}).addTo(lmap);

// Signal preemption rings
const signalRings = {};

// ── OSRM road geometry cache ──────────────────────────────────────────────
// Cache maps "LAT1,LNG1→LAT2,LNG2" → array of [lat,lng] waypoints
const roadGeomCache = {};

async function getRoadGeometry(fromId, toId) {
  const key = `${fromId}-${toId}`;
  const revKey = `${toId}-${fromId}`;
  if (roadGeomCache[key]) return roadGeomCache[key];
  if (roadGeomCache[revKey]) return [...roadGeomCache[revKey]].reverse();

  const a = GEO[fromId], b = GEO[toId];
  if (!a || !b) return null;

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    if (data.code === "Ok" && data.routes?.[0]) {
      const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      roadGeomCache[key] = coords;
      return coords;
    }
  } catch { /* fallback */ }

  // Fallback: straight line between real GPS coords
  const fallback = [a, b];
  roadGeomCache[key] = fallback;
  return fallback;
}

// ── Pre-fetch road geometries for all edges ───────────────────────────────
// Called once on first state load. Edges come from simulation state.
let geomFetchDone = false;
async function prefetchGeometries(edges) {
  if (geomFetchDone) return;
  geomFetchDone = true;
  $("osrmBadge").textContent = "⏳ Fetching Roads…";
  $("osrmBadge").style.color = "#f39c12";

  let i = 0;
  for (const edge of edges) {
    if (!GEO[edge.from] || !GEO[edge.to]) continue;
    await getRoadGeometry(edge.from, edge.to);
    i++;
    // small throttle to respect OSRM rate limits
    if (i % 3 === 0) await new Promise(r => setTimeout(r, 200));
  }

  $("osrmBadge").textContent = "● Routing Engine";
  $("osrmBadge").style.color = "#5dcc8a";
}

// ── Interpolate position along a polyline at fraction t (0→1) ─────────────
function lerpAlongPath(points, t) {
  if (!points || points.length === 0) return null;
  if (points.length === 1 || t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];

  let totalLen = 0;
  const segs = [];
  for (let i = 1; i < points.length; i++) {
    const dy = points[i][0] - points[i - 1][0];
    const dx = points[i][1] - points[i - 1][1];
    const len = Math.sqrt(dx * dx + dy * dy);
    segs.push(len);
    totalLen += len;
  }

  let target = t * totalLen;
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i]) {
      const frac = segs[i] > 0 ? target / segs[i] : 0;
      return [
        points[i][0] + (points[i + 1][0] - points[i][0]) * frac,
        points[i][1] + (points[i + 1][1] - points[i][1]) * frac
      ];
    }
    target -= segs[i];
  }
  return points[points.length - 1];
}

// ══════════════════════════════════════════════════════════════════════════
// MAP RENDERING — called on every SSE tick
// ══════════════════════════════════════════════════════════════════════════

async function renderMap(state) {
  const v = state.vehicle;
  const activeEdgeSet   = new Set(v.route.edgeIds);
  const signalActiveSet = new Set(Object.keys(state.signalPlan));

  // ── 1. Draw / update edge polylines (traffic heatmap) ─────────────────
  for (const edge of state.edges) {
    const geom = roadGeomCache[`${edge.from}-${edge.to}`]
               || roadGeomCache[`${edge.to}-${edge.from}`];
    if (!geom) continue; // not fetched yet

    const isActive = activeEdgeSet.has(edge.id);
    const cong     = edge.congestion;
    let color = cong > 0.72 ? "#c0392b" : cong > 0.50 ? "#e67e22" : "#27ae60";
    const weight = isActive ? 0 : 3; // hide base edge if route covers it

    if (!edgeLines[edge.id]) {
      edgeLines[edge.id] = L.polyline(geom, { color, weight, opacity: 0.55 }).addTo(lmap);
    } else {
      edgeLines[edge.id].setLatLngs(geom);
      edgeLines[edge.id].setStyle({ color, weight, opacity: isActive ? 0 : 0.55 });
    }
  }

  // ── 1.5 Draw alternative route polyline (dashed grey) ────────────────
  if (v.alternativeRoute?.path?.length >= 2) {
    const altRoutePoints = [];
    const altPath = v.alternativeRoute.path;
    for (let i = 0; i < altPath.length - 1; i++) {
      const seg = roadGeomCache[`${altPath[i]}-${altPath[i + 1]}`]
               || roadGeomCache[`${altPath[i + 1]}-${altPath[i]}`]
               || [GEO[altPath[i]], GEO[altPath[i + 1]]].filter(Boolean);
      if (i === 0) altRoutePoints.push(...seg);
      else altRoutePoints.push(...seg.slice(1));
    }
    altRouteLine.setLatLngs(altRoutePoints);
  } else {
    altRouteLine.setLatLngs([]);
  }

  // ── 2. Draw active route polyline ────────────────────────────────────
  const routePath = v.route.path;
  if (routePath.length >= 2) {
    // Stitch road geometries for each consecutive pair
    const routePoints = [];
    for (let i = 0; i < routePath.length - 1; i++) {
      const seg = roadGeomCache[`${routePath[i]}-${routePath[i + 1]}`]
               || roadGeomCache[`${routePath[i + 1]}-${routePath[i]}`]
               || [GEO[routePath[i]], GEO[routePath[i + 1]]].filter(Boolean);
      if (i === 0) routePoints.push(...seg);
      else routePoints.push(...seg.slice(1)); // avoid duplicate junction point
    }
    routeLine.setLatLngs(routePoints);
    routeLine.setStyle({ color: VEHICLE_COLORS[v.type] || "#c0392b" });
  } else {
    routeLine.setLatLngs([]);
  }

  // ── 2.5 Dynamic node visibility ───────────────────────────────────────
  // Hide emergency nodes unless they are the origin of the active dispatch
  for (const [id, marker] of Object.entries(nodeMarkers)) {
    const meta = NODE_META[id];
    // always show landmarks and incident/signal zones
    if (meta.kind === "landmark" || meta.kind === "signal") {
      marker.setOpacity(1);
    } else {
      // It's an emergency service (hospital, police, fire, ndrf)
      // Only show if it is the starting point of the current route
      if (v.start === id && v.status !== "arrived") {
        marker.setOpacity(1);
      } else {
        marker.setOpacity(0);
      }
    }
  }

  // ── 3. Vehicle position along active route ────────────────────────────
  const curNodeId  = v.currentNode;
  const nextNodeId = v.route.path[1];
  let vLatLng = GEO[curNodeId] || Object.values(GEO)[0];

  if (nextNodeId && v.status !== "arrived") {
    const seg = roadGeomCache[`${curNodeId}-${nextNodeId}`]
             || roadGeomCache[`${nextNodeId}-${curNodeId}`]?.slice().reverse();
    if (seg && seg.length >= 2) {
      const pt = lerpAlongPath(seg, v.progress);
      if (pt) vLatLng = pt;
    } else {
      // Straight-line fallback (before OSRM loaded)
      const a = GEO[curNodeId], b = GEO[nextNodeId];
      if (a && b) vLatLng = [a[0] + (b[0] - a[0]) * v.progress, a[1] + (b[1] - a[1]) * v.progress];
    }
  }

  vehicleMarker.setLatLng(vLatLng);

  // Update vehicle icon if type changed
  const newIcon = makeVehicleIcon(v.type);
  vehicleMarker.setIcon(newIcon);
  vehicleMarker.setTooltipContent(`${VEHICLE_ICONS[v.type] || "🚨"} ${v.id} — ${v.label}`);

  // ── 4. Signal preemption rings ────────────────────────────────────────
  // Remove old rings
  for (const [id, ring] of Object.entries(signalRings)) {
    if (!signalActiveSet.has(id)) { lmap.removeLayer(ring); delete signalRings[id]; }
  }
  // Add new rings
  for (const nodeId of signalActiveSet) {
    const coords = GEO[nodeId];
    if (!coords) continue;
    if (!signalRings[nodeId]) {
      signalRings[nodeId] = L.circleMarker(coords, {
        radius: 18, color: "#27ae60", weight: 2.5, fill: false, opacity: 0.8, dashArray: "4 3"
      }).addTo(lmap);
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════
// SIDEBAR / STATS PANEL RENDERING
// ══════════════════════════════════════════════════════════════════════════

function renderPanels(state) {
  const m = state.metrics;
  const v = state.vehicle;

  // Lookup node name helper
  const nodeName = id => state.nodes.find(n => n.id === id)?.name || id;

  // Stats bar
  $("statVehicleIcon").textContent = VEHICLE_ICONS[v.type] || "🚨";
  $("statVehicleId").textContent   = v.id;
  $("statIncidentLabel").textContent = state.activeIncident?.label || "Active emergency";
  $("statEta").textContent          = m.optimizedEta.toFixed(1);
  $("statSaved").textContent        = m.savedMinutes.toFixed(1);
  $("statSignals").textContent      = m.activeSignals;
  $("statTraffic").textContent      = Math.round(m.meanCongestion * 100) + "% avg traffic";
  $("statReroutes").textContent     = v.reroutes;
  $("statDispatches").textContent   = m.totalDispatches;

  // Incident tag and Location
  const incStr = state.activeIncident?.label || "Active emergency";
  $("incidentTag").textContent = incStr;
  $("incidentLocation").textContent = state.activeIncident ? (incStr.split(" at ")[1] || "Incident Site") : "Simulation Area";
  $("tickBadge").textContent   = "T+" + state.tick;

  // Route crumb
  if (v.status === "arrived") {
    $("routeCrumb").textContent = `✓ Arrived — ${nodeName(v.destination)}`;
  } else if (v.route.path.length) {
    $("routeCrumb").textContent =
      `${nodeName(v.start)} → ${nodeName(v.destination)}  ·  ${m.routeDistance} km  ·  ETA ${m.optimizedEta.toFixed(1)} min`;
  }

  // Sidebar mission
  $("mVehicleId").textContent = v.id;
  $("mStatus").textContent    = v.status === "arrived" ? "✓ Arrived" : "⟳ En-route";
  $("mStatus").style.color    = v.status === "arrived" ? "#27ae60" : "#1b2a4a";
  $("mOrigin").textContent    = nodeName(v.start);
  $("mDest").textContent      = nodeName(v.destination);
  $("mEta").textContent       = m.optimizedEta.toFixed(1) + " min";
  $("mDist").textContent      = m.routeDistance + " km";
  $("mReroutes").textContent  = v.reroutes;

  // Signal plan
  const entries = Object.entries(state.signalPlan);
  if (!entries.length) {
    $("signalPlan").innerHTML = `<div class="signal-none">No active signal preemption</div>`;
  } else {
    $("signalPlan").innerHTML = entries.slice(0, 4).map(([nodeId, plan]) => {
      const name = nodeName(nodeId);
      const cls  = plan.mode === "preemptive" ? "preemptive" : "adaptive";
      return `<div class="signal-row">
        <div class="signal-row-hd"><strong>${name}</strong><span class="sig-badge ${cls}">${plan.mode}</span></div>
        <div class="signal-row-detail">Opens in ${plan.arrivalInSec}s · Green for ${plan.greenWindowSec}s</div>
      </div>`;
    }).join("");
  }

  // Congestion bars
  const top = [...state.edges].sort((a, b) => b.predictedCongestion - a.predictedCongestion).slice(0, 10);
  const congColor = v => v > 0.72 ? "#c0392b" : v > 0.50 ? "#e67e22" : "#27ae60";
  $("congestionBars").innerHTML = top.map(edge => {
    const pct  = Math.round(edge.predictedCongestion * 100);
    const col  = congColor(edge.predictedCongestion);
    const fn   = state.nodes.find(n => n.id === edge.from);
    const tn   = state.nodes.find(n => n.id === edge.to);
    const name = fn && tn ? fn.name.split(" ")[0] + "–" + tn.name.split(" ")[0] : edge.id;
    return `<div class="cs-bar-item">
      <span class="cs-bar-name">${name}</span>
      <div class="cs-bar-track"><div class="cs-bar-fill" style="width:${pct}%;background:${col}"></div></div>
      <span class="cs-bar-pct" style="color:${col}">${pct}%</span>
    </div>`;
  }).join("");

  // Event log ticker
  $("navTicker").innerHTML = state.events.map((ev, i) => {
    return `<span class="nav-ticker-item ${i === 0 ? 'latest' : ''}">${ev.time} — ${ev.message}</span>
            <span class="nav-ticker-sep">•</span>`;
  }).join("");
}

// ── Master render ─────────────────────────────────────────────────────────
let lastState = null;
let firstRender = true;

function render(state) {
  lastState = state;

  // On first render, prefetch all OSRM road geometries
  if (firstRender) {
    firstRender = false;
    prefetchGeometries(state.edges);
  }

  renderPanels(state);
  renderMap(state); // async, non-blocking
}

// ── Dispatch ──────────────────────────────────────────────────────────────
let currentType = "ambulance";

async function doDispatch() {
  $("dispatchBtn").disabled = true;
  $("dispatchBtn").textContent = "Dispatching…";
  try {
    const res = await fetch("/api/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: currentType })
    });
    render(await res.json());
  } finally {
    $("dispatchBtn").disabled = false;
    $("dispatchBtn").textContent = "Dispatch Emergency Vehicle";
  }
}

document.querySelectorAll(".vtype-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".vtype-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentType = btn.dataset.type;
    doDispatch();
  });
});

$("dispatchBtn").addEventListener("click", doDispatch);

// ── SSE stream ────────────────────────────────────────────────────────────
const stream = new EventSource("/api/events");
stream.addEventListener("message", e => render(JSON.parse(e.data)));
stream.addEventListener("error", async () => {
  if (!lastState) {
    try { render(await (await fetch("/api/state")).json()); } catch { /* ignore */ }
  }
});

// Initial state
(async () => {
  try { render(await (await fetch("/api/state")).json()); } catch { /* from SSE */ }
})();
