import React, { useState } from 'react';
import axios from 'axios';
import {
  Container, TextField, Button, Card, CardContent, Typography, CircularProgress, Tabs, Tab, Box, MenuItem, Slider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CssBaseline
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
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

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#181a20',
      paper: '#23272f',
    },
    text: {
      primary: '#fff',
      secondary: '#b0b8c1',
    },
    primary: {
      main: '#00bcd4',
    },
    secondary: {
      main: '#ff4081',
    },
  },
  typography: {
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#23272f',
          borderRadius: 16,
          boxShadow: '0 4px 24px 0 rgba(0,0,0,0.2)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          color: '#fff',
          borderColor: '#333',
        },
        head: {
          color: '#00bcd4',
          fontWeight: 700,
        },
      },
    },
  },
});

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
    fcf_yield: 1,
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
        fcf_yield_weight: weights.fcf_yield.toString(),
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
// Something is wrong with the backend, the fcf_yield is not being returned
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="lg" style={{ marginTop: 40 }}>
        <Tabs value={tab} onChange={handleTabChange} centered textColor="primary" indicatorColor="primary" sx={{ mb: 4 }}>
          <Tab label="Dashboard" />
          <Tab label="Value Screener" />
        </Tabs>
        <Box hidden={tab !== 0}>
          <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>Stock Screener</Typography>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <TextField
              label="Ticker"
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase())}
              sx={{ input: { color: 'white' }, label: { color: 'white' }, width: 120 }}
              variant="outlined"
            />
            <Button variant="contained" color="primary" onClick={fetchStock} disabled={loading} sx={{ height: 56 }}>
              Search
            </Button>
            {loading && <CircularProgress size={28} sx={{ ml: 2 }} />}
          </Box>
          {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
          {data && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h5" sx={{ color: 'secondary.main' }}>{data.shortName} ({data.ticker})</Typography>
                <Box display="flex" flexWrap="wrap" gap={3} mt={2}>
                  <Box><Typography>Current Price</Typography><Typography variant="h6">${data.currentPrice}</Typography></Box>
                  <Box><Typography>Previous Close</Typography><Typography variant="h6">${data.previousClose}</Typography></Box>
                  <Box><Typography>Open</Typography><Typography variant="h6">${data.open}</Typography></Box>
                  <Box><Typography>Day High</Typography><Typography variant="h6">${data.dayHigh}</Typography></Box>
                  <Box><Typography>Day Low</Typography><Typography variant="h6">${data.dayLow}</Typography></Box>
                  <Box><Typography>Volume</Typography><Typography variant="h6">{data.volume?.toLocaleString()}</Typography></Box>
                  <Box><Typography>Market Cap</Typography><Typography variant="h6">${data.marketCap?.toLocaleString()}</Typography></Box>
                  <Box><Typography>Trailing P/E</Typography><Typography variant="h6">{data.trailingPE}</Typography></Box>
                  <Box><Typography>Forward P/E</Typography><Typography variant="h6">{data.forwardPE}</Typography></Box>
                  <Box><Typography>Dividend Yield</Typography><Typography variant="h6">{data.dividendYield}</Typography></Box>
                  <Box><Typography>Sector</Typography><Typography variant="h6">{data.sector}</Typography></Box>
                  <Box><Typography>Industry</Typography><Typography variant="h6">{data.industry}</Typography></Box>
                </Box>
              </CardContent>
            </Card>
          )}
          {history.length > 0 && (
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={4}>
              {Object.keys(history[0] || {})
                .filter(key => key !== 'Date' && typeof history[0][key] === 'number')
                .map((key) => (
                  <Card key={key}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main' }}>{key}</Typography>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={history}>
                          <XAxis dataKey="Date" tick={false} stroke="#fff" />
                          <YAxis domain={['auto', 'auto']} stroke="#fff" />
                          <Tooltip contentStyle={{ background: '#23272f', color: '#fff' }} />
                          <CartesianGrid stroke="#333" strokeDasharray="5 5" />
                          <Line type="monotone" dataKey={key} stroke="#00bcd4" dot={false} name={key} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                ))}
            </Box>
          )}
        </Box>
        <Box hidden={tab !== 1}>
          <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>Value Stock Screener</Typography>
          <Box display="flex" flexWrap="wrap" alignItems="center" gap={3} mb={3}>
            <TextField
              select
              label="Exchange"
              value={exchange}
              onChange={e => setExchange(e.target.value)}
              sx={{ minWidth: 120, label: { color: 'white' }, input: { color: 'white' } }}
              variant="outlined"
            >
              <MenuItem value="NASDAQ">NASDAQ</MenuItem>
              <MenuItem value="NYSE">NYSE</MenuItem>
              <MenuItem value="OSE">OSE</MenuItem>
            </TextField>
            {Object.entries(weights).map(([key, value]) => (
              <Box key={key} sx={{ minWidth: 120 }}>
                <Typography variant="caption" sx={{ color: 'secondary.main' }}>{key.replace('_', ' ').toUpperCase()}</Typography>
                <Slider
                  value={value}
                  min={0}
                  max={5}
                  step={0.1}
                  onChange={(_, v) => handleWeightChange(key, v as number)}
                  valueLabelDisplay="auto"
                  sx={{ color: 'primary.main' }}
                />
              </Box>
            ))}
            <Button variant="contained" color="primary" onClick={runScreener} disabled={screenerLoading} sx={{ height: 56 }}>
              Screen
            </Button>
            {screenerLoading && <CircularProgress size={28} sx={{ ml: 2 }} />}
          </Box>
          {screenerError && <Typography color="error" sx={{ mb: 2 }}>{screenerError}</Typography>}
          {results.length > 0 && (
            <TableContainer component={Paper} sx={{ background: '#23272f', borderRadius: 2, boxShadow: 3 }}>
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
                    <TableCell>FCF Yield</TableCell>
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
                      <TableCell>{row.fcf_yield !== undefined && row.fcf_yield !== null ? (row.fcf_yield * 100).toFixed(2) + '%' : '-'}</TableCell>
                      <TableCell>{row.score.toFixed(3)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App; 