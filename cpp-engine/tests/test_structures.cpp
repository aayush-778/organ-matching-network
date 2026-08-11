// File: cpp-engine/tests/test_structures.cpp
// Lightweight assert-based unit tests -- no external framework dependency.
// Run: g++ -std=c++17 -Iinclude tests/test_structures.cpp src/*.cpp -o tests/run_tests
//      ./tests/run_tests
#include "bitmask_check.h"
#include "max_heap.h"
#include "graph.h"
#include "trie.h"
#include "circular_queue.h"

#include <cassert>
#include <iostream>
#include <cmath>

using namespace organmatch;

static int tests_run = 0;
#define CHECK(cond) do { \
    tests_run++; \
    if (!(cond)) { \
        std::cerr << "FAILED: " << #cond << " at line " << __LINE__ << std::endl; \
        std::exit(1); \
    } \
} while (0)

void test_bitmask() {
    // O donor -> AB recipient: universal donor, always compatible.
    CHECK(BitmaskChecker::isBloodCompatible(BLOOD_O, BLOOD_AB));
    // AB donor -> O recipient: AB is NOT a universal donor, should fail.
    CHECK(!BitmaskChecker::isBloodCompatible(BLOOD_AB, BLOOD_O));
    // A -> A ok, A -> B not ok.
    CHECK(BitmaskChecker::isBloodCompatible(BLOOD_A, BLOOD_A));
    CHECK(!BitmaskChecker::isBloodCompatible(BLOOD_A, BLOOD_B));

    // HLA mismatch count via XOR + popcount.
    uint32_t donor = BLOOD_O | (0b1010 << HLA_SHIFT);
    uint32_t recip = BLOOD_AB | (0b1100 << HLA_SHIFT);
    CHECK(BitmaskChecker::countHlaMismatches(donor, recip) == 2); // 1010 ^ 1100 = 0110 -> 2 bits

    std::cout << "[PASS] bitmask_checker\n";
}

void test_max_heap() {
    MaxHeap heap;
    heap.insert({"P1", /*urgency*/5, /*years*/1, /*dist*/10, 0});
    heap.insert({"P2", 9, 3, 5, 0});   // should be highest priority
    heap.insert({"P3", 1, 0, 100, 0}); // should be lowest (even negative-ish)

    Candidate top = heap.extractMax();
    CHECK(top.patient_id == "P2");

    Candidate second = heap.extractMax();
    CHECK(second.patient_id == "P1");

    Candidate third = heap.extractMax();
    CHECK(third.patient_id == "P3");

    CHECK(heap.empty());
    std::cout << "[PASS] max_heap\n";
}

void test_graph_dijkstra() {
    Graph g;
    g.addEdge("A", "B", 10);
    g.addEdge("B", "C", 5);
    g.addEdge("A", "C", 20); // slower direct path
    g.addEdge("A", "D", 1);  // dead end, no path to C

    PathResult r = g.shortestPath("A", "C");
    CHECK(r.reachable);
    CHECK(std::abs(r.total_eta_minutes - 15.0) < 1e-9); // A->B->C = 15, beats direct 20
    CHECK(r.path_sequence.size() == 3);
    CHECK(r.path_sequence[0] == "A" && r.path_sequence.back() == "C");

    PathResult unreachable = g.shortestPath("D", "C");
    CHECK(!unreachable.reachable);

    PathResult unknownVertex = g.shortestPath("A", "ZZZ");
    CHECK(!unknownVertex.reachable);

    std::cout << "[PASS] graph_dijkstra\n";
}

void test_trie() {
    Trie t;
    t.insert("Heart");
    t.insert("Hepatic");
    t.insert("Kidney");
    t.insert("Hepatitis");

    CHECK(t.search("heart"));   // case-insensitive
    CHECK(!t.search("hea"));    // prefix only, not a full word

    auto results = t.autocomplete("hep");
    CHECK(results.size() == 2);
    CHECK(results[0] == "hepatic");    // alphabetical order
    CHECK(results[1] == "hepatitis");

    auto none = t.autocomplete("xyz");
    CHECK(none.empty());

    std::cout << "[PASS] trie\n";
}

void test_circular_queue() {
    CircularQueue<int> q(3);
    CHECK(q.push(1));
    CHECK(q.push(2));
    CHECK(q.push(3));
    CHECK(!q.push(4)); // full, should reject rather than grow

    CHECK(q.pop().value() == 1);
    CHECK(q.push(4)); // now has room again after pop
    CHECK(q.pop().value() == 2);
    CHECK(q.pop().value() == 3);
    CHECK(q.pop().value() == 4);
    CHECK(!q.pop().has_value()); // empty now

    std::cout << "[PASS] circular_queue\n";
}

int main() {
    test_bitmask();
    test_max_heap();
    test_graph_dijkstra();
    test_trie();
    test_circular_queue();
    std::cout << "\nAll " << tests_run << " assertions passed.\n";
    return 0;
}
