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

// Root Web Page with Input Form
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bidmoh Airtime Reseller</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
        h2 { color: #333; text-align: center; margin-bottom: 20px; }
        label { display: block; margin-top: 15px; font-weight: bold; color: #555; }
        input { width: 100%; padding: 10px; margin-top: 5px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        button { width: 100%; background: #28a745; color: white; border: none; padding: 12px; margin-top: 20px; border-radius: 4px; font-size: 16px; cursor: pointer; }
        button:hover { background: #218838; }
        #status { margin-top: 15px; text-align: center; font-weight: bold; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Airtime Reseller</h2>
        <label>Phone Number (e.g. 2547XXXXXXXX)</label>
        <input type="text" id="phone" value="2547" />
        <label>Amount (KES)</label>
        <input type="number" id="amount" value="10" />
        <button onclick="triggerStkPush()">Buy Airtime</button>
        <div id="status"></div>
      </div>
      <script>
        async function triggerStkPush() {
          const phoneNumber = document.getElementById('phone').value;
          const amount = document.getElementById('amount').value;
          const statusDiv = document.getElementById('status');
          
          statusDiv.style.color = '#007bff';
          statusDiv.innerText = 'Sending STK Push... Check your phone!';

          try {
            const res = await fetch('/api/stk-push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phoneNumber, amount })
            });
            const data = await res.json();
            if (data.success) {
              statusDiv.style.color = '#28a745';
              statusDiv.innerText = 'STK Push sent successfully! Enter your PIN on your phone.';
            } else {
              statusDiv.style.color = '#dc3545';
              statusDiv.innerText = 'Error: ' + JSON.stringify(data.error);
            }
          } catch (err) {
            statusDiv.style.color = '#dc3545';
            statusDiv.innerText = 'Network error occurred.';
          }
        }
      </script>
    </body>
    </html>
  `);
});

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
      PartyA: phoneNumber,
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