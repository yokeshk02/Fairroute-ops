# FairRoute Data Schema

## Orders

| Field | Type | Description |
|---|---|---|
| `order_id` | string | Stable order identifier |
| `customer_location` / `location` | string | Named delivery zone |
| `destination_type` | enum | `gated_apartment`, `office_complex`, `residential`, or `retail` |
| `distance_km` | number | Estimated route distance |
| `priority` | enum | `urgent`, `high`, or `normal` |
| `order_time` | `HH:MM` | Order creation time |
| `delivery_deadline` / `deadline` | `HH:MM` | Required delivery window |
| `estimated_service_time` / `service_time` | number | Destination service minutes |
| `package_weight` / `weight` | number | Package weight in kilograms |
| `special_constraint` / `constraint` | enum | Security gate, lift, fragile, or none |

## Riders

| Field | Type | Description |
|---|---|---|
| `rider_id` | string | Stable rider identifier |
| `name` | string | Rider display name |
| `current_location` / `location` | string | Current hub or zone |
| `capacity` | integer | Maximum active assignment count |
| `current_load` | integer | Existing workload |
| `recent_workload` | integer | Rolling workload measure |
| `daily_earnings` / `earnings` | number | Current earnings proxy |
| `availability` | boolean | Whether the rider can accept work |
| `vehicle_type` / `vehicle` | enum | `bike`, `scooter`, or `van` |
| `speed_kmph` / `speed` | number | Estimated travel speed |
| `max_distance_km` | number | Maximum supported route distance |
| `reliability_score` / `reliability` | number | Historical on-time proxy, 0–1 |

## Assignment output

Each decision stores `order_id`, `rider_id`, `algorithm`, `status`, `score`, `delivery_time`, `cost`, `emissions`, `on_time`, `late_minutes`, `reason`, a normalized score breakdown, and the constraint note. A null `rider_id` is a valid unassigned state and never causes a crash.

## Import format

The UI import action accepts JSON shaped as `{ "orders": [...], "riders": [...] }`. Exported demo data preserves the UI field names. CSV ingestion is reserved for the next backend iteration so the MVP can keep validation strict and explicit.
