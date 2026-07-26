#pragma once
#include <vector>
#include <optional>
#include <stdexcept>
#include <utility>

// ============================================================================
// BACKPLANE INGESTION LAYER: Bounded Circular Queue (Ring Buffer)
//
// Fixed-capacity, array-backed FIFO queue. Two pointers (head, tail) chase
// each other around a fixed-size array so the buffer never reallocates and
// never grows unbounded under a traffic spike.
//
// NOTE: As stated in the system spec, this component requires external
// synchronization (e.g., std::mutex) if read/written across multiple threads.
// ============================================================================

namespace organmatch {
    
    template <typename T>
    class CircularQueue {
        public: 
            explicit CircularQueue(size_t capacity)
            : buffer_(capacity), capacity_(capacity), head_(0), tail_(0), count_(0) {
                if(capacity==0) {
                    throw std::invalid_argument("Circular Queue capacity must be greater than 0\n");
                }
                isPowOf2 = (capacity & (capacity - 1)) == 0;
            }

            // pushes item, returns false if full
            bool push(const T& item) {
                if(isFull()) return false;
                buffer_[tail_] = item;
                advancePointer(tail_);
                ++count_;
                return true;
            }

            // pops item from the queue, returns false if empty
            std::optional<T> pop() {
                if(isEmpty()) return std::nullopt;

                T item = std::move(buffer_[head_]);
                advancePointer(head_);
                --count_;
                return item;
            }

            bool isFull() const { return count_ == capacity_; }
            bool isEmpty() const { return count_ == 0; }
            size_t size() const  { return count_; }
            size_t capacity() const { return capacity_; }

        private:
            inline void advancePointer(size_t& ptr) {
                if(isPowOf2) {
                    ptr = (ptr + 1) & (capacity_ - 1);
                }else {
                    ptr = (ptr + 1) % capacity_;
                }
            }

            std::vector<T> buffer_;
            size_t capacity_;
            size_t head_; 
            size_t tail_; 
            size_t count_;
            bool isPowOf2;
    };

} // namespace organmatch
