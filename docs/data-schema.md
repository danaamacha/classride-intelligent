# Data Schema

This document defines the prototype dataset structure used by ClassRide Intelligent (v1).

---

## 1) Universities (`data/sample/universities.csv`)
**Purpose:** destination points for trips.

Columns:
- `university_id` (string) — unique id (e.g., UNI_AUB)
- `name` (string) — university name
- `lat` (float) — latitude
- `lng` (float) — longitude

---

## 2) Buses (`data/sample/buses.csv`)
**Purpose:** available buses and their constraints.

Columns:
- `bus_id` (string) — unique id (e.g., BUS_01)
- `capacity` (int) — max number of students
- `start_lat` (float) — bus depot latitude
- `start_lng` (float) — bus depot longitude

---

## 3) Students (`data/sample/students.csv`)
**Purpose:** students who need transport.

Columns:
- `student_id` (string) — unique id (e.g., STU_0001)
- `home_lat` (float) — student home latitude
- `home_lng` (float) — student home longitude
- `university_id` (string) — FK → `universities.university_id`
- `days` (string) — e.g., `Mon,Wed,Fri`
- `time_window_start` (string) — `HH:MM` (24h)
- `time_window_end` (string) — `HH:MM` (24h)

---

## Notes
- All times are local time.
- In v1, planning can be generated per (day + time window).
- Traffic is not modeled in the sample dataset.
