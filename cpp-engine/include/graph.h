// File: cpp-engine/include/graph.h
#pragma once
#include <vector>
#include <unordered_map>
#include <string>
#include <limits>

// ============================================================================
// TIER 2: PHYSICAL TRANSIT LOGISTICS 
//
// Weighted directed graph via adjacency list. Vertices = hospitals/helipads.
// Edge weight = transit/flight duration in minutes. Dijkstra with a min
// priority queue finds the fastest path from donor hospital to a candidate
// recipient's hospital, which is then checked against the organ's ischemia
// window.
//
// NOTE (see README): in a real deployment this graph is a small, mostly
// static regional network (a handful of hospitals + transit hubs), not a
// live-updating global road network. Modeled here as a fixed adjacency list
// seeded at startup.
//
// Complexity: O((V + E) log V) using a binary min-heap priority queue.
// ============================================================================

namespace organmatch {
    
    struct PathResult {
        bool reachable;
        double total_eta_minutes;
        std::vector<std::string> path_sequence;
    };

    class Graph {
        public:
            void addVertex(const std::string& id);
            void addEdge(const std::string& from, const std::string& to, double weight_minutes);

            // Runs Dijkstra's algorithm from `source` to `target`.
            PathResult shortestPath(const std::string& source, const std::string& target) const;

            // Runs Dijkstra once and returns paths to ALL reachable nodes.
            std::unordered_map<std::string, PathResult> allShortestPaths(const std::string& source) const;

            bool hasVertex(const std::string& id) const;

        private:
            std::unordered_map<std::string, std::vector<std::pair<std::string, double>>> adj;
    };

} // namespace organmatch