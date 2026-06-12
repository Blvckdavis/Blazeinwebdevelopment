#include <iostream>
#include <fstream>
#include <string>

using namespace std;

// The Core Cipher Function
void processFile(const string& filename, char key) {
    // 1. Open the file in binary mode to read raw data
    ifstream inputFile(filename, ios::binary);
    if (!inputFile) {
        cout << "[ERROR] System could not locate file: " << filename << "\n";
        cout << "Ensure the file exists in the same folder as this program.\n";
        return;
    }

    // 2. Read the entire file into a string buffer
    string content((istreambuf_iterator<char>(inputFile)), (istreambuf_iterator<char>()));
    inputFile.close();

    // 3. Apply the Bitwise XOR Cipher
    // This flips the binary bits of the text using your secret key.
    // Running it once scrambles it. Running it again with the same key unscrambles it!
    for (size_t i = 0; i < content.length(); ++i) {
        content[i] ^= key; 
    }

    // 4. Save the scrambled/unscrambled data to a new secure file
    string outputFilename = "secure_" + filename;
    ofstream outputFile(outputFilename, ios::binary);
    if (!outputFile) {
        cout << "[ERROR] Cannot write to output file.\n";
        return;
    }

    outputFile << content;
    outputFile.close();

    cout << "[SUCCESS] Protocol complete. Data saved as: " << outputFilename << "\n";
}

int main() {
    // Console UI Dashboard
    cout << "==========================================\n";
    cout << "   SECURE FILE ENCRYPTER / DECRYPTER\n";
    cout << "   System Core: C++ Infrastructure\n";
    cout << "==========================================\n\n";

    int choice;
    string filename;
    char key;

    cout << "Select Security Protocol:\n";
    cout << "1. Encrypt / Decrypt a File\n";
    cout << "2. Terminate Session\n";
    cout << "Enter command (1-2): ";
    cin >> choice;

    if (choice == 1) {
        cout << "\nEnter target filename (e.g., payload.txt): ";
        cin >> filename;
        
        cout << "Enter a single character cipher key (e.g., X): ";
        cin >> key;

        cout << "\nExecuting Bitwise Cipher...\n";
        processFile(filename, key);
    } else {
        cout << "Terminating system connection...\n";
    }

    return 0;
}