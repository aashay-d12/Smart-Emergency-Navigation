"use strict";

// ─── Priority config ────────────────────────────────────────────────────────
const VEHICLE_PRIORITY = {
  ambulance:  { level: 3, color: "#ff3366", signalBoost: 0.58, label: "Ambulance",  icon: "🚑", accentColor: "#ff3366" },
  fire_truck: { level: 2, color: "#ff7722", signalBoost: 0.44, label: "Fire Truck", icon: "🚒", accentColor: "#ff7722" },
  police:     { level: 1, color: "#4488ff", signalBoost: 0.30, label: "Police",     icon: "🚔", accentColor: "#4488ff" }
};

// ─── Incident types ─────────────────────────────────────────────────────────
const INCIDENT_TYPES = {
  medical:  { label: "Medical Emergency",  badge: "MED",  color: "#ff3366" },
  fire:     { label: "Fire Emergency",     badge: "FIRE", color: "#ff7722" },
  security: { label: "Security Incident",  badge: "SEC",  color: "#4488ff" }
};

// ─── Real nodes — IIIT Pune / Talegaon Dabhade area ────────────────────────
// SVG viewBox: 0 0 1000 520
// Positions based on Google Maps screenshot provided by user
const nodes = {
  IIIT: { id: "IIIT", name: "IIIT Pune", kind: "landmark", fullName: "Indian Institute of Information Technology" },
  TPS:  { id: "TPS",  name: "Talegaon Police", kind: "police", fullName: "Talegaon Police Station" },
  DRPS: { id: "DRPS", name: "Dehu Road Police", kind: "police", fullName: "Dehu Road Police Station" },
  SPPS: { id: "SPPS", name: "Shirgao Police", kind: "police", fullName: "Shirgao Parandwadi Police Station" },
  HSH:  { id: "HSH",  name: "Harneshwar Hospital", kind: "hospital", fullName: "Harneshwar Multispeciality" },
  PMH:  { id: "PMH",  name: "Pawana Hospital", kind: "hospital", fullName: "Pawana Multispeciality Hospital" },
  PH:   { id: "PH",   name: "Pioneer Hospital", kind: "hospital", fullName: "Pioneer Hospital" },
  TFS:  { id: "TFS",  name: "Talegaon Fire Stn", kind: "fire", fullName: "Talegaon MIDC Fire Station" },
  PFS:  { id: "PFS",  name: "Baner Fire Stn", kind: "fire", fullName: "Prapose Fire Station Baner" },
  OMH:  { id: "OMH",  name: "Old Military Hospital", kind: "ndrf", fullName: "Old Military Hospital" },
  NDF:  { id: "NDF",  name: "5 Bn NDRF", kind: "ndrf", fullName: "5 Bn NDRF" },
  SOM:  { id: "SOM",  name: "Somatane Phata", kind: "signal", fullName: "Somatane Phata Junction" },
  VAD:  { id: "VAD",  name: "Vadgaon Maval", kind: "signal", fullName: "Vadgaon Maval" },
  TSM:  { id: "TSM",  name: "Talegaon Market", kind: "signal", fullName: "Talegaon Station Market" },
  CHK:  { id: "CHK",  name: "Chakan Ind Area", kind: "signal", fullName: "Chakan Industrial Area" },
  NGD:  { id: "NGD",  name: "Nigdi", kind: "signal", fullName: "Nigdi" },
  RVR:  { id: "RVR",  name: "Indrayani River", kind: "signal", fullName: "Indrayani River" }
};

// ─── Edge specs: [from, to, distanceKm, baseCongestion] ────────────────────
const edgeSpecs = [
  ["IIIT", "TFS",  2.1, 0.25],
  ["IIIT", "TPS",  3.5, 0.40],
  ["IIIT", "NDF",  8.2, 0.35],
  ["TFS",  "TPS",  4.6, 0.30],
  ["TPS",  "HSH",  1.5, 0.50],
  ["TPS",  "TSM",  2.2, 0.55],
  ["HSH",  "PFS",  2.8, 0.42],
  ["PFS",  "VAD",  3.1, 0.35],
  ["VAD",  "HSH",  4.0, 0.38],
  ["TSM",  "PMH",  3.0, 0.60],
  ["PMH",  "PH",   0.8, 0.45],
  ["PH",   "SOM",  1.5, 0.55],
  ["SOM",  "OMH",  5.2, 0.40],
  ["OMH",  "DRPS", 1.2, 0.50],
  ["SOM",  "SPPS", 4.1, 0.35],
  ["SPPS", "PFS",  6.5, 0.30],
  ["NDF",  "DRPS", 12.5, 0.45],
  ["NDF",  "CHK",  6.1, 0.60],
  ["DRPS", "NGD",  4.5, 0.55],
  ["SOM",  "NGD",  8.0, 0.65],
  ["TSM",  "RVR",  3.5, 0.25],
  ["RVR",  "IIIT", 4.2, 0.30]
];

// ─── Scenario definitions ───────────────────────────────────────────────────
const DISPATCH_ORIGINS = {
  ambulance:  ["HSH", "PMH", "PH"],
  fire_truck: ["TFS", "PFS"],
  police:     ["TPS", "DRPS", "SPPS"]
};

const INCIDENT_SITES = [
  { id: "IIIT", type: "medical",  label: "Accident at IIIT Pune" },
  { id: "TSM",  type: "fire",     label: "Fire at Talegaon Market" },
  { id: "CHK",  type: "security", label: "Theft at Chakan Industrial Area" },
  { id: "NGD",  type: "fire",     label: "Blast at Nigdi" },
  { id: "RVR",  type: "medical",  label: "Drowning in Indrayani River" },
  { id: "SOM",  type: "medical",  label: "Collision at Somatane Phata" },
  { id: "VAD",  type: "fire",     label: "Fire at Vadgaon Maval" }
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function makeEdges() {
  return edgeSpecs.map(([from, to, distance, baseCongestion], i) => ({
    id: `${from}-${to}`,
    from, to, distance, baseCongestion,
    congestion: baseCongestion,
    predictedCongestion: baseCongestion,
    hazard: i === 5 ? "fog" : i === 13 ? "accident-risk" : null,
    history: Array.from({ length: 8 }, (_, k) =>
      clamp(baseCongestion + Math.sin(k) * 0.05, 0.05, 0.95))
  }));
}

function buildAdjacency(edges) {
  const graph = {};
  for (const id of Object.keys(nodes)) graph[id] = [];
  for (const edge of edges) {
    graph[edge.from].push({ ...edge, other: edge.to });
    graph[edge.to].push({ ...edge, other: edge.from });
  }
  return graph;
}

function linearRegressionPredict(values, horizon = 3) {
  const n = values.length;
  if (!n) return 0;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let x = 0; x < n; x++) { num += (x - meanX) * (values[x] - meanY); den += (x - meanX) ** 2; }
  const slope = den === 0 ? 0 : num / den;
  return clamp(values[n - 1] + slope * horizon, 0.03, 0.98);
}

function estimateEdgeMinutes(edge, vehicleType = "ambulance", predictive = true) {
  const p = VEHICLE_PRIORITY[vehicleType] || VEHICLE_PRIORITY.ambulance;
  const cong = predictive ? edge.predictedCongestion : edge.congestion;
  const hazardPenalty = edge.hazard === "fog" ? 0.22 : edge.hazard === "accident-risk" ? 0.35 : edge.hazard ? 0.28 : 0;
  const trafficPenalty = cong * (1.65 - p.signalBoost);
  const signalWait = Math.max(0.08, 0.45 - p.signalBoost);
  return edge.distance * (1 + trafficPenalty + hazardPenalty) + signalWait;
}

function dijkstra(edges, start, destination, vehicleType = "ambulance", predictive = true) {
  const graph = buildAdjacency(edges);
  const dist = {};
  const prev = {};
  const unvisited = new Set(Object.keys(nodes));
  for (const id of unvisited) dist[id] = Infinity;
  dist[start] = 0;
  while (unvisited.size) {
    let current = null;
    for (const id of unvisited) if (current === null || dist[id] < dist[current]) current = id;
    if (!current || dist[current] === Infinity || current === destination) break;
    unvisited.delete(current);
    for (const edge of graph[current]) {
      if (!unvisited.has(edge.other)) continue;
      const candidate = dist[current] + estimateEdgeMinutes(edge, vehicleType, predictive);
      if (candidate < dist[edge.other]) { dist[edge.other] = candidate; prev[edge.other] = { node: current, edgeId: edge.id }; }
    }
  }
  const path = [], edgeIds = [];
  let cursor = destination;
  if (!prev[cursor] && cursor !== start) return { path: [], edgeIds: [], etaMinutes: Infinity };
  while (cursor) { path.unshift(cursor); if (cursor === start) break; edgeIds.unshift(prev[cursor].edgeId); cursor = prev[cursor].node; }
  return { path, edgeIds, etaMinutes: Number(dist[destination].toFixed(2)) };
}

function routeDistance(edges, edgeIds) {
  return edgeIds.reduce((s, id) => s + (edges.find(e => e.id === id)?.distance || 0), 0);
}

function remainingRouteEta(edges, route, progress, vehicleType) {
  return route.edgeIds.reduce((s, id, idx) => {
    const edge = edges.find(e => e.id === id);
    return s + estimateEdgeMinutes(edge, vehicleType, true) * (idx === 0 ? 1 - progress : 1);
  }, 0);
}

function makeSignalPlan(route, tick, vehicleType, edges) {
  const p = VEHICLE_PRIORITY[vehicleType] || VEHICLE_PRIORITY.ambulance;
  let minutes = 0;
  const plan = {};
  for (const edgeId of route.edgeIds) {
    const edge = edges.find(e => e.id === edgeId);
    minutes += estimateEdgeMinutes(edge, vehicleType, true);
    const nextNode = route.path[route.edgeIds.indexOf(edgeId) + 1];
    if (nodes[nextNode]?.kind === "signal") {
      plan[nextNode] = {
        arrivalInSec: Math.max(2, Math.round(minutes * 6)),
        greenWindowSec: 12 + p.level * 5,
        mode: p.level === 3 ? "preemptive" : "adaptive",
        opensAtTick: tick + Math.max(2, Math.round(minutes * 6))
      };
    }
  }
  return plan;
}

// ─── Simulation class ────────────────────────────────────────────────────────
class SmartCitySimulation {
  constructor() {
    this.edges = makeEdges();
    this.tick = 0;
    this.eventLog = [];
    this.totalDispatches = 0;
    this.activeIncident = INCIDENT_SITES[0];
    this._initVehicle("ambulance", "HSH", "IIIT");
  }

  _initVehicle(type, start, destination) {
    const priority = VEHICLE_PRIORITY[type] || VEHICLE_PRIORITY.ambulance;
    this.vehicle = {
      id: `EV-${100 + Math.floor(Math.random() * 900)}`,
      type, start, destination,
      currentNode: start, progress: 0,
      route: dijkstra(this.edges, start, destination, type, true),
      previousRoute: null,
      reroutes: 0, status: "enroute", arrivedAtTick: null,
      incidentType: this.activeIncident?.type || "medical"
    };
    this.baselineRoute = dijkstra(this.edges, start, destination, type, false);
    
    // Compute alternative route by heavily penalizing the chosen route
    const penalizedEdges = this.edges.map(e => ({
      ...e,
      distance: this.vehicle.route.edgeIds.includes(e.id) ? e.distance * 3 : e.distance
    }));
    this.vehicle.alternativeRoute = dijkstra(penalizedEdges, start, destination, type, true);

    this.signalPlan = makeSignalPlan(this.vehicle.route, this.tick, type, this.edges);
    this.totalDispatches++;
    this.addEvent(`${priority.label} ${this.vehicle.id} dispatched → ${nodes[destination]?.name || destination}`);
  }

  addEvent(message) {
    this.eventLog.unshift({ tick: this.tick, time: new Date().toLocaleTimeString("en-IN", { hour12: false }), message });
    this.eventLog = this.eventLog.slice(0, 10);
  }

  updateTraffic() {
    for (const edge of this.edges) {
      const wave = Math.sin((this.tick + edge.id.charCodeAt(0)) / 9) * 0.09;
      const incidentPulse = (edge.id === "TPS-HSH" || edge.id === "TSM-PMH") && this.tick > 8 && this.tick < 55 ? 0.25 : 0;
      const recovery = edge.id === "IIIT-TPS" && this.tick > 32 ? -0.14 : 0;
      edge.congestion = clamp(edge.baseCongestion + wave + incidentPulse + recovery, 0.05, 0.96);
      edge.history.push(edge.congestion);
      edge.history = edge.history.slice(-14);
      edge.predictedCongestion = linearRegressionPredict(edge.history, 4);
      if (edge.id === "TPS-HSH" && incidentPulse > 0) edge.hazard = "accident-risk";
      if (edge.id === "IIIT-TPS" && this.tick > 32) edge.hazard = null;
    }
  }

  maybeReroute() {
    if (this.vehicle.status === "arrived") return;
    const current = this.vehicle.currentNode;
    const predictive = dijkstra(this.edges, current, this.vehicle.destination, this.vehicle.type, true);
    const curr = this.vehicle.route;
    if (!predictive.path.length) return;
    const changed = predictive.edgeIds.join(",") !== curr.edgeIds.join(",");
    const gain = curr.etaMinutes - predictive.etaMinutes;
    if (changed && gain > 0.25) {
      this.vehicle.previousRoute = curr;
      this.vehicle.route = predictive;
      this.vehicle.progress = 0;
      this.vehicle.reroutes++;
      
      // Recompute alternative
      const penalizedEdges = this.edges.map(e => ({
        ...e,
        distance: predictive.edgeIds.includes(e.id) ? e.distance * 3 : e.distance
      }));
      this.vehicle.alternativeRoute = dijkstra(penalizedEdges, current, this.vehicle.destination, this.vehicle.type, true);

      this.signalPlan = makeSignalPlan(predictive, this.tick, this.vehicle.type, this.edges);
      this.addEvent(`AI reroute → ${predictive.path.join(" → ")} (saves ${gain.toFixed(1)} min)`);
    }
  }

  moveVehicle() {
    const v = this.vehicle;
    if (v.status === "arrived" || v.route.path.length < 2) return;
    const edgeId = v.route.edgeIds[0];
    const edge = this.edges.find(e => e.id === edgeId);
    const speedBoost = 0.12 + (VEHICLE_PRIORITY[v.type]?.level || 1) * 0.014;
    const trafficDrag = edge.congestion * 0.048;
    v.progress = clamp(v.progress + speedBoost - trafficDrag, 0, 1);
    if (v.progress >= 1) {
      v.currentNode = v.route.path[1];
      v.route.path.shift(); v.route.edgeIds.shift(); v.progress = 0;
      if (v.currentNode === v.destination) {
        v.status = "arrived"; v.arrivedAtTick = this.tick;
        this.addEvent(`✓ ${v.id} arrived at ${nodes[v.destination]?.name || v.destination}`);
      } else if (nodes[v.currentNode]?.kind === "signal") {
        this.addEvent(`Signal cleared at ${nodes[v.currentNode].name}`);
      }
    }
  }

  step() {
    this.tick++;
    this.updateTraffic();
    if (this.vehicle.status === "arrived" && this.tick - this.vehicle.arrivedAtTick > 5) {
      const incident = INCIDENT_SITES[this.tick % INCIDENT_SITES.length];
      this.activeIncident = incident;
      const origins = DISPATCH_ORIGINS[this.vehicle.type];
      const origin = origins[this.tick % origins.length];
      this.addEvent(`New incident: ${incident.label}`);
      this._initVehicle(this.vehicle.type, origin, incident.id);
    }
    this.maybeReroute();
    this.moveVehicle();
    if (this.tick % 12 === 0 && this.vehicle.status !== "arrived") {
      this.signalPlan = makeSignalPlan(this.vehicle.route, this.tick, this.vehicle.type, this.edges);
    }
    return this.getState();
  }

  requestEmergency({ start, destination } = {}) {
    const incident = INCIDENT_SITES[Math.floor(Math.random() * INCIDENT_SITES.length)];
    this.activeIncident = incident;
    const type = incident.type === "medical" ? "ambulance" : incident.type === "fire" ? "fire_truck" : "police";
    const origins = DISPATCH_ORIGINS[type] || DISPATCH_ORIGINS.ambulance;
    const origin = start && nodes[start] ? start : origins[Math.floor(Math.random() * origins.length)];
    const dest = destination && nodes[destination] ? destination : incident.id;
    this.addEvent(`DISPATCH: ${incident.label}`);
    this._initVehicle(type, origin, dest);
    return this.getState();
  }

  vehiclePosition() {
    const v = this.vehicle;
    const current = nodes[v.currentNode];
    const nextId = v.route.path[1];
    if (!nextId) return { x: current.x, y: current.y };
    const next = nodes[nextId];
    return { x: current.x + (next.x - current.x) * v.progress, y: current.y + (next.y - current.y) * v.progress };
  }

  getState() {
    const optEta = this.vehicle.status === "arrived" ? 0
      : remainingRouteEta(this.edges, this.vehicle.route, this.vehicle.progress, this.vehicle.type);
    const basEta = this.baselineRoute.etaMinutes === Infinity ? optEta : this.baselineRoute.etaMinutes;
    const saved = Math.max(0, basEta - optEta);
    const prio = VEHICLE_PRIORITY[this.vehicle.type] || VEHICLE_PRIORITY.ambulance;
    return {
      tick: this.tick,
      nodes: Object.values(nodes),
      edges: this.edges.map(e => ({ ...e, congestion: +e.congestion.toFixed(2), predictedCongestion: +e.predictedCongestion.toFixed(2) })),
      vehicle: {
        ...this.vehicle,
        position: this.vehiclePosition(),
        label: prio.label,
        color: prio.color,
        accentColor: prio.accentColor,
        incidentType: this.vehicle.incidentType,
        incidentLabel: INCIDENT_TYPES[this.vehicle.incidentType]?.label || ""
      },
      signalPlan: this.signalPlan,
      activeIncident: this.activeIncident,
      incidentSites: INCIDENT_SITES,
      dispatchOrigins: DISPATCH_ORIGINS,
      metrics: {
        optimizedEta: +optEta.toFixed(2),
        baselineEta: +basEta.toFixed(2),
        savedMinutes: +saved.toFixed(2),
        routeDistance: +routeDistance(this.edges, this.vehicle.route.edgeIds).toFixed(1),
        activeSignals: Object.keys(this.signalPlan).length,
        meanCongestion: +(this.edges.reduce((s, e) => s + e.congestion, 0) / this.edges.length).toFixed(2),
        totalDispatches: this.totalDispatches
      },
      events: this.eventLog,
      priorityModel: VEHICLE_PRIORITY,
      incidentTypes: INCIDENT_TYPES
    };
  }
}

module.exports = { SmartCitySimulation, VEHICLE_PRIORITY, dijkstra, estimateEdgeMinutes, linearRegressionPredict, remainingRouteEta, makeEdges, nodes, INCIDENT_SITES, DISPATCH_ORIGINS };
