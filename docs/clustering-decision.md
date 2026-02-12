# Clustering Algorithm Selection

## 1. Objective

The goal of clustering in ClassRide Intelligent is to group students who:

- Live geographically close to each other
- Share the same university
- Share the same day and arrival time window

Clustering reduces routing complexity and improves bus assignment efficiency.

---

## 2. Candidate Algorithms Considered

### 2.1 K-Means
Pros:
- Simple and fast
- Scales well for large datasets
- Easy to implement

Cons:
- Requires predefined number of clusters (K)
- Struggles with irregular geographic shapes
- Assumes spherical clusters

---

### 2.2 DBSCAN
Pros:
- Does not require predefined number of clusters
- Can detect arbitrary shaped clusters
- Handles noise (isolated students)

Cons:
- Sensitive to epsilon parameter
- Can struggle with varying density
- Less scalable for very large datasets

---

### 2.3 Hierarchical Clustering
Pros:
- No need to specify cluster count initially
- Produces cluster tree (dendrogram)

Cons:
- Computationally expensive
- Not ideal for thousands of students

---

## 3. Selected Algorithm: K-Means (Prototype Phase)

For the prototype version of ClassRide Intelligent, K-Means is selected because:

1. It is computationally efficient.
2. It scales well for 500–5000 students.
3. It is simple to interpret and visualize.
4. The number of clusters can be aligned with:
   - Available buses
   - Capacity constraints
   - Geographic grouping targets

In later versions, DBSCAN may be explored for better geographic adaptability.

---

## 4. How Clustering Will Be Applied

Clustering will be performed separately for each:

(day, time_window, university)

This ensures that:
- Students heading to the same destination at the same time are grouped.
- Bus assignment becomes a constrained optimization problem.

---

## 5. Future Improvements

- Evaluate DBSCAN for irregular city layouts
- Compare clustering quality using:
  - Average intra-cluster distance
  - Load balance per bus
- Use geographic distance (Haversine formula) instead of raw lat/lng distance
