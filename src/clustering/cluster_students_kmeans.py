# src/clustering/cluster_students_kmeans.py
"""
Day 10: Cluster students by location using K-Means per (day, time window, university).

Input (generated):
- data/generated/student_runs.csv

Outputs (generated, should be gitignored):
- data/generated/student_clusters.csv  (each student-run row assigned cluster_id)
- data/generated/cluster_summary.csv   (cluster sizes and centroids)

Clustering strategy:
- Group by (day, time_window_start, time_window_end, university_id)
- Within each group, choose K based on an estimated bus capacity
  K = ceil(student_count / target_capacity), but never > student_count, never < 1
- Run simple K-Means on (lat, lng) with fixed iterations + seed
"""

from __future__ import annotations

import argparse
import csv
import math
import os
import random
from collections import defaultdict
from typing import Dict, List, Tuple


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def read_csv(path: str) -> List[Dict[str, str]]:
    with open(path, "r", newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_csv(path: str, fieldnames: List[str], rows: List[Dict[str, str]]) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


def euclidean2(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    # squared distance
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2


def choose_k(n: int, target_capacity: int) -> int:
    if n <= 0:
        return 0
    k = math.ceil(n / max(1, target_capacity))
    k = max(1, min(k, n))
    return k


def init_centroids(points: List[Tuple[float, float]], k: int) -> List[Tuple[float, float]]:
    # Random unique points
    if k >= len(points):
        return points[:]
    return random.sample(points, k)


def recompute_centroids(
    points: List[Tuple[float, float]],
    assignments: List[int],
    k: int,
) -> List[Tuple[float, float]]:
    sums = [(0.0, 0.0) for _ in range(k)]
    counts = [0 for _ in range(k)]

    for p, c in zip(points, assignments):
        sums[c] = (sums[c][0] + p[0], sums[c][1] + p[1])
        counts[c] += 1

    centroids = []
    for i in range(k):
        if counts[i] == 0:
            # Empty cluster: will be handled by re-seeding later
            centroids.append((float("nan"), float("nan")))
        else:
            centroids.append((sums[i][0] / counts[i], sums[i][1] / counts[i]))
    return centroids


def kmeans(
    points: List[Tuple[float, float]],
    k: int,
    max_iter: int = 30,
) -> Tuple[List[int], List[Tuple[float, float]]]:
    """
    Basic K-Means on 2D points.
    Returns (assignments, centroids)
    """
    centroids = init_centroids(points, k)
    assignments = [0] * len(points)

    for _ in range(max_iter):
        changed = False

        # Assign
        for i, p in enumerate(points):
            best_c = 0
            best_d = euclidean2(p, centroids[0])
            for c in range(1, k):
                d = euclidean2(p, centroids[c])
                if d < best_d:
                    best_d = d
                    best_c = c
            if assignments[i] != best_c:
                assignments[i] = best_c
                changed = True

        # Recompute
        centroids = recompute_centroids(points, assignments, k)

        # Fix empty clusters by re-seeding to random points
        for c in range(k):
            if math.isnan(centroids[c][0]) or math.isnan(centroids[c][1]):
                centroids[c] = random.choice(points)
                changed = True

        if not changed:
            break

    return assignments, centroids


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Cluster student runs using K-Means per run+university group")
    p.add_argument("--in_csv", type=str, default="data/generated/student_runs.csv")
    p.add_argument("--out_clusters_csv", type=str, default="data/generated/student_clusters.csv")
    p.add_argument("--out_summary_csv", type=str, default="data/generated/cluster_summary.csv")
    p.add_argument("--target_capacity", type=int, default=12, help="Approx capacity used to decide K")
    p.add_argument("--max_iter", type=int, default=30)
    p.add_argument("--seed", type=int, default=42)
    return p.parse_args()


def main() -> None:
    args = parse_args()
    random.seed(args.seed)

    rows = read_csv(args.in_csv)
    if not rows:
        raise ValueError(f"No rows found in {args.in_csv}. Run Day 8 first.")

    # Group by (day, start, end, university)
    groups: Dict[Tuple[str, str, str, str], List[Dict[str, str]]] = defaultdict(list)
    for r in rows:
        key = (r["day"], r["time_window_start"], r["time_window_end"], r["university_id"])
        groups[key].append(r)

    out_rows: List[Dict[str, str]] = []
    summary_rows: List[Dict[str, str]] = []

    total_clusters = 0
    for (day, start, end, uni), g in groups.items():
        n = len(g)
        k = choose_k(n, args.target_capacity)

        points = [(float(r["home_lat"]), float(r["home_lng"])) for r in g]
        assignments, centroids = kmeans(points, k, max_iter=args.max_iter)

        # Count cluster sizes
        cluster_counts = [0] * k
        for a in assignments:
            cluster_counts[a] += 1

        # Build output rows
        for r, a in zip(g, assignments):
            run_id = r["run_id"]
            cluster_id = f"{day}_{start}-{end}_{uni}_C{a+1:02d}"
            out = dict(r)
            out["cluster_id"] = cluster_id
            out_rows.append(out)

        # Build summary rows
        for idx, (cx, cy) in enumerate(centroids):
            summary_rows.append(
                {
                    "day": day,
                    "time_window_start": start,
                    "time_window_end": end,
                    "university_id": uni,
                    "cluster_id": f"{day}_{start}-{end}_{uni}_C{idx+1:02d}",
                    "cluster_size": str(cluster_counts[idx]),
                    "centroid_lat": f"{cx:.6f}",
                    "centroid_lng": f"{cy:.6f}",
                }
            )

        total_clusters += k

    # Sort for readability
    out_rows.sort(key=lambda r: (r["day"], r["time_window_start"], r["university_id"], r["cluster_id"], r["student_id"]))
    summary_rows.sort(key=lambda r: (r["day"], r["time_window_start"], r["university_id"], r["cluster_id"]))

    ensure_dir(os.path.dirname(args.out_clusters_csv))
    out_fields = [
        "run_id",
        "day",
        "time_window_start",
        "time_window_end",
        "student_id",
        "home_lat",
        "home_lng",
        "university_id",
        "cluster_id",
    ]
    write_csv(args.out_clusters_csv, out_fields, out_rows)

    summary_fields = [
        "day",
        "time_window_start",
        "time_window_end",
        "university_id",
        "cluster_id",
        "cluster_size",
        "centroid_lat",
        "centroid_lng",
    ]
    write_csv(args.out_summary_csv, summary_fields, summary_rows)

    print(f"✅ Groups processed: {len(groups)}")
    print(f"✅ Total clusters created: {total_clusters}")
    print(f"✅ Clustered rows: {len(out_rows)} -> {args.out_clusters_csv}")
    print(f"✅ Cluster summary: {len(summary_rows)} -> {args.out_summary_csv}")
    print(f"Params: target_capacity={args.target_capacity}, max_iter={args.max_iter}, seed={args.seed}")


if __name__ == "__main__":
    main()
