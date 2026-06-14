import { useState } from 'react';
import {
  Box, Button, Table, TableHead, TableRow, TableCell, TableBody, Stack, Tooltip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete, Typography, Alert,
} from '@mui/material';
import { Add, Visibility, AssignmentReturnedOutlined } from '@mui/icons-material';
import { useFetch, useCreate } from '../hooks/useApi.js';
import api from '../services/api.js';
import { PageHeader, TableCard, EmptyState } from '../components/ui.jsx';

const money = (n) => 'Rs ' + Number(n || 0).toLocaleString();

export default function PurchaseReturns() {
  const { data } = useFetch('purchase-returns', '/purchase-returns');
  const { data: poData } = useFetch('purchases', '/purchases');
  const returns = data?.data || [];
  const receivedPOs = (poData?.data || []).filter((p) => p.status === 'received');
  const createM = useCreate('/purchase-returns', 'purchase-returns');

  const [open, setOpen] = useState(false);
  const [po, setPo] = useState(null);
  const [lines, setLines] = useState([]);
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState(null);
  const [err, setErr] = useState('');

  const openNew = () => { setPo(null); setLines([]); setReason(''); setErr(''); setOpen(true); };

  const pickPo = async (p) => {
    setPo(p); setErr('');
    if (!p) { setLines([]); return; }
    try {
      const res = await api.get(`/purchase-returns/returnable/${p.id}`);
      setLines(res.data.data.lines.map((l) => ({ ...l, qty: 0 })));
    } catch (e) { setErr(e.response?.data?.message || 'Failed to load purchase'); }
  };

  const setQty = (pid, v, max) => setLines((ls) => ls.map((l) =>
    l.productId === pid ? { ...l, qty: Math.max(0, Math.min(Number(v) || 0, max)) } : l));

  const total = lines.reduce((s, l) => s + l.qty * l.purchasePrice, 0);

  const submit = async () => {
    setErr('');
    const items = lines.filter((l) => l.qty > 0).map((l) => ({ productId: l.productId, quantity: l.qty }));
    if (!items.length) { setErr('Enter a quantity to return.'); return; }
    try {
      await createM.mutateAsync({ purchaseId: po.id, items, reason });
      setOpen(false);
    } catch (e) { setErr(e.response?.data?.message || 'Return failed'); }
  };

  const view = async (id) => { const res = await api.get(`/purchase-returns/${id}`); setDetail(res.data.data); };

  return (
    <Box>
      <PageHeader
        title="Purchase Returns"
        subtitle="Return received stock to suppliers — stock and payables adjust automatically"
        actions={<Button variant="contained" startIcon={<Add />} onClick={openNew}>New Return</Button>}
      />

      <TableCard>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Return #</TableCell><TableCell>Order #</TableCell><TableCell>Supplier</TableCell>
              <TableCell align="right">Amount</TableCell><TableCell>Date</TableCell><TableCell align="right">View</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {returns.length === 0 && (
              <TableRow><TableCell colSpan={6} sx={{ border: 0 }}>
                <EmptyState icon={<AssignmentReturnedOutlined />} title="No purchase returns yet" subtitle="Return items from a received purchase order." />
              </TableCell></TableRow>
            )}
            {returns.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{r.returnNumber}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{r.Purchase?.orderNumber || '-'}</TableCell>
                <TableCell>{r.Supplier?.name || '-'}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>{money(r.totalAmount)}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{new Date(r.createdAt).toLocaleString()}</TableCell>
                <TableCell align="right"><Tooltip title="View"><IconButton size="small" onClick={() => view(r.id)}><Visibility fontSize="small" /></IconButton></Tooltip></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Purchase Return</DialogTitle>
        <DialogContent dividers>
          {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
          <Autocomplete
            options={receivedPOs}
            getOptionLabel={(o) => `${o.orderNumber} — ${o.Supplier?.name || ''}`}
            value={po}
            onChange={(_, v) => pickPo(v)}
            renderInput={(p) => <TextField {...p} label="Select received purchase order" size="small" />}
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
          {po && (
            <>
              <TextField label="Reason (optional)" size="small" fullWidth value={reason} onChange={(e) => setReason(e.target.value)} sx={{ mt: 2 }} />
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
                <Typography fontWeight={700}>Return total</Typography>
                <Typography fontWeight={800} color="primary.main">{money(total)}</Typography>
              </Stack>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit} disabled={!po || total <= 0}>Process Return</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{detail?.returnNumber}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" mb={1}>Order: {detail?.Purchase?.orderNumber} • Supplier: {detail?.Supplier?.name}</Typography>
          <Table size="small">
            <TableHead><TableRow><TableCell>Product</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Cost</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead>
            <TableBody>
              {(detail?.items || []).map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{it.Product?.name || `#${it.ProductId}`}</TableCell>
                  <TableCell align="right">{it.quantity}</TableCell>
                  <TableCell align="right">{money(it.purchasePrice)}</TableCell>
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
