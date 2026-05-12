const assert = require("assert");
const {
  SmartCitySimulation,
  dijkstra,
  estimateEdgeMinutes,
  linearRegressionPredict,
  makeEdges,
  remainingRouteEta
} = require("../src/simulation");

function testPredictionTrend() {
  const rising = linearRegressionPredict([0.2, 0.25, 0.33, 0.42, 0.51], 3);
  const falling = linearRegressionPredict([0.7, 0.62, 0.54, 0.45, 0.36], 3);
  assert(rising > 0.51, "rising congestion should forecast higher traffic");
  assert(falling < 0.36, "falling congestion should forecast lower traffic");
}

function testPriorityImprovesEta() {
  const edges = makeEdges();
  const route = dijkstra(edges, "H", "X", "ambulance", true);
  const ambulanceEta = route.edgeIds.reduce((sum, id) => {
    const edge = edges.find((candidate) => candidate.id === id);
    return sum + estimateEdgeMinutes(edge, "ambulance", true);
  }, 0);
  const policeEta = route.edgeIds.reduce((sum, id) => {
    const edge = edges.find((candidate) => candidate.id === id);
    return sum + estimateEdgeMinutes(edge, "police", true);
  }, 0);
  assert(ambulanceEta < policeEta, "ambulance signal priority should reduce route cost");
}

function testSimulationArrives() {
  const simulation = new SmartCitySimulation();
  let arrived = false;
  for (let index = 0; index < 160; index += 1) {
    const state = simulation.step();
    arrived ||= state.vehicle.status === "arrived";
  }
  assert(arrived, "simulation should reach the destination at least once");
}

function testRemainingEtaFallsWithProgress() {
  const edges = makeEdges();
  const route = dijkstra(edges, "H", "X", "ambulance", true);
  const freshEta = remainingRouteEta(edges, route, 0, "ambulance");
  const partialEta = remainingRouteEta(edges, route, 0.5, "ambulance");
  assert(partialEta < freshEta, "remaining ETA should decrease as vehicle progresses");
}

testPredictionTrend();
testPriorityImprovesEta();
testSimulationArrives();
testRemainingEtaFallsWithProgress();

console.log("All simulation tests passed.");
