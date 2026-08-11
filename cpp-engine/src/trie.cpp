// File: cpp-engine/src/trie.cpp
#include "trie.h"
#include <algorithm>
#include <cctype>

namespace organmatch {

    std::string Trie::toLower(const std::string& s) {
        std::string out = s;
        std::transform(out.begin(), out.end(), out.begin(),
                    [](unsigned char c) { return std::tolower(c); });
        return out;
    }
    
    void Trie::insert(const std::string& term) {
        std::string lower = toLower(term);
        TrieNode* node = root_.get();
        for(char c : lower) {
            auto it = node->children.find(c);
            if(it == node->children.end()) {
                auto newNode = std::make_unique<TrieNode>();
                TrieNode* raw = newNode.get();
                node->children[c] = std::move(newNode);
                node = raw;
            }else {
                node = it->second.get();
            }
        }

        node->end_of_word = true;
    }

    bool Trie::search(const std::string& term) const {
        std::string lower = toLower(term);
        const TrieNode* node = root_.get();
        for (char c : lower) {
            auto it = node->children.find(c);
            if (it == node->children.end()) return false;
            node = it->second.get();
        }
        return node->end_of_word;
    }

    void Trie::collectWords(const TrieNode* node, std::string prefix_so_far,
                        std::vector<std::string>& out, size_t limit) const {
        if(out.size() >= limit) return;

        if(node->end_of_word) {
            out.push_back(prefix_so_far);
            if(out.size() >= limit) return;
        }

        if(node->children.empty()) return;

        std::vector<char> keys;
        keys.reserve(node->children.size());
        for (const auto& kv : node->children) {
            keys.push_back(kv.first);
        }
        std::sort(keys.begin(), keys.end());

        for (char c : keys) {
            collectWords(node->children.at(c).get(), prefix_so_far + c, out, limit);
            if (out.size() >= limit) return;
        }
    }

    std::vector<std::string> Trie::autocomplete(const std::string& prefix, size_t limit) const {
        std::vector<std::string> results;
        std::string lower = toLower(prefix);
        TrieNode* node = root_.get();

        for(char c : prefix) {
            auto it = node->children.find(c);
            if(it == node->children.end()) return results;
            node = it->second.get();
        }

        collectWords(node, prefix, results, limit);
        return results;
    }

} // namespace organmatch
