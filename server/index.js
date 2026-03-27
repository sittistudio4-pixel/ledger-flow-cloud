const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const ExcelJS = require('exceljs');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- Database Connection ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Models ---
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
  whatsappNumber: { type: String }
});

const TransactionSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const User = mongoose.model('User', UserSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);

// --- Middleware ---
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// --- Routes ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  res.json({ token, user: { email: user.email, role: user.role } });
});

app.get('/api/transactions', authenticate, async (req, res) => {
  const transactions = await Transaction.find().sort({ date: -1 });
  res.json(transactions);
});

app.post('/api/transactions', authenticate, async (req, res) => {
  const transaction = new Transaction(req.body);
  await transaction.save();
  res.status(201).json(transaction);
});

app.put('/api/transactions/:id', authenticate, async (req, res) => {
  const transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(transaction);
});

app.delete('/api/transactions/:id', authenticate, async (req, res) => {
  await Transaction.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

// --- Reports & Automation ---
const sendWhatsAppReport = async () => {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  // Get today's transactions
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const transactions = await Transaction.find({
    date: { $gte: startOfDay }
  });
  
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
  
  const message = `*Daily Financial Report - ${new Date().toLocaleDateString()}*

Total Income: $${totalIncome}
Total Expenses: $${totalExpense}
Net Profit: $${totalIncome - totalExpense}

Transactions today: ${transactions.length}

_Sent by QuickBook Automation_`;

  await client.messages.create({
    from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
    to: `whatsapp:${process.env.ADMIN_PHONE_NUMBER}`,
    body: message
  });
};

// --- Daily Cron Job (6 PM) ---
cron.schedule('0 18 * * *', () => {
  console.log('Running daily WhatsApp automation at 6 PM...');
  sendWhatsAppReport();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));