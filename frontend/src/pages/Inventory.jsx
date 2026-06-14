import { useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Chip, Grid, Stack, Pagination, Autocomplete,
} from '@mui/material';
import { Tune } from '@mui/icons-material';
import { useFetch, useCreate } from '../hooks/useApi.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const typeColor = { in: 'success', out: 'error', adjustment: 'warning' };

export default function Inventory() {
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ productId: '', type: 'in', quantity: 1, reason: '' });

  const { data: moveData, isLoading } = useFetch('movements', '/inventory/movements', { page, limit: 15 });
  const { data: lowData } = useFetch('lowstock', '/inventory/low-stock');
  const { data: prodData } = useFetch('products-all', '/products', { limit: 1000 });
  const adjustM = useCreate('/inventory/adjust', 'movements');

  const movements = moveData?.data || [];
  const totalPages = moveData?.pagination?.totalPages || 1;
  const lowStock = lowData?.data || [];
  const products = prodData?.data || [];

  const submit = async () => {
    await adjustM.mutateAsync({ ...form, quantity: Number(form.quantity) });
    setOpen(false);
    setForm({ productId: '', type: 'in', quantity: 1, reason: '' });
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight={700}>{t('inventory')}</Typography>
        {isAdmin && <Button variant="contained" startIcon={<Tune />} onClick={() => setOpen(true)}>Adjust Stock</Button>}
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Stock Movements" />
        <Tab label={`Low Stock (${lowStock.length})`} />
      </Tabs>

      {tab === 0 && (
        <>
          <Paper>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">{t('quantity')}</TableCell>
                  <TableCell align="right">Balance After</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Reference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={7}>Loading...</TableCell></TableRow>}
                {!isLoading && movements.length === 0 && <TableRow><TableCell colSpan={7}>No movements yet.</TableCell></TableRow>}
                {movements.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell>{new Date(m.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{m.Product?.name || '-'}</TableCell>
                    <TableCell><Chip size="small" label={m.type} color={typeColor[m.type] || 'default'} /></TableCell>
                    <TableCell align="right">{m.quantity}</TableCell>
                    <TableCell align="right">{m.balanceAfter}</TableCell>
                    <TableCell>{m.reason}</TableCell>
                    <TableCell>{m.reference}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
          <Stack alignItems="center" mt={2}>
            <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
          </Stack>
        </>
      )}

      {tab === 1 && (
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('name')}</TableCell>
                <TableCell>{t('sku')}</TableCell>
                <TableCell>{t('category')}</TableCell>
                <TableCell align="right">{t('stock')}</TableCell>
                <TableCell align="right">Reorder Level</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lowStock.length === 0 && <TableRow><TableCell colSpan={5}>All products are above reorder level.</TableCell></TableRow>}
              {lowStock.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.sku}</TableCell>
                  <TableCell>{p.Category?.name || '-'}</TableCell>
                  <TableCell align="right"><Chip size="small" color="error" label={p.stockQuantity} /></TableCell>
                  <TableCell align="right">{p.reorderLevel}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adjust Stock</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} mt={0}>
            <Grid item xs={12}>
              <Autocomplete
                options={products}
                getOptionLabel={(o) => `${o.name} (${o.sku}) — stock: ${o.stockQuantity}`}
                onChange={(_, v) => setForm({ ...form, productId: v?.id || '' })}
                renderInput={(p) => <TextField {...p} label="Product" size="small" />}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField select label="Type" fullWidth size="small" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <MenuItem value="in">Stock In</MenuItem>
                <MenuItem value="out">Stock Out</MenuItem>
                <MenuItem value="adjustment">Set Exact (Adjustment)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}><TextField label="Quantity" type="number" fullWidth size="small" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField label="Reason" fullWidth size="small" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={submit} disabled={!form.productId}>{t('save')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
