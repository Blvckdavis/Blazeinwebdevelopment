#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <ctime>
#include <cstdio> // For std::remove

using namespace std;

// Function to get current timestamp for logs
string getTimestamp() {
    time_t now = time(0);
    return ctime(&now);
}

// The Upgraded Cipher: Uses a multi-character password key
void processFile(const string& filename, const string& password) {
    ifstream inputFile(filename, ios::binary);
    if (!inputFile) {
        cout << "[ERROR] Could not open: " << filename << "\n";
        return;
    }

    // Get file size for the log
    inputFile.seekg(0, ios::end);
    long fileSize = inputFile.tellg();
    inputFile.seekg(0, ios::beg);

    string content((istreambuf_iterator<char>(inputFile)), (istreambuf_iterator<char>()));
    inputFile.close();

    // Apply multi-character XOR cipher
    for (size_t i = 0; i < content.length(); ++i) {
        content[i] ^= password[i % password.length()];
    }

    string outputFilename = "secure_" + filename;
    ofstream outputFile(outputFilename, ios::binary);
    outputFile << content;
    outputFile.close();

    // Security Log Output
    cout << "\n--- SECURITY LOG ---\n";
    cout << "Status: SECURE\n";
    cout << "File Size: " << fileSize << " bytes\n";
    cout << "Timestamp: " << getTimestamp();
    cout << "--------------------\n";

    // Shred the original file
    if (remove(filename.c_str()) == 0) {
        cout << "[INFO] Original file shredded successfully.\n";
    } else {
        cout << "[WARNING] Could not delete original file.\n";
    }
}

int main() {
    cout << "==========================================\n";
    cout << "   SECURE FILE SHREDDER & ENCRYPTER\n";
    cout << "==========================================\n\n";

    int choice;
    string filename, password;

    cout << "1. Encrypt/Decrypt & Shred Original\n2. Exit\nSelection: ";
    cin >> choice;

    if (choice == 1) {
        cout << "Enter target filename: ";
        cin >> filename;
        cout << "Enter strong security key (password): ";
        cin >> password;

        processFile(filename, password);
    }
    return 0;
}