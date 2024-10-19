import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import cors from 'cors';
import { sendClaimSubmissionEmail, sendClaimStatusUpdateEmail, sendVerificationEmail, sendTicketUpdateEmail } from './src/services/emailService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// User existence check
app.get('/api/users/check', async (req, res) => {
  try {
    const adminUser = await prisma.user.findFirst({ where: { isAdmin: true } });
    res.json({ exists: !!adminUser });
  } catch (error) {
    console.error('Error checking user existence:', error);
    res.status(500).json({ error: 'An error occurred while checking user existence' });
  }
});

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(20).toString('hex');

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        verificationToken,
      },
    });

    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({ message: 'User registered. Please check your email for verification.' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'An error occurred while registering the user' });
  }
});

// Email verification
app.get('/api/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const user = await prisma.user.findFirst({ where: { verificationToken: token } });

    if (!user) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, verificationToken: null },
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ error: 'An error occurred while verifying the email' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && await bcrypt.compare(password, user.password)) {
      if (!user.isEmailVerified) {
        return res.status(403).json({ error: 'Please verify your email before logging in' });
      }
      const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token, user: { id: user.id, email: user.email, isAdmin: user.isAdmin } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

// Create a new ticket
app.post('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const { orderNumber, subject, message } = req.body;
    const userId = req.user.id;

    const newTicket = await prisma.ticket.create({
      data: {
        orderNumber,
        subject,
        status: 'Open',
        userId,
        messages: {
          create: {
            content: message,
            isAdminReply: false,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    res.status(201).json(newTicket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'An error occurred while creating the ticket' });
  }
});

// Get all tickets for a user
app.get('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const tickets = await prisma.ticket.findMany({
      where: { userId },
      include: { messages: true },
    });
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'An error occurred while fetching tickets' });
  }
});

// Get a specific ticket
app.get('/api/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const ticket = await prisma.ticket.findFirst({
      where: { 
        id,
        userId,
      },
      include: { messages: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'An error occurred while fetching the ticket' });
  }
});

// Add a message to a ticket
app.post('/api/tickets/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!ticket || ticket.userId !== userId) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const newMessage = await prisma.message.create({
      data: {
        content: message,
        isAdminReply: false,
        ticketId: id,
      },
    });

    await prisma.ticket.update({
      where: { id },
      data: { status: 'Awaiting Admin Reply' },
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error adding message to ticket:', error);
    res.status(500).json({ error: 'An error occurred while adding the message' });
  }
});

// Admin routes for managing tickets
app.get('/api/admin/tickets', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const tickets = await prisma.ticket.findMany({
      include: { messages: true, user: true },
    });
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets for admin:', error);
    res.status(500).json({ error: 'An error occurred while fetching tickets' });
  }
});

app.post('/api/admin/tickets/:id/reply', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const { id } = req.params;
    const { message } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const newMessage = await prisma.message.create({
      data: {
        content: message,
        isAdminReply: true,
        ticketId: id,
      },
    });

    await prisma.ticket.update({
      where: { id },
      data: { status: 'Awaiting User Reply' },
    });

    await sendTicketUpdateEmail(ticket.user.email, ticket.orderNumber);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error adding admin reply to ticket:', error);
    res.status(500).json({ error: 'An error occurred while adding the reply' });
  }
});

app.patch('/api/admin/tickets/:id/close', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const { id } = req.params;

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { status: 'Closed' },
    });

    res.json(updatedTicket);
  } catch (error) {
    console.error('Error closing ticket:', error);
    res.status(500).json({ error: 'An error occurred while closing the ticket' });
  }
});

// Manual admin verification route (for development/testing purposes only)
app.post('/api/verify-admin', async (req, res) => {
  console.log('Received manual admin verification request');
  try {
    const { email, secretKey } = req.body;

    // Check if the secret key matches (use a strong, unique key in production)
    if (secretKey !== process.env.ADMIN_VERIFICATION_SECRET) {
      return res.status(403).json({ error: 'Invalid secret key' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ error: 'User is not an admin' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, verificationToken: null },
    });

    res.json({ message: 'Admin account verified successfully' });
  } catch (error) {
    console.error('Error verifying admin account:', error);
    res.status(500).json({ error: 'An error occurred while verifying the admin account' });
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
