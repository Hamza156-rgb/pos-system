import {
  Grid, Card, CardContent, Typography, Box, Paper, Table, TableHead, TableRow,
  TableCell, TableBody, Chip, Stack, Skeleton, Divider,
} from '@mui/material';
import {
  TrendingUpRounded, DateRangeRounded, CalendarMonthRounded, Inventory2Rounded,
  WarningAmberRounded, PeopleAltRounded,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, Cell,
} from 'recharts';
import { useFetch } from '../hooks/useApi.js';
import { useI18n } from '../context/I18nContext.jsx';

const money = (n) => 'Rs ' + Number(n || 0).toLocaleString();

const StatCard = ({ label, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box
        sx={{
          width: 52, height: 52, borderRadius: 3, display: 'grid', placeItems: 'center', flexShrink: 0,
          color: `${color}.main`, bgcolor: `${color}.light`,
          background: (th) => `${th.palette[color].main}14`,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography color="text.secondary" variant="body2" noWrap>{label}</Typography>
        <Typography variant="h5" fontWeight={800} noWrap>{value}</Typography>
      </Box>
    </CardContent>
  </Card>
);

const SectionCard = ({ title, action, children }) => (
  <Paper sx={{ p: 2.5, height: '100%', border: '1px solid', borderColor: 'divider' }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
      <Typography variant="h6">{title}</Typography>
      {action}
    </Stack>
    {children}
  </Paper>
);

const BAR_COLORS = ['#2563eb', '#0d9488', '#f59e0b', '#8b5cf6', '#ec4899', '#0ea5e9', '#16a34a'];

export default function Dashboard() {
  const { t } = useI18n();
  const { data, isLoading } = useFetch('dashboard', '/dashboard');
  const d = data?.data || {};

  const stats = [
    { label: t('todaySales'), value: money(d.todaySales), icon: <TrendingUpRounded />, color: 'primary' },
    { label: t('weeklySales'), value: money(d.weeklySales), icon: <DateRangeRounded />, color: 'secondary' },
    { label: t('monthlySales'), value: money(d.monthlySales), icon: <CalendarMonthRounded />, color: 'info' },
    { label: t('totalProducts'), value: d.totalProducts ?? 0, icon: <Inventory2Rounded />, color: 'success' },
    { label: t('lowStock'), value: d.lowStockCount ?? 0, icon: <WarningAmberRounded />, color: 'warning' },
    { label: t('totalCustomers'), value: d.totalCustomers ?? 0, icon: <PeopleAltRounded />, color: 'secondary' },
  ];

  const series = (d.dailySeries || []).map((x) => ({ date: x.date, total: Number(x.total) }));
  const top = (d.topSelling || []).map((x) => ({ name: x.productName, qty: Number(x.qtySold) }));

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={220} height={48} sx={{ mb: 2 }} />
        <Grid container spacing={2.5} mb={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={i}>
              <Skeleton variant="rounded" height={92} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={7}><Skeleton variant="rounded" height={340} /></Grid>
          <Grid item xs={12} md={5}><Skeleton variant="rounded" height={340} /></Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4">{t('dashboard')}</Typography>
        <Typography variant="body2" color="text.secondary">Overview of your store's performance</Typography>
      </Box>

      <Grid container spacing={2.5} mb={1}>
        {stats.map((s) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={s.label}>
            <StatCard {...s} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5} mt={0.5}>
        <Grid item xs={12} md={7}>
          <SectionCard title="Sales — last 7 days" action={<Chip size="small" color="primary" variant="outlined" label="Daily" />}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={series} margin={{ left: -10, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={56} />
                <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(2,6,23,0.12)' }} />
                <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2.5} fill="url(#salesFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={5}>
          <SectionCard title={t('topSelling')}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="qty" radius={[0, 6, 6, 0]} barSize={18}>
                  {top.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        </Grid>

        <Grid item xs={12}>
          <SectionCard title={t('recentTransactions')}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Invoice</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell align="right">Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(d.recent || []).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{s.invoiceNumber}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'success.dark' }}>{money(s.grandTotal)}</TableCell>
                    <TableCell><Chip size="small" label={s.paymentMethod} sx={{ textTransform: 'capitalize' }} /></TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary' }}>{new Date(s.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {(d.recent || []).length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>No transactions yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
}
