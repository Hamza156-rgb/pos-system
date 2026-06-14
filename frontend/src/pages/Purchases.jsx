import { useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid, Stack,
  Chip, IconButton, Autocomplete, Divider, Tooltip,
} from '@mui/material';
import { Add, Delete, CheckCircle, Cancel, Visibility, ShoppingCartOutlined } from '@mui/icons-material';
import { useFetch, useCreate } from '../hooks/useApi.js';
import { useI18n } from '../context/I18nContext.jsx';
import api from '../services/api.js';
import { PageHeader, TableCard, EmptyState } from '../components/ui.jsx';

const money = (n) => 'Rs ' + Number(n || 0).toLocaleString();
const statusColor = { pending: 'warning', received: 'success', cancelled: 'default' };

export default function Purchases() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [supplierId, setSupplierId] = useState('');
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [status, setStatus] = useState('pending');
  const [lines, setLines] = useState([]);

  const { data, refetch } = useFetch('purchases', '/purchases');
  const { data: supData } = useFetch('suppliers', '/suppliers');
  const { data: prodData } = useFetch('products-all', '/products', { limit: 1000 });
  const createM = useCreate('/purchases', 'purchases');

  const purchases = data?.data || [];
  const suppliers = supData?.data || [];
  const products = prodData?.data || [];

  const addLine = () => setLines([...lines, { productId: '', quantity: 1, purchasePrice: 0 }]);
  const updateLine = (i, patch) => setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const removeLine = (i) => setLines(lines.filter((_, idx) => idx !== i));

  const subtotal = lines.reduce((s, l) => s + Number(l.purchasePrice) * Number(l.quantity), 0);
  const taxAmt = subtotal * (Number(taxPercentage) / 100);
  const total = subtotal + taxAmt;

  const reset = () => { setSupplierId(''); setTaxPercentage(0); setStatus('pending'); setLines([]); };

  const save = async () => {
    await createM.mutateAsync({
      supplierId, taxPercentage: Number(taxPercentage), status,
      items: lines.filter((l) => l.productId).map((l) => ({ productId: l.productId, quantity: Number(l.quantity), purchasePrice: Number(l.purchasePrice) })),
    });
    setOpen(false); reset();
  };

  const receive = async (id) => { await api.post(`/purchases/${id}/receive`); refetch(); };
  const cancel = async (id) => { if (window.confirm('Cancel this order?')) { await api.post(`/purchases/${id}/cancel`); refetch(); } };
  const viewDetail = async (id) => { const res = await api.get(`/purchases/${id}`); setDetail(res.data.data); };

  return (
    <Box>
      <PageHeader
        title={t('purchases')}
        subtitle="Create purchase orders and receive stock from suppliers"
        actions={<Button variant="contained" startIcon={<Add />} onClick={() => { reset(); setOpen(true); }}>New Purchase Order</Button>}
      />

      <TableCard>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Order #</TableCell><TableCell>Supplier</TableCell><TableCell>Date</TableCell>
              <TableCell align="right">Total</TableCell><TableCell>Status</TableCell><TableCell align="right">{t('actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {purchases.length === 0 && (
              <TableRow><TableCell colSpan={6} sx={{ border: 0 }}>
                <EmptyState icon={<ShoppingCartOutlined />} title="No purchase orders yet" subtitle="Create an order to restock from a supplier." />
              </TableCell></TableRow>
            )}
            {purchases.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{p.orderNumber}</TableCell>
                <TableCell>{p.Supplier?.name || '-'}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>{money(p.totalAmount)}</TableCell>
                <TableCell><Chip size="small" label={p.status} color={statusColor[p.status]} sx={{ textTransform: 'capitalize', fontWeight: 700 }} /></TableCell>
                <TableCell align="right">
                  <Tooltip title="View"><IconButton size="small" onClick={() => viewDetail(p.id)}><Visibility fontSize="small" /></IconButton></Tooltip>
                  {p.status === 'pending' && (
                    <>
                      <Tooltip title="Receive (stock in)"><IconButton size="small" color="success" onClick={() => receive(p.id)}><CheckCircle fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Cancel"><IconButton size="small" color="error" onClick={() => cancel(p.id)}><Cancel fontSize="small" /></IconButton></Tooltip>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>New Purchase Order</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} mt={0}>
            <Grid item xs={12} sm={5}>
              <TextField select label="Supplier" fullWidth size="small" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                {suppliers.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}><TextField label="Tax %" type="number" fullWidth size="small" value={taxPercentage} onChange={(e) => setTaxPercentage(e.target.value)} /></Grid>
            <Grid item xs={6} sm={4}>
              <TextField select label="Status" fullWidth size="small" value={status} onChange={(e) => setStatus(e.target.value)}>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="received">Received (stock in now)</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography fontWeight={600}>Items</Typography>
            <Button size="small" startIcon={<Add />} onClick={addLine}>Add Item</Button>
          </Stack>

          {lines.map((l, i) => (
            <Grid container spacing={1} key={i} alignItems="center" mb={1}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={products}
                  getOptionLabel={(o) => `${o.name} (${o.sku})`}
                  onChange={(_, v) => updateLine(i, { productId: v?.id || '', purchasePrice: v?.purchasePrice || 0 })}
                  renderInput={(p) => <TextField {...p} label="Product" size="small" />}
                />
              </Grid>
              <Grid item xs={4} sm={2}><TextField label="Qty" type="number" size="small" fullWidth value={l.quantity} onChange={(e) => updateLine(i, { quantity: e.target.value })} /></Grid>
              <Grid item xs={5} sm={3}><TextField label="Cost" type="number" size="small" fullWidth value={l.purchasePrice} onChange={(e) => updateLine(i, { purchasePrice: e.target.value })} /></Grid>
              <Grid item xs={3} sm={1}><IconButton color="error" onClick={() => removeLine(i)}><Delete /></IconButton></Grid>
            </Grid>
          ))}

          <Divider sx={{ my: 2 }} />
          <Stack spacing={0.5} alignItems="flex-end">
            <Typography>Subtotal: {money(subtotal)}</Typography>
            <Typography>Tax: {money(taxAmt)}</Typography>
            <Typography fontWeight={700}>Total: {money(total)}</Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={save} disabled={!supplierId || lines.filter((l) => l.productId).length === 0}>{t('save')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{detail?.orderNumber}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" mb={1}>Supplier: {detail?.Supplier?.name}</Typography>
          <Typography variant="body2" mb={2}>Status: {detail?.status}</Typography>
          <Table size="small">
            <TableHead><TableRow><TableCell>Product</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Cost</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead>
            <TableBody>
              {(detail?.items || []).map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{it.Product?.name}</TableCell>
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
