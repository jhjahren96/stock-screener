import React, { useState } from 'react';
import axios from 'axios';
import { Container, TextField, Button, Card, CardContent, Typography, CircularProgress, Tabs, Tab, Box, MenuItem, Slider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

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

interface ValueResult {
  ticker: string;
  shortName?: string;
  peg?: number;
  forward_pe?: number;
  pe_ttm?: number;
  ps?: number;
  pb?: number;
  projected_growth?: number;
  score: number;
}

function App() {
  const [tab, setTab] = useState(0);

  // Dashboard states
  const [ticker, setTicker] = useState('AAPL');
  const [data, setData] = useState<StockData | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Value Screener states
  const [exchange, setExchange] = useState('NASDAQ');
  const [weights, setWeights] = useState({
    peg: 1,
    forward_pe: 1,
    pe_ttm: 1,
    ps: 1,
    pb: 1,
    projected_growth: 1,
  });
  const [screenerLoading, setScreenerLoading] = useState(false);
  const [screenerError, setScreenerError] = useState('');
  const [results, setResults] = useState<ValueResult[]>([]);

  const handleTabChange = (_: any, newValue: number) => setTab(newValue);

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

  const handleWeightChange = (key: string, value: number) => {
    setWeights(w => ({ ...w, [key]: value }));
  };

  const runScreener = async () => {
    setScreenerLoading(true);
    setScreenerError('');
    setResults([]);
    try {
      const params = new URLSearchParams({
        exchange,
        peg_weight: weights.peg.toString(),
        forward_pe_weight: weights.forward_pe.toString(),
        pe_ttm_weight: weights.pe_ttm.toString(),
        ps_weight: weights.ps.toString(),
        pb_weight: weights.pb.toString(),
        projected_growth_weight: weights.projected_growth.toString(),
        limit: '20',
      });
      const res = await axios.get(`https://stock-screener-teh0.onrender.com/screener/value?${params.toString()}`);
      setResults(res.data.results);
    } catch (err) {
      setScreenerError('Failed to fetch screener results.');
    } finally {
      setScreenerLoading(false);
    }
  };

  return (
    <Container maxWidth="md" style={{ marginTop: 40 }}>
      <Tabs value={tab} onChange={handleTabChange} centered>
        <Tab label="Dashboard" />
        <Tab label="Value Screener" />
      </Tabs>
      <Box hidden={tab !== 0}>
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
      </Box>
      <Box hidden={tab !== 1}>
        <Typography variant="h4" gutterBottom>Value Stock Screener</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            select
            label="Exchange"
            value={exchange}
            onChange={e => setExchange(e.target.value)}
            style={{ minWidth: 120 }}
          >
            <MenuItem value="NASDAQ">NASDAQ</MenuItem>
            <MenuItem value="NYSE">NYSE</MenuItem>
          </TextField>
          {Object.entries(weights).map(([key, value]) => (
            <Box key={key} style={{ minWidth: 120 }}>
              <Typography variant="caption">{key.replace('_', ' ').toUpperCase()}</Typography>
              <Slider
                value={value}
                min={0}
                max={5}
                step={0.1}
                onChange={(_, v) => handleWeightChange(key, v as number)}
                valueLabelDisplay="auto"
              />
            </Box>
          ))}
          <Button variant="contained" onClick={runScreener} disabled={screenerLoading}>
            Screen
          </Button>
        </Box>
        {screenerLoading && <CircularProgress style={{ marginTop: 20 }} />}
        {screenerError && <Typography color="error" style={{ marginTop: 20 }}>{screenerError}</Typography>}
        {results.length > 0 && (
          <TableContainer component={Paper} style={{ marginTop: 30 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Ticker</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>PEG</TableCell>
                  <TableCell>Forward P/E</TableCell>
                  <TableCell>P/E (TTM)</TableCell>
                  <TableCell>P/S</TableCell>
                  <TableCell>P/B</TableCell>
                  <TableCell>Proj. Growth</TableCell>
                  <TableCell>Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((row) => (
                  <TableRow key={row.ticker}>
                    <TableCell>{row.ticker}</TableCell>
                    <TableCell>{row.shortName}</TableCell>
                    <TableCell>{row.peg ?? '-'}</TableCell>
                    <TableCell>{row.forward_pe ?? '-'}</TableCell>
                    <TableCell>{row.pe_ttm ?? '-'}</TableCell>
                    <TableCell>{row.ps ?? '-'}</TableCell>
                    <TableCell>{row.pb ?? '-'}</TableCell>
                    <TableCell>{row.projected_growth ?? '-'}</TableCell>
                    <TableCell>{row.score.toFixed(3)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  );
}

export default App; 