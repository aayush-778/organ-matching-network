#include "max_heap.h"
#include <algorithm>
#include <utility>

namespace organmatch {
    
    double MaxHeap::computeScore(double urgency, double waiting_years, double distance_km) {
        return (urgency*10.0 + waiting_years*2.0 - distance_km*5.0);
    }

    static bool priorityComparison(const Candidate& a, const Candidate& b) {
        if (a.score != b.score) {
            return a.score > b.score;
        }
        // If scores are identical, prioritize the longer wait time
        if (a.waiting_years != b.waiting_years) {
            return a.waiting_years > b.waiting_years;
        }
        // Final fallback using unique identifier values
        return a.patient_id < b.patient_id;
    }

    void MaxHeap::insert(Candidate c) {
        c.score = computeScore(c.urgency, c.waiting_years, c.distance_km);

        data_.push_back(std::move(c));
        bubbleUp(data_.size() - 1);
    }

    void MaxHeap::bubbleUp(size_t idx) {
        while(idx > 0) {
            size_t p = parentOf(idx);

            if(!priorityComparison(data_[idx], data_[p])) break;

            std::swap(data_[p], data_[idx]);
            idx = p;
        }
    }

    Candidate MaxHeap::extractMax() {
        if(data_.empty()) {
            throw std::out_of_range("extractMax called on empty heap");
        }

        // Move out the high priority candidate
        Candidate top = data_[0];
        data_[0] = data_.back();
        data_.pop_back();

        if(!data_.empty()) {
            sinkDown(0);
        }

        return top;
    }

    void MaxHeap::sinkDown(size_t idx) {
        size_t n = data_.size();
        while(true) {
            size_t left = leftOf(idx);
            size_t right = rightOf(idx);
            size_t currMx = idx;

            if(left < n && priorityComparison(data_[left], data_[currMx])) currMx = left;
            if(right < n && priorityComparison(data_[right], data_[currMx])) currMx = right;

            if(currMx == idx) break;
            std::swap(data_[idx], data_[currMx]);
            idx = currMx;
        }
    }

    std::vector<Candidate> MaxHeap::peekAllSortedDescending() const {
        std::vector<Candidate> cpy = data_;
        std::sort(cpy.begin(), cpy.end(), priorityComparison);
        return cpy;
    }

} // namespace organmatch
