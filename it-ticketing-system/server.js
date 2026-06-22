const express = require('express');
const app = express();
const PORT = 3000;

// MIDDLEWARE: Required to parse incoming JSON payloads from HTTP requests. 
// Without this, req.body will be undefined.
app.use(express.json());

// IN-MEMORY DATABASE: Used for testing purposes before connecting a real database (like MongoDB or PostgreSQL).
// Note: Data here will reset every time the server restarts.
let tickets = [];

// Base route to verify the server is responding on the main URL
app.get('/', (req, res) => {
    res.send('Welcome to the IT Ticketing System API!');
});

// ==========================================
// API ENDPOINTS (CRUD OPERATIONS)
// ==========================================

// 1. READ: Fetch all current tickets
app.get('/api/tickets', (req, res) => {
    res.json(tickets);
});

// 2. CREATE: Generate a new ticket from the request body
app.post('/api/tickets', (req, res) => {
    const newTicket = {
        // Simple ID generation for the mock database
        id: tickets.length + 1,
        title: req.body.title,
        description: req.body.description,
        status: 'Open',
        date: new Date().toLocaleString()
    };

    tickets.push(newTicket);

    // Status 201 specifically communicates that a new resource was "Created"
    res.status(201).json({
        message: 'Ticket created successfully!',
        ticket: newTicket
    });
});

// 3. UPDATE: Modify an existing ticket's status or details by its ID
// The ":id" in the URL is a parameter we can grab to know WHICH ticket to update
app.put('/api/tickets/:id', (req, res) => {
    const ticketId = parseInt(req.params.id);
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);

    // Error handling: If the ticket doesn't exist, stop and return a 404 (Not Found)
    if (ticketIndex === -1) {
        return res.status(404).json({ message: 'Ticket not found' });
    }

    // Update the ticket while keeping existing data intact if new data isn't provided
    tickets[ticketIndex] = {
        ...tickets[ticketIndex],
        title: req.body.title || tickets[ticketIndex].title,
        description: req.body.description || tickets[ticketIndex].description,
        status: req.body.status || tickets[ticketIndex].status
    };

    res.json({
        message: 'Ticket updated successfully!',
        ticket: tickets[ticketIndex]
    });
});

// 4. DELETE: Remove a ticket by its ID
app.delete('/api/tickets/:id', (req, res) => {
    const ticketId = parseInt(req.params.id);
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);

    if (ticketIndex === -1) {
        return res.status(404).json({ message: 'Ticket not found' });
    }

    // Splice removes the item at the specific index from our array
    tickets.splice(ticketIndex, 1);

    res.json({ message: 'Ticket deleted successfully!' });
});

// ==========================================
// SERVER INITIALIZATION
// ==========================================

app.listen(PORT, () => {
    console.log(`Server is successfully running on http://localhost:${PORT}`);
});