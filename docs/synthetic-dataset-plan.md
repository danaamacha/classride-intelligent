# Synthetic Dataset Plan

## 1. Goal
The goal of this plan is to generate realistic synthetic data for ClassRide Intelligent to support testing, experimentation, and evaluation without requiring real student personal data.

The synthetic dataset will simulate:
- Student home locations
- University destinations
- Schedules (days + time windows)
- Bus capacities and depots

---

## 2. Data to Generate

### 2.1 Universities
Fields:
- university_id
- name
- lat, lng

Generation approach:
- Use a small fixed list of universities (3–10) with constant coordinates.

---

### 2.2 Buses
Fields:
- bus_id
- capacity
- start_lat, start_lng

Generation approach:
- Generate N buses (e.g., 5–50)
- Capacity chosen from a realistic set (e.g., 8, 10, 12, 14, 20)
- Depot coordinates sampled around a central city area (within a radius)

---

### 2.3 Students
Fields:
- student_id
- home_lat, home_lng
- university_id
- days
- time_window_start, time_window_end

Generation approach:
- Generate M students (e.g., 200–5000)
- Home locations sampled around the target region using:
  - Multiple clusters (neighborhood-style groups)
  - Small random noise added per student
- University assignment:
  - Weighted distribution (some universities have more students)
- Schedule assignment:
  - Days drawn from common patterns:
    - Mon,Wed,Fri
    - Tue,Thu
    - Mon–Fri
  - Time windows chosen from realistic morning blocks, e.g.:
    - 07:00–08:00
    - 08:00–09:00
    - 09:00–10:00
    - 10:00–11:00

---

## 3. Parameters (Controllable)
The generator should support configuration:
- number_of_students (M)
- number_of_buses (N)
- number_of_universities (U)
- cluster_count (K) for student homes
- cluster_radius (how spread each neighborhood is)
- city_center_lat/lng (base region)
- university_weights (distribution)

---

## 4. Validity Rules (Data Quality)
Generated data must satisfy:
- All coordinates are valid floats (lat: -90..90, lng: -180..180)
- Every student references a valid university_id
- time_window_start < time_window_end
- days must follow allowed patterns
- Student IDs and bus IDs must be unique

---

## 5. Output Format
The synthetic generator will export:
- `data/generated/universities.csv`
- `data/generated/buses.csv`
- `data/generated/students.csv`

---

## 6. Evaluation Use
The synthetic dataset will be used to:
- Test clustering performance
- Test bus assignment constraints (capacity + schedule)
- Compare routing heuristics (distance/time estimates)
- Track metrics such as:
  - average route distance per bus
  - utilization per bus
  - number of constraint violations

---

## 7. Next Implementation Step
Implement a generator script (Python) that:
- takes parameters from a config file or CLI arguments
- generates realistic clustered coordinates
- exports CSV files into `data/generated/`
