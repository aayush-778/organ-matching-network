#pragma once
#include <string>
#include <unordered_map>
#include <memory>
#include <vector>

// ============================================================================
// FRONT END SEARCH LAYER: prefix tree for medical/hospital/organ lookup
//
// Custom pointer-based trie. Each node holds a map of child characters to
// child nodes plus a flag marking whether a complete word ends there.
// Lookup/insert cost is O(L) where L = length of the search term, independent
// of how many total entries are stored -- this is what makes it faster than
// a linear scan or a SQL LIKE '%term%' query as the search grows.
// ============================================================================

namespace organmatch {

    struct TrieNode {
        std::unordered_map<char, std::unique_ptr<TrieNode>> children;
        bool end_of_word = false;
    };

    class Trie {
        public:
            Trie(): root_(std::make_unique<TrieNode>()) {}

            // Adds a term into the tree (forces it lowercase automatically)
            void insert(const std::string& term);

            // Checks if a complete, exact word exists inside the tree
            bool search(const std::string& term) const;

            // Returns a list of sorted matching words starting with the given prefix
            std::vector<std::string> autocomplete(const std::string& prefix, size_t limit = 10) const;

        private:
            std::unique_ptr<TrieNode> root_;

            static std::string toLower(const std::string& s);

            void collectWords(const TrieNode* node, std::string pref_so_far,
                                std::vector<std::string>& out, size_t limit) const;
    };
    
} // namespace organmatch
