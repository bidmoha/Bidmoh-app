import express from 'express';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Frontend HTML page
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
        <h2>Buy Airtime</h2>
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

// Endpoint to process airtime requests
app.post('/api/buy-airtime', (req, res) => {
  const { phone, amount } = req.body;
  console.log(`Received airtime request for ${phone} - Amount: KES ${amount}`);
  
  // M-Pesa STK push / Africa's Talking API calls will go here next
  res.send(`<h3>STK Push Sent!</h3><p>Check phone ${phone} to complete payment of KES ${amount}.</p><a href="/">Go Back</a>`);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});