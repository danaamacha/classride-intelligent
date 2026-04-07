# ClassRide — AI Microservice

## Overview

| Property | Value |
|---|---|
| Language | Python |
| Framework | FastAPI |
| Type | Independent microservice |
| Called by | NestJS backend (internal HTTP) |

---

## What It Does — Step by Step

1. Bus owner clicks **"Optimize Routes"**
2. NestJS sends student data to FastAPI
3. FastAPI receives:
   - All approved students with home coordinates
   - Their university destinations
   - Available buses + capacities
4. **Step 1 — Clustering (K-means):** Groups students by geographic proximity + same destination
5. **Step 2 — Assignment (Greedy):** Assigns each cluster to a bus, respecting capacity
6. **Step 3 — Route Optimization (Nearest Neighbor):** Orders pickup stops for minimum distance
7. **Step 4 — ETA (Google Maps API):** Calculates real travel time per stop
8. Returns to NestJS: optimized route per bus with ordered stops + ETAs
9. Bus owner reviews + approves → routes saved to DB

---

## Algorithms

| Step | Algorithm | Purpose |
|---|---|---|
| Clustering | K-means | Group students by location + destination |
| Bus assignment | Greedy | Respect bus capacity limits |
| Stop ordering | Nearest Neighbor (TSP) | Minimize total pickup distance |
| ETA calculation | Google Maps Distance Matrix API | Real-world travel times |

---

## Why a Separate Microservice?

- Python has the best AI/ML libraries (scikit-learn, numpy)
- NestJS is TypeScript — mixing Python AI code in it would be messy
- Separation of concerns: if the AI service goes down, the rest of the platform still works
- Can be scaled independently

---

## Security

- Internal service authentication (NestJS → FastAPI)
- Rate limit on the optimization endpoint (expensive operation)
- Input validation before running algorithms
- Results always reviewed by bus owner before saving

---

*ClassRide — Built by Dana Amacha*
