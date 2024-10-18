import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendClaimSubmissionEmail, sendClaimStatusUpdateEmail, sendVerificationEmail, sendTicketUpdateEmail } from './src/services/emailService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

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
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      res.status(400).json({ error: 'Email already registered' });
    } else {
      res.status(500).json({ error: 'An error occurred while registering the user' });
    }
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

// Create a new claim
app.post('/api/claims', authenticateToken, async (req, res) => {
  try {
    const newClaim = await prisma.claim.create({
      data: {
        ...req.body,
        status: 'Pending'
      }
    });
    await sendClaimSubmissionEmail(newClaim.email, newClaim);
    res.status(201).json(newClaim);
  } catch (error) {
    console.error('Error creating claim:', error);
    res.status(500).json({ error: 'An error occurred while creating the claim' });
  }
});

// Get all claims
app.get('/api/claims', authenticateToken, async (req, res) => {
  try {
    const claims = await prisma.claim.findMany();
    res.json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({ error: 'An error occurred while fetching claims' });
  }
});

// Get a specific claim
app.get('/api/claims/:id', authenticateToken, async (req, res) => {
  try {
    const claim = await prisma.claim.findUnique({
      where: { id: req.params.id }
    });
    if (claim) {
      res.json(claim);
    } else {
      res.status(404).json({ error: 'Claim not found' });
    }
  } catch (error) {
    console.error('Error fetching claim:', error);
    res.status(500).json({ error: 'An error occurred while fetching the claim' });
  }
});

// Update a claim
app.patch('/api/claims/:id', authenticateToken, async (req, res) => {
  try {
    const updatedClaim = await prisma.claim.update({
      where: { id: req.params.id },
      data: req.body
    });
    await sendClaimStatusUpdateEmail(updatedClaim.email, updatedClaim);
    res.json(updatedClaim);
  } catch (error) {
    console.error('Error updating claim:', error);
    res.status(500).json({ error: 'An error occurred while updating the claim' });
  }
});

// Create a new return
app.post('/api/returns', authenticateToken, async (req, res) => {
  try {
    const newReturn = await prisma.return.create({
      data: {
        ...req.body,
        status: 'Pending'
      }
    });
    res.status(201).json(newReturn);
  } catch (error) {
    console.error('Error creating return:', error);
    res.status(500).json({ error: 'An error occurred while creating the return' });
  }
});

// Get all returns
app.get('/api/returns', authenticateToken, async (req, res) => {
  try {
    const returns = await prisma.return.findMany();
    res.json(returns);
  } catch (error) {
    console.error('Error fetching returns:', error);
    res.status(500).json({ error: 'An error occurred while fetching returns' });
  }
});

// Get a specific return
app.get('/api/returns/:id', authenticateToken, async (req, res) => {
  try {
    const returnItem = await prisma.return.findUnique({
      where: { id: req.params.id }
    });
    if (returnItem) {
      res.json(returnItem);
    } else {
      res.status(404).json({ error: 'Return not found' });
    }
  } catch (error) {
    console.error('Error fetching return:', error);
    res.status(500).json({ error: 'An error occurred while fetching the return' });
  }
});

// Update a return
app.patch('/api/returns/:id', authenticateToken, async (req, res) => {
  try {
    const updatedReturn = await prisma.return.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(updatedReturn);
  } catch (error) {
    console.error('Error updating return:', error);
    res.status(500).json({ error: 'An error occurred while updating the return' });
  }
});

// Create a new ticket
app.post('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const { orderNumber, subject, message } = req.body;
    const newTicket = await prisma.ticket.create({
      data: {
        orderNumber,
        subject,
        status: 'Open',
        userId: req.user.id,
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
    const tickets = await prisma.ticket.findMany({
      where: { userId: req.user.id },
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
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: { messages: true },
    });
    if (ticket && ticket.userId === req.user.id) {
      res.json(ticket);
    } else {
      res.status(404).json({ error: 'Ticket not found' });
    }
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'An error occurred while fetching the ticket' });
  }
});

// Add a message to a ticket
app.post('/api/tickets/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
    });

    if (!ticket || ticket.userId !== req.user.id) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const newMessage = await prisma.message.create({
      data: {
        content: message,
        isAdminReply: false,
        ticketId: ticket.id,
      },
    });

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: 'Awaiting Admin Reply' },
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error adding message to ticket:', error);
    res.status(500).json({ error: 'An error occurred while adding the message' });
  }
});

// Admin routes
app.get('/api/admin/tickets', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        messages: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'An error occurred while fetching tickets' });
  }
});

app.post('/api/admin/tickets/:id/reply', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const { message } = req.body;
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const newMessage = await prisma.message.create({
      data: {
        content: message,
        isAdminReply: true,
        ticketId: ticket.id,
      },
    });

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: 'Awaiting User Reply' },
    });

    await sendTicketUpdateEmail(ticket.user.email, ticket.orderNumber);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error replying to ticket:', error);
    res.status(500).json({ error: 'An error occurred while replying to the ticket' });
  }
});

app.patch('/api/admin/tickets/:id/close', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const updatedTicket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { status: 'Closed' },
    });
    res.json(updatedTicket);
  } catch (error) {
    console.error('Error closing ticket:', error);
    res.status(500).json({ error: 'An error occurred while closing the ticket' });
  }
});

// Get brands
app.get('/api/brands', async (req, res) => {
  try {
    const brands = await prisma.brand.findMany();
    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'An error occurred while fetching brands' });
  }
});

// Check if any user exists
app.get('/api/users/check', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({ exists: userCount > 0 });
  } catch (error) {
    console.error('Error checking user existence:', error);
    res.status(500).json({ error: 'Failed to check user existence' });
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
