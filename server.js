import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import cors from 'cors';
import { sendClaimSubmissionEmail, sendClaimStatusUpdateEmail, sendVerificationEmail, sendTicketUpdateEmail, sendPasswordResetEmail } from './src/services/emailService.js';

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

  if (token == null) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
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

// Forgot password
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
      });

      await sendPasswordResetEmail(email, resetToken);
    }

    // Always return a success message to prevent email enumeration
    res.json({ message: 'If an account exists for this email, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

// Reset password
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'An error occurred while resetting the password' });
  }
});

// Create a new ticket
app.post('/api/tickets', authenticateToken, async (req, res) => {
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

// Get user's tickets
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

// Admin routes for managing tickets, claims, and returns
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

app.patch('/api/admin/tickets/:id', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const { id } = req.params;
    const { status, message } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status,
        messages: message ? {
          create: {
            content: message,
            isAdminReply: true,
          },
        } : undefined,
      },
      include: { messages: true },
    });

    if (message) {
      await sendTicketUpdateEmail(ticket.user.email, ticket.orderNumber);
    }

    res.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'An error occurred while updating the ticket' });
  }
});

app.get('/api/claims', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const claims = await prisma.claim.findMany();
    res.json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({ error: 'An error occurred while fetching claims' });
  }
});

app.get('/api/returns', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const returns = await prisma.return.findMany();
    res.json(returns);
  } catch (error) {
    console.error('Error fetching returns:', error);
    res.status(500).json({ error: 'An error occurred while fetching returns' });
  }
});

// New routes for fetching details of claims, returns, and tickets
app.get('/api/claims/:id', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const { id } = req.params;
    const claim = await prisma.claim.findUnique({ where: { id } });
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    res.json(claim);
  } catch (error) {
    console.error('Error fetching claim details:', error);
    res.status(500).json({ error: 'An error occurred while fetching claim details' });
  }
});

app.get('/api/returns/:id', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const { id } = req.params;
    const returnItem = await prisma.return.findUnique({ where: { id } });
    if (!returnItem) {
      return res.status(404).json({ error: 'Return not found' });
    }
    res.json(returnItem);
  } catch (error) {
    console.error('Error fetching return details:', error);
    res.status(500).json({ error: 'An error occurred while fetching return details' });
  }
});

app.get('/api/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { messages: true, user: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (!isAdmin && ticket.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    res.status(500).json({ error: 'An error occurred while fetching ticket details' });
  }
});

app.get('/api/brands', async (req, res) => {
  try {
    const brands = await prisma.brand.findMany();
    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'An error occurred while fetching brands' });
  }
});
// Create verified admin
app.post('/api/create-verified-admin', async (req, res) => {
  try {
    const { email, password, secretKey } = req.body;

    if (secretKey !== process.env.ADMIN_CREATION_SECRET) {
      return res.status(403).json({ error: 'Invalid secret key' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        isAdmin: true,
        isEmailVerified: true,
      },
    });

    res.status(201).json({ message: 'Verified admin created successfully' });
  } catch (error) {
    console.error('Error creating verified admin:', error);
    res.status(500).json({ error: 'An error occurred while creating the verified admin' });
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
