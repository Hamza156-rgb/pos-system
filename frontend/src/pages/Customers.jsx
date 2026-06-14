import { useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Stack,
  Chip, Tooltip, InputAdornment,
} from '@mui/material';
import { Add, Edit, Delete, History, Payments, PeopleAltOutlined } from '@mui/icons-material';
import { useFetch, useCreate, useUpdate, useRemove } from '../hooks/useApi.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { PageHeader, SearchField, TableCard, EmptyState } from '../components/ui.jsx';

const empty = { name: '', phone: '', email: '', address: '' };
const money = (n) => 'Rs ' + Number(n || 0).toLocaleString();

export default function Customers() {
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [history, setHistory] = useState(null);
  const [settle, setSettle] = useState(null);
  const [settleAmt, setSettleAmt] = useState('');

  const { data, refetch } = useFetch('customers', '/customers', { search });
  const customers = data?.data || [];
  const createM = useCreate('/customers', 'customers');
  const updateM = useUpdate((id) => `/customers/${id}`, 'customers');
  const removeM = useRemove((id) => `/customers/${id}`, 'customers');

  const openCreate = () => { setForm(empty); setEditId(null); setOpen(true); };
  const openEdit = (c) => { setForm({ ...empty, ...c }); setEditId(c.id); setOpen(true); };
  const save = async () => {
    if (editId) await updateM.mutateAsync({ id: editId, ...form });
    else await createM.mutateAsync(form);
    setOpen(false);
  };
  const del = async (id) => { if (window.confirm('Delete customer?')) await removeM.mutateAsync(id); };
  const viewHistory = async (c) => { const res = await api.get(`/customers/${c.id}`); setHistory(res.data.data); };
  const doSettle = async () => {
    await api.post(`/customers/${settle.id}/settle`, { amount: Number(settleAmt) });
    setSettle(null); setSettleAmt(''); refetch();
  };

  return (
    <Box>
      <PageHeader
        title={t('customers')}
        subtitle="Customer directory, purchase history and Udhaar (credit) balances"
        actions={<Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Customer</Button>}
      />

      <SearchField
        placeholder={t('search')} value={search}
        onChange={(e) => setSearch(e.target.value)} sx={{ mb: 2.5, maxWidth: '100%' }}
      />

      <TableCard>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('name')}</TableCell><TableCell>Phone</TableCell><TableCell>Email</TableCell>
              <TableCell align="right">Outstanding (Udhaar)</TableCell><TableCell align="right">{t('actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.length === 0 && (
              <TableRow><TableCell colSpan={5} sx={{ border: 0 }}>
                <EmptyState icon={<PeopleAltOutlined />} title="No customers found" subtitle="Add a customer to start tracking purchases." />
              </TableCell></TableRow>
            )}
            {customers.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{c.phone}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{c.email}</TableCell>
                <TableCell align="right">
                  {Number(c.outstandingBalance) > 0
                    ? <Chip size="small" color="error" label={money(c.outstandingBalance)} sx={{ fontWeight: 700 }} />
                    : <Chip size="small" color="success" variant="outlined" label="Clear" sx={{ fontWeight: 700 }} />}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="History"><IconButton size="small" onClick={() => viewHistory(c)}><History fontSize="small" /></IconButton></Tooltip>
                  {Number(c.outstandingBalance) > 0 && (
                    <Tooltip title="Record payment"><IconButton size="small" color="success" onClick={() => { setSettle(c); setSettleAmt(c.outstandingBalance); }}><Payments fontSize="small" /></IconButton></Tooltip>
                  )}
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(c)}><Edit fontSize="small" /></IconButton></Tooltip>
                  {isAdmin && <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => del(c.id)}><Delete fontSize="small" /></IconButton></Tooltip>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} mt={0}>
            <Grid item xs={12} sm={6}><TextField label={t('name')} fullWidth size="small" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Phone" fullWidth size="small" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Email" fullWidth size="small" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Address" fullWidth size="small" multiline rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={save} disabled={!form.name}>{t('save')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!history} onClose={() => setHistory(null)} maxWidth="md" fullWidth>
        <DialogTitle>{history?.name} — Total Purchases: {money(history?.totalPurchases)}</DialogTitle>
        <DialogContent dividers>
          <Table size="small">
            <TableHead><TableRow><TableCell>Invoice</TableCell><TableCell>Date</TableCell><TableCell>Method</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead>
            <TableBody>
              {(history?.Sales || []).length === 0 && <TableRow><TableCell colSpan={4}>No purchases.</TableCell></TableRow>}
              {(history?.Sales || []).map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.invoiceNumber}</TableCell>
                  <TableCell>{new Date(s.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{s.paymentMethod}</TableCell>
                  <TableCell align="right">{money(s.grandTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions><Button onClick={() => setHistory(null)}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={!!settle} onClose={() => setSettle(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Record Payment — {settle?.name}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" mb={2}>Outstanding: {money(settle?.outstandingBalance)}</Typography>
          <TextField label="Amount Received" type="number" fullWidth size="small" value={settleAmt} onChange={(e) => setSettleAmt(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettle(null)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={doSettle} disabled={!settleAmt}>Record</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
