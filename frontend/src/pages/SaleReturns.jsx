import { useState } from 'react';
import {
  Box, Button, Table, TableHead, TableRow, TableCell, TableBody, Chip, Stack, Tooltip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete, Typography, Alert,
} from '@mui/material';
import { Add, Visibility, AssignmentReturnOutlined } from '@mui/icons-material';
import { useFetch, useCreate } from '../hooks/useApi.js';
import api from '../services/api.js';
import { PageHeader, TableCard, EmptyState } from '../components/ui.jsx';

const money = (n) => 'Rs ' + Number(n || 0).toLocaleString();

export default function SaleReturns() {
  const { data } = useFetch('sale-returns', '/sale-returns');
  const { data: salesData } = useFetch('sales-recent', '/sales');
  const returns = data?.data || [];
  const sales = salesData?.data || [];
  const createM = useCreate('/sale-returns', 'sale-returns');

  const [open, setOpen] = useState(false);
  const [sale, setSale] = useState(null);
  const [lines, setLines] = useState([]);
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState(null);
  const [err, setErr] = useState('');

  const openNew = () => { setSale(null); setLines([]); setReason(''); setErr(''); setOpen(true); };

  const pickSale = async (s) => {
    setSale(s); setErr('');
    if (!s) { setLines([]); return; }
    try {
      const res = await api.get(`/sale-returns/returnable/${s.id}`);
      setLines(res.data.data.lines.map((l) => ({ ...l, qty: 0 })));
    } catch (e) { setErr(e.response?.data?.message || 'Failed to load sale'); }
  };

  const setQty = (pid, v, max) => setLines((ls) => ls.map((l) =>
    l.productId === pid ? { ...l, qty: Math.max(0, Math.min(Number(v) || 0, max)) } : l));

  const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  const submit = async () => {
    setErr('');
    const items = lines.filter((l) => l.qty > 0).map((l) => ({ productId: l.productId, quantity: l.qty }));
    if (!items.length) { setErr('Enter a quantity to return.'); return; }
    try {
      await createM.mutateAsync({ saleId: sale.id, items, reason });
      setOpen(false);
    } catch (e) { setErr(e.response?.data?.message || 'Return failed'); }
  };

  const view = async (id) => { const res = await api.get(`/sale-returns/${id}`); setDetail(res.data.data); };

  return (
    <Box>
      <PageHeader
        title="Sale Returns"
        subtitle="Refund or exchange sold items — stock is restored automatically"
        actions={<Button variant="contained" startIcon={<Add />} onClick={openNew}>New Return</Button>}
      />

      <TableCard>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Return #</TableCell><TableCell>Invoice</TableCell><TableCell>Customer</TableCell>
              <TableCell align="right">Amount</TableCell><TableCell>Refund</TableCell><TableCell>Date</TableCell><TableCell align="right">View</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {returns.length === 0 && (
              <TableRow><TableCell colSpan={7} sx={{ border: 0 }}>
                <EmptyState icon={<AssignmentReturnOutlined />} title="No sale returns yet" subtitle="Create a return against a past sale." />
              </TableCell></TableRow>
            )}
            {returns.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{r.returnNumber}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{r.Sale?.invoiceNumber || '-'}</TableCell>
                <TableCell>{r.Customer?.name || 'Walk-in'}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>{money(r.totalAmount)}</TableCell>
                <TableCell><Chip size="small" label={r.refundMethod} sx={{ textTransform: 'capitalize' }} /></TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{new Date(r.createdAt).toLocaleString()}</TableCell>
                <TableCell align="right"><Tooltip title="View"><IconButton size="small" onClick={() => view(r.id)}><Visibility fontSize="small" /></IconButton></Tooltip></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>

      {/* New return dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Sale Return</DialogTitle>
        <DialogContent dividers>
          {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
          <Autocomplete
            options={sales}
            getOptionLabel={(o) => `${o.invoiceNumber} — ${money(o.grandTotal)}`}
            value={sale}
            onChange={(_, v) => pickSale(v)}
            renderInput={(p) => <TextField {...p} label="Select sale (invoice)" size="small" />}
            sx={{ mb: 2 }}
          />
          {lines.length > 0 && (
            <Table size="small">
              <TableHead><TableRow><TableCell>Product</TableCell><TableCell align="right">Returnable</TableCell><TableCell align="right">Return Qty</TableCell></TableRow></TableHead>
              <TableBody>
                {lines.map((l) => (
                  <TableRow key={l.productId}>
                    <TableCell>{l.productName}</TableCell>
                    <TableCell align="right">{l.returnable}</TableCell>
                    <TableCell align="right">
                      <TextField type="number" size="small" value={l.qty} disabled={l.returnable === 0}
                        onChange={(e) => setQty(l.productId, e.target.value, l.returnable)} sx={{ width: 90 }} inputProps={{ min: 0, max: l.returnable }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {sale && (
            <>
              <TextField label="Reason (optional)" size="small" fullWidth value={reason} onChange={(e) => setReason(e.target.value)} sx={{ mt: 2 }} />
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
                <Typography fontWeight={700}>Refund total</Typography>
                <Typography fontWeight={800} color="primary.main">{money(total)}</Typography>
              </Stack>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit} disabled={!sale || total <= 0}>Process Return</Button>
        </DialogActions>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{detail?.returnNumber}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" mb={1}>Invoice: {detail?.Sale?.invoiceNumber} • Refund: <b style={{ textTransform: 'capitalize' }}>{detail?.refundMethod}</b></Typography>
          <Table size="small">
            <TableHead><TableRow><TableCell>Product</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Price</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead>
            <TableBody>
              {(detail?.items || []).map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{it.productName}</TableCell>
                  <TableCell align="right">{it.quantity}</TableCell>
                  <TableCell align="right">{money(it.unitPrice)}</TableCell>
                  <TableCell align="right">{money(it.lineTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions><Button onClick={() => setDetail(null)}>Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
