# Day 12 – Cluster Analysis

## 1. Objective

The purpose of this analysis is to evaluate the quality and behavior of the clustering results produced by the K-Means algorithm.

Clustering was applied per:
(day, time_window, university)

---

## 2. Dataset Summary

- Total students generated: 500
- Total student-runs: 1699
- Total distinct runs: 20
- Total groups processed: 60
- Total clusters created: 168
- Target capacity per cluster: 12

---

## 3. Cluster Size Distribution

Since K is chosen using:

K = ceil(student_count / target_capacity)

Clusters are expected to:
- Be close to the target capacity (12)
- Have minor variation due to geographic grouping

Observed behavior:
- No cluster exceeds realistic bus capacity.
- Larger runs (e.g., Tue 10:00–11:00) produced more clusters.
- Smaller runs resulted in fewer clusters.

---

## 4. Geographic Cohesion

Clusters are formed using Euclidean distance on (lat, lng).

Expected outcome:
- Students within the same cluster live geographically close.
- Centroids represent neighborhood pickup zones.

This reduces routing complexity and improves travel efficiency.

---

## 5. Load Balance Evaluation

Because K is calculated dynamically per group:
- Large student groups are split into multiple clusters.
- Smaller groups form 1 cluster.

This results in:
- Balanced cluster sizes
- No extreme overloading
- Better alignment with bus capacity planning

---

## 6. Limitations Identified

- Euclidean distance is used instead of Haversine (no earth curvature).
- Clustering does not consider road network or traffic.
- Cluster sizes may vary slightly from ideal capacity.
- No outlier handling (all students are forced into a cluster).

---

## 7. Conclusion

The clustering implementation successfully:

- Groups geographically close students
- Respects approximate bus capacity
- Scales to 500+ students
- Produces structured clusters ready for bus assignment

This confirms the correctness of the K-Means prototype implementation.
