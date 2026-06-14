import { useState } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem,
  Chip, Pagination, Stack, Tooltip, InputAdornment,
} from '@mui/material';
import { Add, Edit, Delete, FileDownload, FileUpload, Inventory2Outlined } from '@mui/icons-material';
import { useFetch, useCreate, useUpdate, useRemove } from '../hooks/useApi.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { PageHeader, SearchField, TableCard, EmptyState } from '../components/ui.jsx';

const money = (n) => 'Rs ' + Number(n || 0).toLocaleString();
const empty = {
  name: '', sku: '', barcode: '', CategoryId: '', brand: '', purchasePrice: '',
  sellingPrice: '', stockQuantity: 0, reorderLevel: 5, unit: 'pcs', description: '', status: 'active',
};

export default function Products() {
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  const params = { page, limit: 10, search };
  const { data, isLoading, refetch } = useFetch('products', '/products', params);
  const { data: catData } = useFetch('categories', '/categories');
  const categories = catData?.data || [];
  const rows = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const createM = useCreate('/products', 'products');
  const updateM = useUpdate((id) => `/products/${id}`, 'products');
  const removeM = useRemove((id) => `/products/${id}`, 'products');

  const openCreate = () => { setForm(empty); setEditId(null); setOpen(true); };
  const openEdit = (p) => {
    setForm({ ...empty, ...p, CategoryId: p.CategoryId || p.Category?.id || '' });
    setEditId(p.id); setOpen(true);
  };

  const save = async () => {
    const body = {
      ...form,
      purchasePrice: Number(form.purchasePrice) || 0,
      sellingPrice: Number(form.sellingPrice) || 0,
      stockQuantity: Number(form.stockQuantity) || 0,
      reorderLevel: Number(form.reorderLevel) || 0,
      CategoryId: form.CategoryId || null,
    };
    if (editId) await updateM.mutateAsync({ id: editId, ...body });
    else await createM.mutateAsync(body);
    setOpen(false);
  };

  const del = async (id) => {
    if (window.confirm('Delete this product?')) await removeM.mutateAsync(id);
  };

  const exportCsv = async () => {
    const res = await api.get('/products/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url; a.download = 'products.csv'; a.click();
    window.URL.revokeObjectURL(url);
  };

  const importCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    await api.post('/products/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    e.target.value = '';
    refetch();
  };

  const colSpan = isAdmin ? 8 : 7;

  return (
    <Box>
      <PageHeader
        title={t('products')}
        subtitle="Manage your catalog, pricing and stock levels"
        actions={isAdmin && (
          <>
            <Button variant="outlined" startIcon={<FileDownload />} onClick={exportCsv}>Export</Button>
            <Button variant="outlined" component="label" startIcon={<FileUpload />}>
              Import<input type="file" accept=".csv" hidden onChange={importCsv} />
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>{t('addProduct')}</Button>
          </>
        )}
      />

      <SearchField
        placeholder={t('search')} value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        sx={{ mb: 2.5, maxWidth: '100%' }}
      />

      <TableCard>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('name')}</TableCell>
              <TableCell>{t('sku')}</TableCell>
              <TableCell>{t('barcode')}</TableCell>
              <TableCell>{t('category')}</TableCell>
              <TableCell align="right">{t('price')}</TableCell>
              <TableCell align="right">{t('stock')}</TableCell>
              <TableCell>Status</TableCell>
              {isAdmin && <TableCell align="right">{t('actions')}</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={colSpan} align="center" sx={{ py: 4, color: 'text.secondary' }}>Loading…</TableCell></TableRow>}
            {!isLoading && rows.length === 0 && (
              <TableRow><TableCell colSpan={colSpan} sx={{ border: 0 }}>
                <EmptyState icon={<Inventory2Outlined />} title="No products found" subtitle="Add your first product or adjust your search." />
              </TableCell></TableRow>
            )}
            {rows.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{p.sku}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{p.barcode}</TableCell>
                <TableCell>{p.Category?.name || '-'}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>{money(p.sellingPrice)}</TableCell>
                <TableCell align="right">
                  <Chip size="small" label={p.stockQuantity}
                    color={p.stockQuantity <= p.reorderLevel ? 'error' : 'default'} sx={{ fontWeight: 700 }} />
                </TableCell>
                <TableCell>
                  <Chip size="small" label={p.status} color={p.status === 'active' ? 'success' : 'default'}
                    variant={p.status === 'active' ? 'filled' : 'outlined'} sx={{ textTransform: 'capitalize' }} />
                </TableCell>
                {isAdmin && (
                  <TableCell align="right">
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(p)}><Edit fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => del(p.id)}><Delete fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>

      <Stack alignItems="center" mt={2.5}>
        <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" />
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editId ? 'Edit Product' : t('addProduct')}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} mt={0}>
            <Grid item xs={12} sm={6}><TextField label={t('name')} fullWidth size="small" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="SKU (auto if empty)" fullWidth size="small" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Barcode (auto if empty)" fullWidth size="small" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label={t('category')} fullWidth size="small" value={form.CategoryId} onChange={(e) => setForm({ ...form, CategoryId: e.target.value })}>
                <MenuItem value="">-- None --</MenuItem>
                {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}><TextField label={t('brand')} fullWidth size="small" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Unit" fullWidth size="small" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Grid>
            <Grid item xs={6} sm={3}><TextField label="Purchase Price" type="number" fullWidth size="small" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} /></Grid>
            <Grid item xs={6} sm={3}><TextField label="Selling Price" type="number" fullWidth size="small" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} /></Grid>
            <Grid item xs={6} sm={3}><TextField label="Stock Qty" type="number" fullWidth size="small" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} /></Grid>
            <Grid item xs={6} sm={3}><TextField label="Reorder Level" type="number" fullWidth size="small" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Status" fullWidth size="small" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="active">active</MenuItem>
                <MenuItem value="inactive">inactive</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField label="Description" fullWidth size="small" multiline rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={save} disabled={!form.name}>{t('save')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
