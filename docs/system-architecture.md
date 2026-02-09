# System Architecture

## 1. Overview
ClassRide Intelligent is designed as a modular AI-based transportation planning system. It transforms raw student and bus data into optimized bus assignments and routes. The system is organized into clear components so it can evolve from a simple prototype into a scalable product.

---

## 2. High-Level Flow
1. Data Ingestion: load student, bus, university, and schedule data
2. Preprocessing: clean/validate data and prepare features
3. Student Grouping: cluster students by location and time window
4. Bus Assignment: assign grouped students to buses while respecting capacity constraints
5. Route Planning: generate an ordered pickup route for each bus
6. Results Export: output assignments and route summaries

---

## 3. Core Components

### 3.1 Data Layer
Responsible for storing and loading data.
- Input formats: CSV/JSON (prototype)
- Entities: Students, Buses, Universities, Schedules
- Output formats: CSV/JSON reports (assignments, routes)

### 3.2 Preprocessing Module
Validates and prepares data for intelligent decisions.
- Handle missing/invalid coordinates
- Normalize locations and time windows
- Feature extraction (e.g., distance to university, schedule grouping)

### 3.3 Clustering Module (Grouping)
Groups students to reduce complexity and improve routing.
- Goal: students living near each other and sharing similar schedules are grouped
- Example techniques (later): K-Means / DBSCAN / grid-based clustering

### 3.4 Assignment & Optimization Module
Assigns students/groups to buses under constraints.
- Capacity constraints (bus seats)
- Schedule constraints (time windows)
- Objective: minimize total distance/time and balance bus utilization

### 3.5 Routing Module
Generates a pickup sequence for each bus.
- Uses distances between pickup points
- Prototype routing approach: nearest-neighbor heuristic
- Later improvement: solve a simplified Vehicle Routing Problem (VRP)

### 3.6 Output & Reporting Module
Produces human-readable and machine-readable results.
- Student → Bus mapping
- Bus route order (pickup list)
- Summary metrics (total distance, utilization)

---

## 4. Data Entities (Conceptual)

### Student
- id
- name (optional)
- home_location (lat, lng)
- university_id
- schedule (days + time window)

### Bus
- id
- capacity
- start_location (lat, lng)

### University
- id
- name
- location (lat, lng)

---

## 5. Assumptions (Prototype Version)
- Traffic and road restrictions are not modeled in v1
- All students assigned for the same day/time run are planned together
- Locations are stable during planning

---

## 6. Future Extensions
- Live traffic integration (Google Maps API)
- Multi-stop time windows and constraints
- Real-time updates (new student, bus unavailable)
- Advanced VRP solvers (OR-Tools)
