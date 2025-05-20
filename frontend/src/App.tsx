import React, { useState } from 'react';
import axios from 'axios';
import { Container, TextField, Button, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import TestInput from './TestInput' 

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStock = async () => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await axios.get(`https://stock-screener-teh0.onrender.com/stocks?ticker=${ticker}`);
      setData(res.data);
    } catch (err) {
      setError('Failed to fetch stock data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: 40 }}>
      <TestInput />
    </Container>
  );
}

export default App;
