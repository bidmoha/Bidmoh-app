} catch (error) {
  console.error('M-Pesa Full Error:', error.response?.data || error.message);
  const errorDetails = JSON.stringify(error.response?.data || error.message);
  res.status(500).send(`
    <h3>Payment Request Failed</h3>
    <p><b>Exact Error:</b> ${errorDetails}</p>
    <a href="/">Try Again</a>
  `);
}