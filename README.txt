# Autocomplete API Name Extraction

This project focuses on extracting names from an undocumented autocomplete API hosted at `http://35.200.185.69:8000`. The primary objective is to efficiently retrieve **all available names** using prefix-based queries while analyzing the behavior and constraints of the API. The project involves reverse engineering, rate-limit testing, and developing an optimal strategy to perform exhaustive name extraction.

## API Endpoint Versions Discovered

During exploration, the following API endpoints were identified:

- `/v1/autocomplete?query=<string>`
- `/v2/autocomplete?query=<string>`
- `/v3/autocomplete?query=<string>`

### Key Differences Between API Versions:

| Version | Names Per Request | Allowed Characters                          | Rate Limit (Requests/Minute) |
|--------|--------------------|---------------------------------------------|------------------------------|
| V1     | 10                 | Lowercase alphabets (a–z)                   | 100                          |
| V2     | 12                 | Lowercase alphabets + digits (0–9)         | 50                           |
| V3     | 15                 | Alphabets, digits, space, period, +, -     | 80                           |

## API Response Structure

The API responses across all versions contain the following fields:
- `version`
- `count` — number of names returned
- `results` — array of names

It was also observed that the **names returned in the `results` array are lexicographically sorted**. This key observation made it significantly easier to design an efficient extraction strategy, as it allowed for intelligent traversal and pruning of prefixes during crawling.

## Rate Limit Testing

A custom **Node.js script** was developed to test the rate limits. It sends sequential requests and stops when a `429 Too Many Requests` error is received. This helped determine the safe request thresholds per minute for each API version.

## Crawling Logic: Recursive Prefix Traversal (DFS Approach)

To extract all possible names, a **recursive prefix-based traversal strategy** was implemented — conceptually similar to **Depth-First Search (DFS)** or **backtracking**.

- Start with an empty prefix.
- Send a request with the current prefix.
- If the number of results equals the maximum (10, 12, or 15), it suggests more names exist under that prefix. Extend the prefix with allowed characters and continue recursively.
- If fewer results are returned, the prefix branch is considered exhausted, and the algorithm backtracks.

This strategy ensures **complete and efficient extraction of all name combinations** with minimal redundant calls. The **lexicographical sorting of results** plays a critical role in optimizing the traversal path and avoiding unnecessary queries.

## Extraction Statistics

| Version | API Calls Made | Names Extracted |
|--------|----------------|------------------|
| V1     | 12,947         | 18,632            |
| V2     | 3,122          | 13,730            |
| V3     | *(not tracked)*| 12,517            |

These statistics show the efficiency of the prefix-based recursive traversal under rate-limited conditions.

## Future Improvements

- Implement **rate-aware throttling**
- **Proxy rotation** to bypass IP-based rate limits
- **Parallel distributed crawling**
- **Live proxy health checks**
- **Retry mechanisms** on failures or rate limits
- Result **deduplication and efficient storage**

---

This project demonstrates a methodical and practical approach to reverse engineering undocumented systems and building scalable, intelligent crawling solutions under constrained environments.
