import { useState } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Grid, Card, CardContent, TextField, Button,
  Table, TableHead, TableRow, TableCell, TableBody, Stack, MenuItem,
} from '@mui/material';
import { FileDownload } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useFetch } from '../hooks/useApi.js';
import { useI18n } from '../context/I18nContext.jsx';
import { PageHeader, TableCard } from '../components/ui.jsx';

const money = (n) => 'Rs ' + Number(n || 0).toLocaleString();

const Stat = ({ label, value, color = 'primary.main' }) => (
  <Card sx={{ height: '100%', borderLeft: '4px solid', borderLeftColor: color }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>{value}</Typography>
    </CardContent>
  </Card>
);

const toCsv = (rows, headers) => {
  const head = headers.map((h) => h.label).join(',');
  const body = rows.map((r) => headers.map((h) => `"${r[h.key] ?? ''}"`).join(',')).join('\n');
  const blob = new Blob([head + '\n' + body], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'report.csv'; a.click();
  URL.revokeObjectURL(url);
};

export default function Reports() {
  const { t } = useI18n();
  const [tab, setTab] = useState(0);
  const [period, setPeriod] = useState('daily');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const range = from && to ? { from, to } : { period };
  const { data: salesData } = useFetch(['sales-report', tab, period, from, to], '/reports/sales', range, { enabled: tab === 0 });
  const { data: invData } = useFetch('inv-report', '/reports/inventory', {}, { enabled: tab === 1 });
  const { data: finData } = useFetch(['fin-report', period, from, to], '/reports/financial', range, { enabled: tab === 2 });
  const { data: cashData } = useFetch('cash-closing', '/sales/cash-closing', {}, { enabled: tab === 3 });

  const sales = salesData?.data || {};
  const inv = invData?.data || {};
  const fin = finData?.data || {};
  const cash = cashData?.data || {};

  return (
    <Box>
      <PageHeader title={t('reports')} subtitle="Sales, inventory valuation, profit and daily cash closing" />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2.5, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Sales" /><Tab label="Inventory" /><Tab label="Financial" /><Tab label="Daily Cash Closing" />
      </Tabs>

      {(tab === 0 || tab === 2) && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 3 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
            <TextField select size="small" label="Period" value={period} onChange={(e) => { setPeriod(e.target.value); setFrom(''); setTo(''); }} sx={{ minWidth: 140 }}>
              <MenuItem value="daily">Today</MenuItem>
              <MenuItem value="weekly">Last 7 days</MenuItem>
              <MenuItem value="monthly">Last 30 days</MenuItem>
              <MenuItem value="yearly">Last year</MenuItem>
            </TextField>
            <Typography variant="body2">or custom:</Typography>
            <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }} value={from} onChange={(e) => setFrom(e.target.value)} />
            <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }} value={to} onChange={(e) => setTo(e.target.value)} />
          </Stack>
        </Paper>
      )}

      {tab === 0 && (
        <>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={6} md={3}><Stat label="Revenue" value={money(sales.totals?.revenue)} color="primary.main" /></Grid>
            <Grid item xs={6} md={3}><Stat label="Transactions" value={sales.totals?.count || 0} /></Grid>
            <Grid item xs={6} md={3}><Stat label="Discounts" value={money(sales.totals?.discount)} /></Grid>
            <Grid item xs={6} md={3}><Stat label="Tax Collected" value={money(sales.totals?.tax)} /></Grid>
          </Grid>
          <Stack direction="row" justifyContent="flex-end" mb={1}>
            <Button size="small" startIcon={<FileDownload />} onClick={() => toCsv(sales.sales || [], [
              { key: 'invoiceNumber', label: 'Invoice' }, { key: 'createdAt', label: 'Date' },
              { key: 'paymentMethod', label: 'Method' }, { key: 'grandTotal', label: 'Total' },
            ])}>Export CSV</Button>
          </Stack>
          <TableCard>
            <Table size="small">
              <TableHead><TableRow><TableCell>Invoice</TableCell><TableCell>Date</TableCell><TableCell>Method</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead>
              <TableBody>
                {(sales.sales || []).length === 0 && <TableRow><TableCell colSpan={4}>No sales in range.</TableCell></TableRow>}
                {(sales.sales || []).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.invoiceNumber}</TableCell>
                    <TableCell>{new Date(s.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{s.paymentMethod}</TableCell>
                    <TableCell align="right">{money(s.grandTotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </>
      )}

      {tab === 1 && (
        <>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={6} md={3}><Stat label="Total Units" value={inv.valuation?.units || 0} /></Grid>
            <Grid item xs={6} md={3}><Stat label="Cost Value" value={money(inv.valuation?.costValue)} /></Grid>
            <Grid item xs={6} md={3}><Stat label="Retail Value" value={money(inv.valuation?.retailValue)} color="primary.main" /></Grid>
            <Grid item xs={6} md={3}><Stat label="Low Stock Items" value={inv.lowStockCount || 0} color="error.main" /></Grid>
          </Grid>
          <Stack direction="row" justifyContent="flex-end" mb={1}>
            <Button size="small" startIcon={<FileDownload />} onClick={() => toCsv((inv.products || []).map((p) => ({ name: p.name, sku: p.sku, stock: p.stockQuantity, sellingPrice: p.sellingPrice })), [
              { key: 'name', label: 'Name' }, { key: 'sku', label: 'SKU' }, { key: 'stock', label: 'Stock' }, { key: 'sellingPrice', label: 'Price' },
            ])}>Export CSV</Button>
          </Stack>
          <TableCard>
            <Table size="small">
              <TableHead><TableRow><TableCell>Product</TableCell><TableCell>SKU</TableCell><TableCell align="right">Stock</TableCell><TableCell align="right">Cost</TableCell><TableCell align="right">Price</TableCell></TableRow></TableHead>
              <TableBody>
                {(inv.products || []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.sku}</TableCell>
                    <TableCell align="right">{p.stockQuantity}</TableCell>
                    <TableCell align="right">{money(p.purchasePrice)}</TableCell>
                    <TableCell align="right">{money(p.sellingPrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </>
      )}

      {tab === 2 && (
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}><Stat label="Revenue" value={money(fin.revenue)} color="primary.main" /></Grid>
          <Grid item xs={6} md={3}><Stat label="COGS" value={money(fin.cogs)} /></Grid>
          <Grid item xs={6} md={3}><Stat label="Gross Profit" value={money(fin.grossProfit)} color="secondary.main" /></Grid>
          <Grid item xs={6} md={3}><Stat label="Margin %" value={(fin.margin || 0) + '%'} /></Grid>
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography variant="h6" mb={2}>Revenue vs Cost vs Profit</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[{ name: 'Revenue', v: fin.revenue || 0 }, { name: 'COGS', v: fin.cogs || 0 }, { name: 'Gross Profit', v: fin.grossProfit || 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => money(v)} cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="v" fill="#2563eb" radius={[8, 8, 0, 0]} barSize={64} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {tab === 3 && (
        <Grid container spacing={2}>
          <Grid item xs={12}><Typography variant="h6">Cash Closing — {cash.date}</Typography></Grid>
          <Grid item xs={6} md={3}><Stat label="Total Sales" value={money(cash.totalSales)} color="primary.main" /></Grid>
          <Grid item xs={6} md={3}><Stat label="Transactions" value={cash.count || 0} /></Grid>
          <Grid item xs={6} md={3}><Stat label="Cash" value={money(cash.cash)} color="success.main" /></Grid>
          <Grid item xs={6} md={3}><Stat label="Card" value={money(cash.card)} /></Grid>
          <Grid item xs={6} md={3}><Stat label="Credit (Udhaar)" value={money(cash.credit)} color="error.main" /></Grid>
        </Grid>
      )}
    </Box>
  );
}
