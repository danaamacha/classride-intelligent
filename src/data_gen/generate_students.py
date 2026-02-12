# src/data_gen/generate_students.py
"""
Generate synthetic students dataset for ClassRide Intelligent.

Outputs:
- data/generated/students.csv

Key features:
- Clustered home locations (neighborhood-like)
- Weighted university assignment
- Realistic schedule patterns & time windows
"""

from __future__ import annotations

import argparse
import csv
import os
import random
from dataclasses import dataclass
from typing import List, Tuple


@dataclass
class University:
    university_id: str
    name: str
    lat: float
    lng: float


DAY_PATTERNS = [
    "Mon,Wed,Fri",
    "Tue,Thu",
    "Mon–Fri",
]

TIME_WINDOWS = [
    ("07:00", "08:00"),
    ("08:00", "09:00"),
    ("09:00", "10:00"),
    ("10:00", "11:00"),
]


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def read_universities_csv(path: str) -> List[University]:
    universities: List[University] = []
    with open(path, "r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            universities.append(
                University(
                    university_id=row["university_id"].strip(),
                    name=row["name"].strip(),
                    lat=float(row["lat"]),
                    lng=float(row["lng"]),
                )
            )
    if not universities:
        raise ValueError("No universities found. Check universities.csv content.")
    return universities


def weighted_choice(items: List[str], weights: List[float]) -> str:
    # random.choices returns a list
    return random.choices(items, weights=weights, k=1)[0]


def make_clusters(
    center_lat: float,
    center_lng: float,
    cluster_count: int,
    cluster_spread: float,
) -> List[Tuple[float, float]]:
    """
    Create cluster centers around a city center.
    cluster_spread is in degrees (small values ~0.01-0.05).
    """
    clusters = []
    for _ in range(cluster_count):
        dlat = random.uniform(-cluster_spread, cluster_spread)
        dlng = random.uniform(-cluster_spread, cluster_spread)
        clusters.append((center_lat + dlat, center_lng + dlng))
    return clusters


def sample_point_near(
    base_lat: float,
    base_lng: float,
    radius: float,
) -> Tuple[float, float]:
    """
    Sample a point near a base point.
    radius is in degrees (tiny values).
    """
    dlat = random.uniform(-radius, radius)
    dlng = random.uniform(-radius, radius)
    return (base_lat + dlat, base_lng + dlng)


def generate_students(
    n_students: int,
    clusters: List[Tuple[float, float]],
    cluster_radius: float,
    university_ids: List[str],
    university_weights: List[float],
) -> List[dict]:
    students = []
    for i in range(1, n_students + 1):
        cluster_lat, cluster_lng = random.choice(clusters)
        home_lat, home_lng = sample_point_near(cluster_lat, cluster_lng, cluster_radius)

        uni_id = weighted_choice(university_ids, university_weights)

        days = random.choice(DAY_PATTERNS)
        tw_start, tw_end = random.choice(TIME_WINDOWS)

        students.append(
            {
                "student_id": f"STU_{i:04d}",
                "home_lat": round(home_lat, 6),
                "home_lng": round(home_lng, 6),
                "university_id": uni_id,
                "days": days,
                "time_window_start": tw_start,
                "time_window_end": tw_end,
            }
        )
    return students


def write_students_csv(path: str, rows: List[dict]) -> None:
    fieldnames = [
        "student_id",
        "home_lat",
        "home_lng",
        "university_id",
        "days",
        "time_window_start",
        "time_window_end",
    ]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Generate synthetic students.csv")
    p.add_argument("--n_students", type=int, default=500, help="Number of students")
    p.add_argument(
        "--universities_csv",
        type=str,
        default="data/sample/universities.csv",
        help="Path to universities.csv",
    )
    p.add_argument("--out_csv", type=str, default="data/generated/students.csv")
    p.add_argument(
        "--city_center_lat",
        type=float,
        default=33.8938,
        help="City center latitude (default: Beirut-ish)",
    )
    p.add_argument(
        "--city_center_lng",
        type=float,
        default=35.5018,
        help="City center longitude (default: Beirut-ish)",
    )
    p.add_argument(
        "--cluster_count",
        type=int,
        default=8,
        help="Number of home location clusters",
    )
    p.add_argument(
        "--cluster_spread",
        type=float,
        default=0.05,
        help="How far clusters spread from city center (degrees)",
    )
    p.add_argument(
        "--cluster_radius",
        type=float,
        default=0.01,
        help="How spread students are around each cluster center (degrees)",
    )
    p.add_argument(
        "--uni_weights",
        type=str,
        default="0.5,0.3,0.2",
        help="Comma-separated weights aligned with universities.csv order",
    )
    p.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    random.seed(args.seed)

    universities = read_universities_csv(args.universities_csv)
    university_ids = [u.university_id for u in universities]

    weights = [float(x.strip()) for x in args.uni_weights.split(",") if x.strip()]
    if len(weights) != len(university_ids):
        raise ValueError(
            f"uni_weights count ({len(weights)}) must match universities ({len(university_ids)}). "
            f"Universities: {university_ids}"
        )

    clusters = make_clusters(
        center_lat=args.city_center_lat,
        center_lng=args.city_center_lng,
        cluster_count=args.cluster_count,
        cluster_spread=args.cluster_spread,
    )

    students = generate_students(
        n_students=args.n_students,
        clusters=clusters,
        cluster_radius=args.cluster_radius,
        university_ids=university_ids,
        university_weights=weights,
    )

    ensure_dir(os.path.dirname(args.out_csv))
    write_students_csv(args.out_csv, students)

    print(f"✅ Generated {len(students)} students -> {args.out_csv}")
    print(f"Universities: {university_ids}")
    print(f"Clusters: {len(clusters)} | Seed: {args.seed}")


if __name__ == "__main__":
    main()
