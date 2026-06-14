import { useState } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, Grid, Card, CardContent, TextField, Button,
  Table, TableHead, TableRow, TableCell, TableBody, Stack, MenuItem, Chip,
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
  const { data: plData } = useFetch(['pl-report', period, from, to], '/reports/profit-loss', range, { enabled: tab === 4 });
  const { data: topData } = useFetch(['top-report', period, from, to], '/reports/top-products', range, { enabled: tab === 5 });
  const { data: payData } = useFetch(['pay-report', period, from, to], '/reports/payment-methods', range, { enabled: tab === 6 });
  const { data: catData } = useFetch(['cat-report', period, from, to], '/reports/sales-by-category', range, { enabled: tab === 7 });
  const { data: retData } = useFetch(['ret-report', period, from, to], '/reports/returns', range, { enabled: tab === 8 });
  const { data: recvData } = useFetch('recv-report', '/reports/receivables', {}, { enabled: tab === 9 });
  const { data: payblData } = useFetch('paybl-report', '/reports/payables', {}, { enabled: tab === 10 });

  const sales = salesData?.data || {};
  const inv = invData?.data || {};
  const fin = finData?.data || {};
  const cash = cashData?.data || {};
  const pl = plData?.data || {};
  const top = topData?.data || {};
  const pay = payData?.data || {};
  const cat = catData?.data || {};
  const ret = retData?.data || {};
  const recv = recvData?.data || {};
  const paybl = payblData?.data || {};

  return (
    <Box>
      <PageHeader title={t('reports')} subtitle="Sales, inventory valuation, profit and daily cash closing" />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
        sx={{ mb: 2.5, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Sales" /><Tab label="Inventory" /><Tab label="Financial" /><Tab label="Cash Closing" />
        <Tab label="Profit & Loss" /><Tab label="Top Products" /><Tab label="Payment Methods" />
        <Tab label="By Category" /><Tab label="Returns" /><Tab label="Receivables" /><Tab label="Payables" />
      </Tabs>

      {[0, 2, 4, 5, 6, 7, 8].includes(tab) && (
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

      {/* Profit & Loss */}
      {tab === 4 && (
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}><Stat label="Gross Revenue" value={money(pl.grossRevenue)} color="primary.main" /></Grid>
          <Grid item xs={6} md={3}><Stat label="Sales Returns" value={money(pl.salesReturns)} color="error.main" /></Grid>
          <Grid item xs={6} md={3}><Stat label="Net Revenue" value={money(pl.netRevenue)} color="info.main" /></Grid>
          <Grid item xs={6} md={3}><Stat label="COGS" value={money(pl.cogs)} color="warning.main" /></Grid>
          <Grid item xs={6} md={3}><Stat label="Gross Profit" value={money(pl.grossProfit)} color="success.main" /></Grid>
          <Grid item xs={6} md={3}><Stat label="Margin %" value={(pl.margin || 0) + '%'} color="secondary.main" /></Grid>
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography variant="h6" mb={2}>Profit & Loss breakdown</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Net Revenue', v: pl.netRevenue || 0 }, { name: 'COGS', v: pl.cogs || 0 }, { name: 'Gross Profit', v: pl.grossProfit || 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => money(v)} cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="v" fill="#16a34a" radius={[8, 8, 0, 0]} barSize={64} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Top products */}
      {tab === 5 && (
        <TableCard>
          <Table size="small">
            <TableHead><TableRow><TableCell>Product</TableCell><TableCell align="right">Qty Sold</TableCell><TableCell align="right">Revenue</TableCell></TableRow></TableHead>
            <TableBody>
              {(top.rows || []).length === 0 && <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>No sales in range.</TableCell></TableRow>}
              {(top.rows || []).map((r, i) => (
                <TableRow key={i} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{r.productName}</TableCell>
                  <TableCell align="right">{r.qty}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{money(r.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}

      {/* Payment methods */}
      {tab === 6 && (
        <TableCard>
          <Table size="small">
            <TableHead><TableRow><TableCell>Method</TableCell><TableCell align="right">Transactions</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead>
            <TableBody>
              {(pay.rows || []).length === 0 && <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>No sales in range.</TableCell></TableRow>}
              {(pay.rows || []).map((r, i) => (
                <TableRow key={i} hover>
                  <TableCell><Chip size="small" label={r.method} sx={{ textTransform: 'capitalize' }} /></TableCell>
                  <TableCell align="right">{r.count}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{money(r.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}

      {/* Sales by category */}
      {tab === 7 && (
        <TableCard>
          <Table size="small">
            <TableHead><TableRow><TableCell>Category</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Revenue</TableCell></TableRow></TableHead>
            <TableBody>
              {(cat.rows || []).length === 0 && <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>No sales in range.</TableCell></TableRow>}
              {(cat.rows || []).map((r, i) => (
                <TableRow key={i} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{r.category}</TableCell>
                  <TableCell align="right">{r.qty}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{money(r.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}

      {/* Returns */}
      {tab === 8 && (
        <>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={6} md={3}><Stat label="Sale Returns" value={money(ret.totals?.saleReturns)} color="error.main" /></Grid>
            <Grid item xs={6} md={3}><Stat label="Purchase Returns" value={money(ret.totals?.purchaseReturns)} color="warning.main" /></Grid>
          </Grid>
          <TableCard sx={{ mb: 2.5 }}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Sale Return #</TableCell><TableCell>Invoice</TableCell><TableCell align="right">Amount</TableCell><TableCell>Date</TableCell></TableRow></TableHead>
              <TableBody>
                {(ret.saleReturns || []).length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>No sale returns.</TableCell></TableRow>}
                {(ret.saleReturns || []).map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{r.returnNumber}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{r.Sale?.invoiceNumber || '-'}</TableCell>
                    <TableCell align="right">{money(r.totalAmount)}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
          <TableCard>
            <Table size="small">
              <TableHead><TableRow><TableCell>Purchase Return #</TableCell><TableCell>Supplier</TableCell><TableCell align="right">Amount</TableCell><TableCell>Date</TableCell></TableRow></TableHead>
              <TableBody>
                {(ret.purchaseReturns || []).length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>No purchase returns.</TableCell></TableRow>}
                {(ret.purchaseReturns || []).map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{r.returnNumber}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{r.Supplier?.name || '-'}</TableCell>
                    <TableCell align="right">{money(r.totalAmount)}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </>
      )}

      {/* Receivables */}
      {tab === 9 && (
        <>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} md={4}><Stat label="Total Receivable (Udhaar)" value={money(recv.total)} color="error.main" /></Grid>
          </Grid>
          <TableCard>
            <Table size="small">
              <TableHead><TableRow><TableCell>Customer</TableCell><TableCell>Phone</TableCell><TableCell align="right">Outstanding</TableCell></TableRow></TableHead>
              <TableBody>
                {(recv.customers || []).length === 0 && <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>No outstanding balances.</TableCell></TableRow>}
                {(recv.customers || []).map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{c.phone}</TableCell>
                    <TableCell align="right"><Chip size="small" color="error" label={money(c.outstandingBalance)} sx={{ fontWeight: 700 }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </>
      )}

      {/* Payables */}
      {tab === 10 && (
        <>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} md={4}><Stat label="Total Payable" value={money(paybl.total)} color="warning.main" /></Grid>
          </Grid>
          <TableCard>
            <Table size="small">
              <TableHead><TableRow><TableCell>Supplier</TableCell><TableCell>Phone</TableCell><TableCell align="right">We Owe</TableCell></TableRow></TableHead>
              <TableBody>
                {(paybl.suppliers || []).length === 0 && <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>No outstanding payables.</TableCell></TableRow>}
                {(paybl.suppliers || []).map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{s.phone}</TableCell>
                    <TableCell align="right"><Chip size="small" color="warning" label={money(s.outstandingBalance)} sx={{ fontWeight: 700 }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </>
      )}
    </Box>
  );
}
