import React, { useState } from 'react';
import axios from 'axios';
import { Container, TextField, Button, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import TestInput from './TestInput' 
//Comment for forcing update.

interface StockData {
  ticker: string;
  shortName?: string;
  currentPrice?: number;
  previousClose?: number;
  open?: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  marketCap?: number;
  trailingPE?: number;
  forwardPE?: number;
  dividendYield?: number;
  sector?: string;
  industry?: string;
}

function App() {
  const [ticker, setTicker] = useState('AAPL');
  const [data, setData] = useState<StockData | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStock = async () => {
    setLoading(true);
    setError('');
    setData(null);
    setHistory([]);
    try {
      const res = await axios.get(`https://stock-screener-teh0.onrender.com/stocks?ticker=${ticker}`);
      setData(res.data);
      const histRes = await axios.get(`https://stock-screener-teh0.onrender.com/stocks/history?ticker=${ticker}`);
      setHistory(histRes.data.history);
    } catch (err) {
      setError('Failed to fetch stock data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: 40 }}>
      <Typography variant="h4" gutterBottom>Stock Screener</Typography>
      <TextField
        label="Ticker"
        value={ticker}
        onChange={e => setTicker(e.target.value.toUpperCase())}
        style={{ marginRight: 16 }}
      />
      <Button variant="contained" onClick={fetchStock} disabled={loading}>
        Search
      </Button>
      {loading && <CircularProgress style={{ marginTop: 20 }} />}
      {error && <Typography color="error" style={{ marginTop: 20 }}>{error}</Typography>}
      {data && (
        <Card style={{ marginTop: 30 }}>
          <CardContent>
            <Typography variant="h5">{data.shortName} ({data.ticker})</Typography>
            <Typography>Current Price: ${data.currentPrice}</Typography>
            <Typography>Previous Close: ${data.previousClose}</Typography>
            <Typography>Open: ${data.open}</Typography>
            <Typography>Day High: ${data.dayHigh}</Typography>
            <Typography>Day Low: ${data.dayLow}</Typography>
            <Typography>Volume: {data.volume?.toLocaleString()}</Typography>
            <Typography>Market Cap: ${data.marketCap?.toLocaleString()}</Typography>
            <Typography>Trailing P/E: {data.trailingPE}</Typography>
            <Typography>Forward P/E: {data.forwardPE}</Typography>
            <Typography>Dividend Yield: {data.dividendYield}</Typography>
            <Typography>Sector: {data.sector}</Typography>
            <Typography>Industry: {data.industry}</Typography>
          </CardContent>
        </Card>
      )}
      {history.length > 0 && (
        <Card style={{ marginTop: 30 }}>
          <CardContent>
            <Typography variant="h6">5-Year Stat History</Typography>
            {Object.keys(history[0] || {})
              .filter(key => key !== 'Date' && typeof history[0][key] === 'number')
              .map((key) => (
                <div key={key} style={{ marginBottom: 40 }}>
                  <Typography variant="subtitle1" gutterBottom>{key}</Typography>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={history}>
                      <XAxis dataKey="Date" tick={false} />
                      <YAxis domain={['auto', 'auto']} />
                      <Tooltip />
                      <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                      <Line type="monotone" dataKey={key} stroke="#8884d8" dot={false} name={key} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </Container>
  );
}

export default App;
