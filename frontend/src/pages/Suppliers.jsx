import { useState } from 'react';
import {
  Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Stack, Tooltip, Chip,
} from '@mui/material';
import { Add, Edit, Delete, History, LocalShippingOutlined, Payments } from '@mui/icons-material';
import { useFetch, useCreate, useUpdate, useRemove } from '../hooks/useApi.js';
import { useI18n } from '../context/I18nContext.jsx';
import api from '../services/api.js';
import { PageHeader, TableCard, EmptyState, NameCell } from '../components/ui.jsx';

const empty = { name: '', phone: '', email: '', address: '' };
const money = (n) => 'Rs ' + Number(n || 0).toLocaleString();

export default function Suppliers() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [history, setHistory] = useState(null);
  const [pay, setPay] = useState(null);
  const [payAmt, setPayAmt] = useState('');

  const { data, refetch } = useFetch('suppliers', '/suppliers');
  const suppliers = data?.data || [];
  const createM = useCreate('/suppliers', 'suppliers');
  const updateM = useUpdate((id) => `/suppliers/${id}`, 'suppliers');
  const removeM = useRemove((id) => `/suppliers/${id}`, 'suppliers');

  const openCreate = () => { setForm(empty); setEditId(null); setOpen(true); };
  const openEdit = (s) => { setForm({ ...empty, ...s }); setEditId(s.id); setOpen(true); };

  const save = async () => {
    if (editId) await updateM.mutateAsync({ id: editId, ...form });
    else await createM.mutateAsync(form);
    setOpen(false);
  };
  const del = async (id) => { if (window.confirm('Delete supplier?')) await removeM.mutateAsync(id); };
  const viewHistory = async (s) => {
    const res = await api.get(`/suppliers/${s.id}`);
    setHistory(res.data.data);
  };
  const doPay = async () => {
    await api.post(`/suppliers/${pay.id}/pay`, { amount: Number(payAmt) });
    setPay(null); setPayAmt(''); refetch();
  };

  return (
    <Box>
      <PageHeader
        title={t('suppliers')}
        subtitle="Vendors you purchase stock from, with order history"
        actions={<Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Supplier</Button>}
      />

      <TableCard>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('name')}</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="right">Payable (We Owe)</TableCell>
              <TableCell align="right">{t('actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {suppliers.length === 0 && (
              <TableRow><TableCell colSpan={5} sx={{ border: 0 }}>
                <EmptyState icon={<LocalShippingOutlined />} title="No suppliers yet" subtitle="Add a supplier to record purchase orders." />
              </TableCell></TableRow>
            )}
            {suppliers.map((s) => (
              <TableRow key={s.id} hover>
                <TableCell><NameCell name={s.name} /></TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{s.phone}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{s.email}</TableCell>
                <TableCell align="right">
                  {Number(s.outstandingBalance) > 0
                    ? <Chip size="small" color="warning" label={money(s.outstandingBalance)} sx={{ fontWeight: 700 }} />
                    : <Chip size="small" color="success" variant="outlined" label="Clear" sx={{ fontWeight: 700 }} />}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Purchase history"><IconButton size="small" onClick={() => viewHistory(s)}><History fontSize="small" /></IconButton></Tooltip>
                  {Number(s.outstandingBalance) > 0 && (
                    <Tooltip title="Record payment"><IconButton size="small" color="success" onClick={() => { setPay(s); setPayAmt(s.outstandingBalance); }}><Payments fontSize="small" /></IconButton></Tooltip>
                  )}
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(s)}><Edit fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => del(s.id)}><Delete fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
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
        <DialogTitle>Purchase History — {history?.name}</DialogTitle>
        <DialogContent dividers>
          <Table size="small">
            <TableHead>
              <TableRow><TableCell>Order #</TableCell><TableCell>Date</TableCell><TableCell>Status</TableCell><TableCell align="right">Total</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {(history?.Purchases || []).length === 0 && <TableRow><TableCell colSpan={4}>No purchases.</TableCell></TableRow>}
              {(history?.Purchases || []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.orderNumber}</TableCell>
                  <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell align="right">{money(p.totalAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions><Button onClick={() => setHistory(null)}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={!!pay} onClose={() => setPay(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Pay Supplier — {pay?.name}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" mb={2}>Payable: {money(pay?.outstandingBalance)}</Typography>
          <TextField label="Amount Paid" type="number" fullWidth size="small" value={payAmt} onChange={(e) => setPayAmt(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPay(null)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={doPay} disabled={!payAmt}>Record Payment</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
