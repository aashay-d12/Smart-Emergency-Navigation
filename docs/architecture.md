# Architecture Notes

## System Pipeline

```text
Emergency Vehicle GPS
        |
        v
Fog Node / Local Traffic Processor
        |
        v
Cloud Routing API
        |
        v
Congestion Prediction + Best Route
        |
        v
Traffic Signal Priority
        |
        v
Dashboard + Alerts
```

## Components

| Layer | Demo Implementation | AWS Equivalent |
| --- | --- | --- |
| Vehicle GPS | Simulated emergency vehicle in `src/simulation.js` | AWS IoT Core device messages |
| Fog processing | Local traffic update and predicted signal arrival table | Greengrass or edge service |
| Cloud API | Node.js HTTP API in `server.js` | EC2 behind API Gateway |
| Database | In-memory state for lab demo | DynamoDB |
| Live updates | Server-Sent Events at `/api/events` | IoT Core MQTT or WebSocket API |
| Monitoring | Event log panel | CloudWatch logs and metrics |
| Notifications | Dashboard event feed | SNS |

## Routing Logic

The route cost is not only distance. Each road segment is scored with:

- physical distance,
- current congestion,
- predicted congestion,
- road hazard penalty,
- traffic signal wait time,
- emergency vehicle priority.

The backend runs Dijkstra's shortest path algorithm on this dynamic cost. A lightweight linear regression model forecasts congestion from recent traffic history. If a predicted congestion spike makes another route faster, the system reroutes the vehicle before it reaches the blocked area.

## Improvements Implemented

1. **AI-Based Traffic Congestion Prediction**
   - Uses recent traffic history for every road.
   - Predicts near-future congestion and reroutes early.

2. **Emergency Level Prioritization**
   - Ambulance has highest priority, then fire truck, then police.
   - Higher priority reduces signal wait cost and increases green-window time.

3. **Weather/Hazard-Aware Routing**
   - Road segments can include hazards such as fog, accident risk, or flooding.
   - Hazardous routes receive higher cost unless they remain the best option.

## How to Explain in Viva

The project demonstrates cloud computing because the dashboard is not doing the decision-making. The backend acts as the cloud service that receives vehicle data, analyzes city traffic, predicts congestion, calculates the best route, and publishes live updates. In a real deployment, sensor messages would arrive through AWS IoT Core, route decisions would be exposed through API Gateway, records would be stored in DynamoDB, and CloudWatch/SNS would handle monitoring and alerts.
