app.post('/api/mpesa-callback', async (req, res) => 
  console.log('M-Pesa Callback received:', JSON.stringify(req.body, null, 2));

  const stkCallback = req.body.Body?.stkCallback;
  if (!stkCallback) {
    return res.status(400).send('Invalid callback structure');
  }

  const resultCode = stkCallback.ResultCode;

  if (resultCode === 0) {
    console.log('Payment successful! Dispatching airtime via Africa\'s Talking...');
    
    // Extract phone number and amount from callback metadata or fallback to test number
    const callbackItems = stkCallback.CallbackMetadata?.Item || [];
    const phoneItem = callbackItems.find(item => item.Name === 'PhoneNumber');
    const amountItem = callbackItems.find(item => item.Name === 'Amount');
    
    // Format phone number with a '+' prefix as required by Africa's Talking
    const phoneNumber = phoneItem ? `+${phoneItem.Value}` : '+254725141357';
    const amount = amountItem ? amountItem.Value : 10;

    try {
      const airtimeResponse = await africastalking.AIRTIME.send({
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