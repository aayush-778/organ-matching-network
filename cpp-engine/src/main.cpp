#include "bitmask_check.h"
#include "max_heap.h"
#include "graph.h"
#include "trie.h"
#include "circular_queue.h"
#include "json.hpp"

#include <iostream>
#include <sstream>
#include <string>
#include <cstring>
#include <utility>

using json = nlohmann::json;
using namespace organmatch;

namespace {
    
Graph buildRegionalGraph() {
    Graph g;
    g.addEdge("Hospital_12", "Transit_Hub_A", 12);
    g.addEdge("Transit_Hub_A", "Hospital_45", 25);
    g.addEdge("Hospital_12", "Transit_Hub_B", 8);
    g.addEdge("Transit_Hub_B", "Hospital_45", 30);
    g.addEdge("Hospital_12", "Hospital_45", 90); 
    g.addEdge("Transit_Hub_A", "Transit_Hub_B", 15);
    g.addEdge("Hospital_12", "Hospital_77", 55);
    g.addEdge("Transit_Hub_A", "Hospital_77", 20);
    g.addEdge("Hospital_45", "Hospital_99", 10);
    g.addEdge("Transit_Hub_B", "Hospital_99", 18);
    return g;
}

std::string hospitalVertexId(int hospital_id) {
    return "Hospital_" + std::to_string(hospital_id);
}

std::string extractDataArg(int argc, char** argv) {
    const std::string prefix = "--data=";
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg.rfind(prefix, 0) == 0) {
            return arg.substr(prefix.size());
        }
    }
    return "";
}

std::string readStdin() {
    std::ostringstream ss;
    ss << std::cin.rdbuf();
    return ss.str();
}

json errorResponse(const std::string& message) {
    return json{{"status", "error"}, {"message", message}};
}

} // namespace

int main(int argc, char** argv) {
    std::string raw_data = extractDataArg(argc, argv);
    if(raw_data.empty()) {
        raw_data = readStdin();
    }

    if(raw_data.empty()) {
        std::cout << errorResponse("no input data provided (use --data= or stdin)").dump() << std::endl;
        return 1;
    }

    json input;
    try {
        input = json::parse(raw_data);
    }catch (const json::parse_error& e) {
        std::cout << errorResponse(std::string("invalid JSON input: ") + e.what()).dump() << std::endl;
        return 1;
    }

    try {
        std::string organ = input.at("organ").get<std::string>();
        double ischemia_limit = input.at("ischemia_limit_mins").get<double>();
        int donor_hospital_id = input.at("donor_hospital_id").get<int>();
        uint32_t donor_blood_mask = input.at("donor_blood_mask").get<uint32_t>();
        auto recipients = input.at("recipients");

        Graph graph = buildRegionalGraph();
        std::string donor_vertex = hospitalVertexId(donor_hospital_id);

        MaxHeap heap;
        json screened_out = json::array(); 
        std::unordered_map<std::string, PathResult> paths_by_patient;

        for(const auto& r : recipients) {
            std::string patient_id = r.at("id").get<std::string>();
            uint32_t recipient_mask = r.at("blood_mask").get<uint32_t>();

            // --- TIER 1: Biochemical Screening ---
            compatibilityResult compat = BitmaskChecker::check(donor_blood_mask, recipient_mask);
            if (!compat.overall_compatible) {
                screened_out.push_back({{"patient_id", patient_id},
                                         {"reason", "biochemical_incompatible"},
                                         {"hla_mismatches", compat.hla_mismatches}});
                continue;
            }

            // --- TIER 2: Logistics & Viability ---
            int recipient_hospital_id = r.at("hospital_id").get<int>();
            std::string recipient_vertex = hospitalVertexId(recipient_hospital_id);
            PathResult path = graph.shortestPath(donor_vertex, recipient_vertex);

            if (!path.reachable) {
                screened_out.push_back({{"patient_id", patient_id},
                                         {"reason", "no_transit_path_found"}});
                continue;
            }
            if (path.total_eta_minutes > ischemia_limit) {
                screened_out.push_back({{"patient_id", patient_id},
                                         {"reason", "exceeds_ischemia_window"},
                                         {"eta_minutes", path.total_eta_minutes},
                                         {"ischemia_limit_mins", ischemia_limit}});
                continue;
            }

            // --- TIER 3: Enqueue Target Candidate ---
            Candidate c;
            c.patient_id = patient_id;
            c.urgency = r.at("urgency").get<double>();
            c.waiting_years = r.at("waiting_years").get<double>();
            c.distance_km = r.value("distance_km", path.total_eta_minutes);
            
            paths_by_patient[patient_id] = std::move(path);
            heap.insert(std::move(c));
        }

        json ranked_matches = json::array();
        size_t initial_matches_count = heap.size();
        
        while (!heap.empty()) {
            Candidate c = heap.extractMax();
            const PathResult& path = paths_by_patient.at(c.patient_id);
            
            ranked_matches.push_back({
                {"patient_id", std::move(c.patient_id)},
                {"priority_score", c.score},
                {"compatibility", "verified"},
                {"logistics", {
                    {"path_sequence", path.path_sequence},
                    {"total_eta_minutes", path.total_eta_minutes},
                    {"ischemia_window_status", "safe"}
                }}
            });
        }

        json output;
        output["status"] = "success";
        output["organ"] = std::move(organ);
        output["matches_found"] = initial_matches_count;
        output["ranked_match_run"] = std::move(ranked_matches); 
        output["screened_out"] = std::move(screened_out);       

        std::cout << output.dump() << std::endl;
        return 0;

    }catch (const json::out_of_range& e) {
        std::cout << errorResponse(std::string("missing required field: ") + e.what()).dump() << std::endl;
        return 1;
    }catch (const std::exception& e) {
        std::cout << errorResponse(std::string("engine error: ") + e.what()).dump() << std::endl;
        return 1;
    }
}
