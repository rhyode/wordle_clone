// wordle_clone.cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
#include <random>  
#include <fstream>
using namespace std;


bool supports_color() {
    const char* term = getenv("TERM");
    return term && string(term) != "dumb";
}

string colorize(const string &s, const string &code) {
    if (!supports_color()) return s;
    return "\033[" + code + "m" + s + "\033[0m";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    // Small embedded list of 5-letter words
    vector<string> words;
    ifstream file("words.txt");
    string w;
    while (file >> w) {
        transform(w.begin(), w.end(), w.begin(), ::tolower);
        if (w.size() == 5)  // only keep 5-letter words
            words.push_back(w);
    }
    file.close();

    // Normalize to lower
    for (auto &w : words) {
        transform(w.begin(), w.end(), w.begin(), ::tolower);
    }

    // pick a secret
    random_device rd;
    mt19937 rng(rd());
    uniform_int_distribution<int> dist(0, (int)words.size()-1);
    string secret = words[dist(rng)];

    const int MAX_TRIES = 6;
    cout << "=== WORDLE CLONE (console) ===\n";
    cout << "Guess the 5-letter word. You have " << MAX_TRIES << " tries.\n";
    cout << "Feedback: " << colorize("G","32") << "=correct, " << colorize("Y","33") << "=present, _=absent\n\n";

    for (int attempt = 1; attempt <= MAX_TRIES; ++attempt) {
        string guess;
        while (true) {
            cout << "Try " << attempt << "/" << MAX_TRIES << " > ";
            if (!(cin >> guess)) return 0;
            // to lowercase
            if (guess.size() != 5) {
                cout << "Enter a 5-letter word.\n";
                continue;
            }
            transform(guess.begin(), guess.end(), guess.begin(), ::tolower);
            // check if in list (simple validation)
            if (find(words.begin(), words.end(), guess) == words.end()) {
                cout << "Word not in list. Try another.\n";
                continue;
            }
            break;
        }

        // compute feedback with counts to handle duplicates
        string result(5, '_');
        vector<int> secret_count(26, 0);
        for (int i = 0; i < 5; ++i) {
            if (secret[i] != guess[i]) secret_count[secret[i]-'a']++;
        }
        // first pass: greens
        for (int i = 0; i < 5; ++i) {
            if (guess[i] == secret[i]) {
                result[i] = 'G'; // green
            }
        }
        // second pass: yellows or gray
        for (int i = 0; i < 5; ++i) {
            if (result[i] == 'G') continue;
            int idx = guess[i]-'a';
            if (secret_count[idx] > 0) {
                result[i] = 'Y';
                secret_count[idx]--;
            } else {
                result[i] = '_';
            }
        }

        // Show feedback nicely
        for (int i = 0; i < 5; ++i) {
            string ch(1, guess[i]);
            if (result[i] == 'G') {
                cout << colorize(ch, "42;30") << " "; // green background black text
            } else if (result[i] == 'Y') {
                cout << colorize(ch, "43;30") << " "; // yellow background
            } else {
                cout << colorize(ch, "47;30") << " "; // gray/white background
            }
        }
        
        cout << "\n\n";

        if (guess == secret) {
            cout << "🎉 You got it in " << attempt << " tries! The word was \"" << secret << "\".\n";
            return 0;
        }
    }

    cout << "Out of tries — the word was: " << secret << "\n";
    cout << "Good attempt! You can expand the word list or add hints next.\n";
    return 0;
}
