# src/data_gen/generate_buses.py
"""
Generate synthetic buses dataset for ClassRide Intelligent.

Outputs:
- data/generated/buses.csv

Key features:
- Realistic capacity choices
- Depot/start locations sampled around a city center (small radius)
- Reproducible with seed
"""

from __future__ import annotations

import argparse
import csv
import os
import random
from typing import List, Tuple


CAPACITY_CHOICES = [8, 10, 12, 14, 20]  # realistic small/medium bus sizes


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def sample_point_near(base_lat: float, base_lng: float, radius: float) -> Tuple[float, float]:
    # radius in degrees (tiny values like 0.01 - 0.05)
    dlat = random.uniform(-radius, radius)
    dlng = random.uniform(-radius, radius)
    return base_lat + dlat, base_lng + dlng


def generate_buses(
    n_buses: int,
    city_center_lat: float,
    city_center_lng: float,
    depot_radius: float,
) -> List[dict]:
    buses = []
    for i in range(1, n_buses + 1):
        start_lat, start_lng = sample_point_near(city_center_lat, city_center_lng, depot_radius)
        capacity = random.choice(CAPACITY_CHOICES)

        buses.append(
            {
                "bus_id": f"BUS_{i:02d}",
                "capacity": capacity,
                "start_lat": round(start_lat, 6),
                "start_lng": round(start_lng, 6),
            }
        )
    return buses


def write_buses_csv(path: str, rows: List[dict]) -> None:
    fieldnames = ["bus_id", "capacity", "start_lat", "start_lng"]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Generate synthetic buses.csv")
    p.add_argument("--n_buses", type=int, default=20, help="Number of buses")
    p.add_argument("--out_csv", type=str, default="data/generated/buses.csv")
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
        "--depot_radius",
        type=float,
        default=0.03,
        help="How far depots spread around city center (degrees)",
    )
    p.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    random.seed(args.seed)

    buses = generate_buses(
        n_buses=args.n_buses,
        city_center_lat=args.city_center_lat,
        city_center_lng=args.city_center_lng,
        depot_radius=args.depot_radius,
    )

    ensure_dir(os.path.dirname(args.out_csv))
    write_buses_csv(args.out_csv, buses)

    print(f"✅ Generated {len(buses)} buses -> {args.out_csv}")
    print(f"Capacities: {sorted(set([b['capacity'] for b in buses]))}")
    print(f"Depot radius: {args.depot_radius} | Seed: {args.seed}")


if __name__ == "__main__":
    main()
