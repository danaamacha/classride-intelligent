# src/preprocessing/build_student_runs.py
"""
Day 8: Transform student schedules into per-day "runs" and group by day + arrival window.

Input:
- data/generated/students.csv  (from your generator)

Output (generated, should be gitignored):
- data/generated/student_runs.csv   (expanded: one row per student per day)
- data/generated/run_summary.csv    (group counts by day + window)

Example:
Student with days="Mon,Wed,Fri" and window 08:00-09:00 becomes 3 rows:
(Mon, 08:00-09:00), (Wed, 08:00-09:00), (Fri, 08:00-09:00)
"""

from __future__ import annotations

import argparse
import csv
import os
import re
from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Tuple


# Acceptable day mapping (normalize)
DAY_MAP = {
    "mon": "Mon",
    "monday": "Mon",
    "tue": "Tue",
    "tues": "Tue",
    "tuesday": "Tue",
    "wed": "Wed",
    "wednesday": "Wed",
    "thu": "Thu",
    "thur": "Thu",
    "thurs": "Thu",
    "thursday": "Thu",
    "fri": "Fri",
    "friday": "Fri",
    "sat": "Sat",
    "saturday": "Sat",
    "sun": "Sun",
    "sunday": "Sun",
}

WEEK_ORDER = {"Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6, "Sun": 7}


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def normalize_day_token(token: str) -> str:
    t = token.strip().lower()
    t = re.sub(r"[^\w]", "", t)  # remove commas/dashes weird chars
    if not t:
        raise ValueError("Empty day token.")
    if t not in DAY_MAP:
        raise ValueError(f"Unknown day token: '{token}'")
    return DAY_MAP[t]


def parse_days(days_str: str) -> List[str]:
    """
    Supports:
    - "Mon,Wed,Fri"
    - "Tue,Thu"
    - "Mon–Fri" (en dash) or "Mon-Fri"
    - "Mon–Fri" should expand to Mon,Tue,Wed,Thu,Fri
    """
    s = (days_str or "").strip()
    if not s:
        raise ValueError("days is empty")

    # Handle ranges like Mon-Fri / Mon–Fri
    range_match = re.match(r"^\s*([A-Za-z]+)\s*[–-]\s*([A-Za-z]+)\s*$", s)
    if range_match:
        a = normalize_day_token(range_match.group(1))
        b = normalize_day_token(range_match.group(2))
        if WEEK_ORDER[a] > WEEK_ORDER[b]:
            raise ValueError(f"Invalid day range '{days_str}' (start after end).")
        expanded = [d for d, idx in WEEK_ORDER.items() if WEEK_ORDER[a] <= idx <= WEEK_ORDER[b]]
        # Keep in week order
        return sorted(expanded, key=lambda d: WEEK_ORDER[d])

    # Otherwise comma-separated tokens
    tokens = [t.strip() for t in s.split(",") if t.strip()]
    normalized = [normalize_day_token(t) for t in tokens]
    # Unique + ordered
    unique = []
    seen = set()
    for d in normalized:
        if d not in seen:
            unique.append(d)
            seen.add(d)
    return sorted(unique, key=lambda d: WEEK_ORDER[d])


def normalize_time_hhmm(t: str) -> str:
    """
    Ensure time is HH:MM (24h). Accepts '8:00' too.
    """
    raw = (t or "").strip()
    if not raw:
        raise ValueError("time is empty")

    # Try HH:MM
    try:
        dt = datetime.strptime(raw, "%H:%M")
        return dt.strftime("%H:%M")
    except ValueError:
        pass

    # Try H:MM
    try:
        dt = datetime.strptime(raw, "%H:%M")  # this won't parse H:MM in some cases
    except ValueError:
        try:
            dt = datetime.strptime(raw, "%-H:%M")  # may not work on Windows
        except Exception:
            # Manual fallback for Windows: "8:05" -> "08:05"
            m = re.match(r"^(\d{1,2}):(\d{2})$", raw)
            if not m:
                raise ValueError(f"Invalid time format: '{raw}' (expected HH:MM)")
            hh = int(m.group(1))
            mm = int(m.group(2))
            if hh < 0 or hh > 23 or mm < 0 or mm > 59:
                raise ValueError(f"Invalid time value: '{raw}'")
            return f"{hh:02d}:{mm:02d}"

    # If parsed, format:
    return dt.strftime("%H:%M")


def read_students_csv(path: str) -> List[Dict[str, str]]:
    with open(path, "r", newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_csv(path: str, fieldnames: List[str], rows: List[Dict[str, str]]) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Build per-day student runs from students.csv")
    p.add_argument("--in_csv", type=str, default="data/generated/students.csv")
    p.add_argument("--out_runs_csv", type=str, default="data/generated/student_runs.csv")
    p.add_argument("--out_summary_csv", type=str, default="data/generated/run_summary.csv")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    students = read_students_csv(args.in_csv)

    runs_rows: List[Dict[str, str]] = []
    summary_counts: Dict[Tuple[str, str, str], int] = defaultdict(int)

    for s in students:
        student_id = s["student_id"].strip()
        uni_id = s["university_id"].strip()

        days_list = parse_days(s["days"])
        tw_start = normalize_time_hhmm(s["time_window_start"])
        tw_end = normalize_time_hhmm(s["time_window_end"])

        # Validate window order
        if tw_start >= tw_end:
            raise ValueError(f"Invalid time window for {student_id}: {tw_start} >= {tw_end}")

        for day in days_list:
            run_id = f"{day}_{tw_start}-{tw_end}"
            row = {
                "run_id": run_id,
                "day": day,
                "time_window_start": tw_start,
                "time_window_end": tw_end,
                "student_id": student_id,
                "home_lat": s["home_lat"],
                "home_lng": s["home_lng"],
                "university_id": uni_id,
            }
            runs_rows.append(row)
            summary_counts[(day, tw_start, tw_end)] += 1

    # Write outputs
    ensure_dir(os.path.dirname(args.out_runs_csv))
    runs_fields = [
        "run_id",
        "day",
        "time_window_start",
        "time_window_end",
        "student_id",
        "home_lat",
        "home_lng",
        "university_id",
    ]
    write_csv(args.out_runs_csv, runs_fields, runs_rows)

    summary_rows = []
    for (day, start, end), count in summary_counts.items():
        summary_rows.append(
            {
                "run_id": f"{day}_{start}-{end}",
                "day": day,
                "time_window_start": start,
                "time_window_end": end,
                "student_count": str(count),
            }
        )
    summary_rows.sort(key=lambda r: (WEEK_ORDER[r["day"]], r["time_window_start"]))

    summary_fields = ["run_id", "day", "time_window_start", "time_window_end", "student_count"]
    write_csv(args.out_summary_csv, summary_fields, summary_rows)

    print(f"✅ Built student runs: {len(runs_rows)} rows -> {args.out_runs_csv}")
    print(f"✅ Run summary: {len(summary_rows)} runs -> {args.out_summary_csv}")

    # Print top 5 largest runs
    top = sorted(summary_rows, key=lambda r: int(r["student_count"]), reverse=True)[:5]
    if top:
        print("\nTop runs by student_count:")
        for r in top:
            print(f"- {r['run_id']}: {r['student_count']} students")


if __name__ == "__main__":
    main()
