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

app.use(express.json());
app.use(cors());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    console.log('No token provided');
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification failed:', err);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

// Debug route to check if the server is running
app.get('/api/debug', (req, res) => {
  res.json({ message: 'Server is running' });
});

// User registration route
app.post('/api/register', async (req, res) => {
  console.log('Received registration request:', req.body);
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

// Email verification route
app.get('/api/verify-email/:token', async (req, res) => {
  console.log('Received email verification request:', req.params);
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

// Resend verification email
app.post('/api/resend-verification', async (req, res) => {
  console.log('Received resend verification request:', req.body);
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    const verificationToken = crypto.randomBytes(20).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken },
    });

    await sendVerificationEmail(email, verificationToken);

    res.json({ message: 'Verification email resent successfully' });
  } catch (error) {
    console.error('Error resending verification email:', error);
    res.status(500).json({ error: 'An error occurred while resending the verification email' });
  }
});

// User login route
app.post('/api/login', async (req, res) => {
  console.log('Received login request:', req.body);
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
  console.log('Received create ticket request:', req.body);
  try {
    const { orderNumber, subject, message } = req.body;
    const userId = req.user.id;

    const existingTicket = await prisma.ticket.findFirst({
      where: {
        orderNumber,
        userId,
        status: { not: 'Closed' },
      },
    });

    if (existingTicket) {
      return res.status(400).json({ error: 'An open ticket already exists for this order number' });
    }

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
  console.log('Received get tickets request for user:', req.user.id);
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

// Add a message to a ticket
app.post('/api/tickets/:id/messages', authenticateToken, async (req, res) => {
  console.log('Received add message request:', req.params, req.body);
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
  console.log('Received admin get tickets request');
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

// Admin route to get a specific ticket
app.get('/api/admin/tickets/:id', authenticateToken, async (req, res) => {
  console.log('Received admin get specific ticket request:', req.params);
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { id } = req.params;
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        messages: true,
      },
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

app.post('/api/admin/tickets/:id/reply', authenticateToken, async (req, res) => {
  console.log('Received admin reply to ticket request:', req.params, req.body);
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
  console.log('Received admin close ticket request:', req.params);
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

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
