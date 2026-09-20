import express from 'express';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Frontend UI
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bidmoh Airtime Store</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f4f4f9; margin: 0; }
        .card { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
        h2 { margin-top: 0; color: #333; }
        label { display: block; margin: 10px 0 5px; font-weight: bold; }
        input { width: 100%; padding: 10px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 5px; }
        button { width: 100%; padding: 12px; background: #28a745; color: white; border: none; border-radius: 5px; font-size: 16px; margin-top: 15px; cursor: pointer; }
        button:hover { background: #218838; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Buy Airtime via M-Pesa</h2>
        <form action="/api/buy-airtime" method="POST">
          <label for="phone">Phone Number (e.g. 254712345678):</label>
          <input type="text" id="phone" name="phone" placeholder="2547..." required>
          
          <label for="amount">Amount (KES):</label>
          <input type="number" id="amount" name="amount" placeholder="50" required>
          
          <button type="submit">Pay with M-Pesa</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

// Handle Airtime & M-Pesa STK Push
app.post('/api/buy-airtime', async (req, res) => {
  let { phone, amount } = req.body;
  
  // Format phone number to start with 254 if user typed 07...
  if (phone.startsWith('0')) {
    phone = '254' + phone.slice(1);
  }

  try {
    // 1. Get Daraja Access Token
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    const tokenResponse = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { headers: { Authorization: `Basic ${auth}` } }
    );
    const accessToken = tokenResponse.data.access_token;

    // 2. Prepare STK Push Parameters
    const shortCode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

    const stkResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phone,
        PartyB: shortCode,
        PhoneNumber: phone,
        CallBackURL: 'https://bidmoh-app.onrender.com/api/mpesa-callback',
        AccountReference: 'BidmohAirtime',
        TransactionDesc: 'Airtime Purchase'
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    res.send(`
      <h3>STK Push Sent!</h3>
      <p>Please check phone <b>${phone}</b> for M-Pesa prompt of KES ${amount}.</p>
      <a href="/">Make Another Purchase</a>
    `);
  } catch (error) {
    console.error('M-Pesa Error:', error.response?.data || error.message);
    res.status(500).send(`
      <h3>Payment Request Failed</h3>
      <p>Could not initiate M-Pesa STK push. Check your server logs and API keys.</p>
      <a href="/">Try Again</a>
    `);
  }
});

// M-Pesa Callback Endpoint (Safaricom pings this when payment succeeds/fails)
app.post('/api/mpesa-callback', (req, res) => {
  console.log('M-Pesa Callback received:', JSON.stringify(req.body, null, 2));
  // Here is where we will trigger Africa's Talking API to deliver the airtime once payment is confirmed!
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});