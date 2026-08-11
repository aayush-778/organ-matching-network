// File: cpp-engine/include/max_heap.h
#pragma once
#include <vector>
#include <string>
#include <stdexcept>

// ============================================================================
// TIER 3: CLINICAL TRIAGE RANKING ENGINE
//
// A max-heap built from scratch on top of a plain std::vector (no
// std::priority_queue) so the bubbleUp/sinkDown mechanics are explicit and
// explainable. Array-backed binary tree: for a node at index i,
//   parent = (i - 1) / 2
//   left   = 2*i + 1
//   right  = 2*i + 2
//
// Priority score formula (see README for real-world caveats):
//   score = urgency * 10 + waiting_years * 2 - distance_km * 0.5
// ============================================================================

namespace organmatch {

    struct Candidate {
        std::string patient_id;
        double urgency;        // 1-10 scale
        double waiting_years;
        double distance_km;
        double score;           // computed priority score (higher = more urgent)
    };

    class MaxHeap {
    public:
        MaxHeap() = default;

        // Computes the priority score for a candidate and returns it.
        static double computeScore(double urgency, double waiting_years, double distance_km);

        // Inserts a candidate, computing its score first. O(log N).
        void insert(Candidate c);

        // Removes and returns the highest-priority candidate. O(log N).
        Candidate extractMax();

        bool empty() const { return data_.empty(); }
        size_t size() const { return data_.size(); }

        // Useful for producing a full ranked "match run" list.
        std::vector<Candidate> peekAllSortedDescending() const;

    private:
        std::vector<Candidate> data_;

        void bubbleUp(size_t index);
        void sinkDown(size_t index);
        static size_t parentOf(size_t i) { return (i - 1) / 2; }
        static size_t leftOf(size_t i)   { return 2 * i + 1; }
        static size_t rightOf(size_t i)  { return 2 * i + 2; }
    };

} // namespace organmatch
