import { useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Chip, Grid, Stack, Pagination, Autocomplete,
} from '@mui/material';
import { Tune, SwapVertOutlined, CheckCircleOutline } from '@mui/icons-material';
import { useFetch, useCreate } from '../hooks/useApi.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, TableCard, EmptyState } from '../components/ui.jsx';

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
      <PageHeader
        title={t('inventory')}
        subtitle="Track stock movements and spot items running low"
        actions={isAdmin && <Button variant="contained" startIcon={<Tune />} onClick={() => setOpen(true)}>Adjust Stock</Button>}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2.5, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Stock Movements" />
        <Tab label={`Low Stock (${lowStock.length})`} />
      </Tabs>

      {tab === 0 && (
        <>
          <TableCard>
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
                {isLoading && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>Loading…</TableCell></TableRow>}
                {!isLoading && movements.length === 0 && (
                  <TableRow><TableCell colSpan={7} sx={{ border: 0 }}>
                    <EmptyState icon={<SwapVertOutlined />} title="No movements yet" subtitle="Stock changes from sales and adjustments will appear here." />
                  </TableCell></TableRow>
                )}
                {movements.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell sx={{ color: 'text.secondary' }}>{new Date(m.createdAt).toLocaleString()}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{m.Product?.name || '-'}</TableCell>
                    <TableCell><Chip size="small" label={m.type} color={typeColor[m.type] || 'default'} sx={{ textTransform: 'uppercase', fontWeight: 700 }} /></TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{m.quantity}</TableCell>
                    <TableCell align="right">{m.balanceAfter}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{m.reason}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{m.reference}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
          <Stack alignItems="center" mt={2.5}>
            <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" />
          </Stack>
        </>
      )}

      {tab === 1 && (
        <TableCard>
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
              {lowStock.length === 0 && (
                <TableRow><TableCell colSpan={5} sx={{ border: 0 }}>
                  <EmptyState icon={<CheckCircleOutline />} title="All good!" subtitle="Every product is above its reorder level." />
                </TableCell></TableRow>
              )}
              {lowStock.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{p.sku}</TableCell>
                  <TableCell>{p.Category?.name || '-'}</TableCell>
                  <TableCell align="right"><Chip size="small" color="error" label={p.stockQuantity} sx={{ fontWeight: 700 }} /></TableCell>
                  <TableCell align="right">{p.reorderLevel}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
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
