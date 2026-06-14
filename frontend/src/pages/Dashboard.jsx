import { Grid, Card, CardContent, Typography, Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { useFetch } from '../hooks/useApi.js';
import { useI18n } from '../context/I18nContext.jsx';

const StatCard = ({ label, value, color }) => (
  <Card>
    <CardContent>
      <Typography color="text.secondary" variant="body2">{label}</Typography>
      <Typography variant="h5" fontWeight={700} color={color}>{value}</Typography>
    </CardContent>
  </Card>
);

const money = (n) => 'Rs ' + Number(n || 0).toLocaleString();

export default function Dashboard() {
  const { t } = useI18n();
  const { data, isLoading } = useFetch('dashboard', '/dashboard');
  const d = data?.data || {};
  if (isLoading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>{t('dashboard')}</Typography>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}><StatCard label={t('todaySales')} value={money(d.todaySales)} color="primary.main" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard label={t('weeklySales')} value={money(d.weeklySales)} color="secondary.main" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard label={t('monthlySales')} value={money(d.monthlySales)} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard label={t('totalProducts')} value={d.totalProducts} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard label={t('lowStock')} value={d.lowStockCount} color="error.main" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard label={t('totalCustomers')} value={d.totalCustomers} /></Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>Sales (last 7 days)</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={(d.dailySeries || []).map((x) => ({ date: x.date, total: Number(x.total) }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" /><YAxis /><Tooltip formatter={(v) => money(v)} />
                <Line type="monotone" dataKey="total" stroke="#1565c0" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>{t('topSelling')}</Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={(d.topSelling || []).map((x) => ({ name: x.productName, qty: Number(x.qtySold) }))} layout="vertical">
                <XAxis type="number" /><YAxis type="category" dataKey="name" width={120} /><Tooltip />
                <Bar dataKey="qty" fill="#00897b" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>{t('recentTransactions')}</Typography>
            <Table size="small">
              <TableHead><TableRow><TableCell>Invoice</TableCell><TableCell>Amount</TableCell><TableCell>Payment</TableCell><TableCell>Time</TableCell></TableRow></TableHead>
              <TableBody>
                {(d.recent || []).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.invoiceNumber}</TableCell>
                    <TableCell>{money(s.grandTotal)}</TableCell>
                    <TableCell><Chip size="small" label={s.paymentMethod} /></TableCell>
                    <TableCell>{new Date(s.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
