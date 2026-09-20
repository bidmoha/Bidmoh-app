import express from 'express';
import bodyParser from 'body-parser';
import AfricasTalking from 'africastalking';
import axios from 'axios';

const app = express();
app.use(bodyParser.json());

// Initialize Africa's Talking Sandbox Client
const afs = AfricasTalking({
  apiKey: process.env.AT_API_KEY || 'your_at_api_key',
  username: process.env.AT_USERNAME || 'sandbox'
});
const airtime = afs.AIRTIME;

// Helper function to get Safaricom Daraja Access Token
const getMpesaAccessToken = async () => {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const buffer = Buffer.from(`${consumerKey}:${consumerSecret}`);
  const auth = buffer.toString('base64');

  try {
    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: { Authorization: `Basic ${auth}` }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Error generating M-Pesa access token:', error.response?.data || error.message);
    throw error;
  }
};

// 1. Endpoint to Initiate M-Pesa STK Push
app.post('/api/stk-push', async (req, res) => {
  try {
    const { phoneNumber, amount } = req.body;
    const accessToken = await getMpesaAccessToken();

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const shortCode = process.env.MPESA_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY;
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

    const stkData = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount || 1,
      PartyA: phoneNumber, // Format: 2547XXXXXXXX
      PartyB: shortCode,
      PhoneNumber: phoneNumber,
      CallBackURL: 'https://bidmoh-app.onrender.com/api/mpesa-callback',
      AccountReference: 'AirtimeReseller',
      TransactionDesc: 'Airtime Purchase'
    };

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      stkData,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error('M-Pesa STK Push Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || error.message });
  }
});

// 2. M-Pesa Callback Endpoint (Triggers Africa's Talking Airtime on Success)
app.post('/api/mpesa-callback', async (req, res) => {
  console.log('M-Pesa Callback received:', JSON.stringify(req.body, null, 2));

  const stkCallback = req.body.Body?.stkCallback;
  if (!stkCallback) {
    return res.status(400).send('Invalid callback structure');
  }

  const resultCode = stkCallback.ResultCode;

  if (resultCode === 0) {
    console.log('Payment successful! Dispatching airtime via Africa\'s Talking...');
    
    // Extract phone number and amount from callback metadata
    const callbackItems = stkCallback.CallbackMetadata?.Item || [];
    const phoneItem = callbackItems.find(item => item.Name === 'PhoneNumber');
    const amountItem = callbackItems.find(item => item.Name === 'Amount');
    
    const phoneNumber = phoneItem ? `+${phoneItem.Value}` : '+254725141357';
    const amount = amountItem ? amountItem.Value : 10;

    try {
      const airtimeResponse = await airtime.send({
        phoneNumber: phoneNumber,
        amount: `${amount}`,
        currencyCode: 'KES'
      });
      console.log('Africa\'s Talking Airtime Response:', JSON.stringify(airtimeResponse));
    } catch (error) {
      console.error('Africa\'s Talking Airtime Error:', error);
    }
  } else {
    console.log(`Payment failed or cancelled. ResultCode: ${resultCode}`);
  }

  res.status(200).json({ Result: 'Received' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});