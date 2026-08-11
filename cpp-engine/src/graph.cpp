// File: cpp-engine/src/graph.cpp
#include "graph.h"
#include <queue>
#include <algorithm>

namespace organmatch {
    
    void Graph::addVertex(const std::string& id) {
        if(adj.find(id) == adj.end()) {
            adj[id] = std::vector<std::pair<std::string, double>> {};
        }
    }

    void Graph::addEdge(const std::string& from, const std::string& to, double weight_minutes) {
        addVertex(from);
        addVertex(to);

        for (auto& edge : adj[from]) {
            if (edge.first == to) {
                edge.second = weight_minutes; 
                return;
            }
        }
        adj[from].push_back({to, weight_minutes});
    }

    bool Graph::hasVertex(const std::string& id) const {
        return adj.find(id) != adj.end();
    }

    PathResult Graph::shortestPath(const std::string& source, const std::string& target) const {
        auto all_paths = allShortestPaths(source);
        if (all_paths.find(target) != all_paths.end()) {
            return all_paths[target];
        }
        
        return PathResult{false, std::numeric_limits<double>::infinity(), {}};
    }

    std::unordered_map<std::string, PathResult> Graph::allShortestPaths(const std::string& source) const {
        std::unordered_map<std::string, PathResult> results;
        if (!hasVertex(source)) return results;

        std::unordered_map<std::string, double> dist;
        std::unordered_map<std::string, std::string> prev;

        for(const auto& kv: adj) {
            dist[kv.first] = std::numeric_limits<double>::infinity();
        }
        dist[source] = 0.0;

        using Entry = std::pair<double, std::string>;
        std::priority_queue<Entry, std::vector<Entry>, std::greater<Entry>> pq;
        pq.push({0.0, source});

        std::unordered_map<std::string, bool> visited;

        while(!pq.empty()) {
            auto [d, u] = pq.top();
            pq.pop();

            if(visited.count(u)) continue;
            visited[u] = true;

            auto it = adj.find(u);
            if(it == adj.end()) continue;

            for(const auto& [v, weight]: it->second) {
                double new_dist = d + weight;
                if(new_dist < dist[v]) {
                    dist[v] = new_dist;
                    prev[v] = u;
                    pq.push({new_dist, v}); 
                }
            }
        }

        for(const auto& kv: adj) {
            std::string target = kv.first;
            if (dist[target] == std::numeric_limits<double>::infinity()) continue;

            PathResult result;
            result.reachable = true;
            result.total_eta_minutes = dist[target];

            std::vector<std::string> path;
            std::string curr = target;
            path.push_back(target);

            while(curr != source) {
                auto it = prev.find(curr);
                if(it == prev.end()) break;
                curr = it->second;
                path.push_back(curr);
            }

            std::reverse(path.begin(), path.end());
            result.path_sequence = path; 
            
            results[target] = result;
        }

        return results;
    }

} // namespace organmatch