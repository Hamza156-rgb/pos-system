import { useState } from 'react';
import {
  Box, Button, Table, TableHead, TableRow, TableCell, TableBody, Chip, Stack, Tooltip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid, Alert, Typography,
} from '@mui/material';
import { Add, Edit, Block, CheckCircle, StorefrontOutlined } from '@mui/icons-material';
import { useFetch } from '../hooks/useApi.js';
import api from '../services/api.js';
import { PageHeader, TableCard, EmptyState, StatCard, NameCell } from '../components/ui.jsx';

const planColor = { trial: 'default', basic: 'info', pro: 'success' };

export default function Tenants() {
  const { data, refetch } = useFetch('tenants', '/tenants');
  const tenants = data?.data || [];

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [err, setErr] = useState('');
  const empty = {
    name: '', slug: '', contactName: '', contactPhone: '', contactEmail: '', plan: 'trial', expiresAt: '',
    adminName: '', adminEmail: '', adminPassword: '',
  };
  const [form, setForm] = useState(empty);

  const openCreate = () => { setForm(empty); setEditId(null); setErr(''); setOpen(true); };
  const openEdit = (t) => {
    setForm({ ...empty, ...t, expiresAt: t.expiresAt ? t.expiresAt.slice(0, 10) : '' });
    setEditId(t.id); setErr(''); setOpen(true);
  };

  const save = async () => {
    setErr('');
    try {
      if (editId) {
        await api.put(`/tenants/${editId}`, {
          name: form.name, slug: form.slug, contactName: form.contactName, contactPhone: form.contactPhone,
          contactEmail: form.contactEmail, plan: form.plan, expiresAt: form.expiresAt || null,
        });
      } else {
        await api.post('/tenants', form);
      }
      setOpen(false); refetch();
    } catch (e) { setErr(e.response?.data?.message || 'Save failed'); }
  };

  const toggleStatus = async (t) => {
    await api.put(`/tenants/${t.id}`, { status: t.status === 'active' ? 'suspended' : 'active' });
    refetch();
  };

  const totalShops = tenants.length;
  const activeShops = tenants.filter((t) => t.status === 'active').length;
  const totalProducts = tenants.reduce((s, t) => s + (t.counts?.products || 0), 0);

  return (
    <Box>
      <PageHeader
        title="Shops"
        subtitle="Every business using your POS — create, suspend and manage them here"
        actions={<Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Shop</Button>}
      />

      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} sm={4}><StatCard label="Total Shops" value={totalShops} icon={<StorefrontOutlined />} color="primary" /></Grid>
        <Grid item xs={6} sm={4}><StatCard label="Active" value={activeShops} icon={<CheckCircle />} color="success" /></Grid>
        <Grid item xs={6} sm={4}><StatCard label="Total Products" value={totalProducts} icon={<StorefrontOutlined />} color="secondary" /></Grid>
      </Grid>

      <TableCard>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Shop</TableCell><TableCell>Plan</TableCell><TableCell>Status</TableCell>
              <TableCell align="right">Users</TableCell><TableCell align="right">Products</TableCell><TableCell align="right">Sales</TableCell>
              <TableCell>Expires</TableCell><TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tenants.length === 0 && (
              <TableRow><TableCell colSpan={8} sx={{ border: 0 }}>
                <EmptyState icon={<StorefrontOutlined />} title="No shops yet" subtitle="Add your first customer shop to get started." />
              </TableCell></TableRow>
            )}
            {tenants.map((t) => (
              <TableRow key={t.id} hover>
                <TableCell><NameCell name={t.name} secondary={t.slug} /></TableCell>
                <TableCell><Chip size="small" label={t.plan} color={planColor[t.plan]} sx={{ textTransform: 'capitalize', fontWeight: 700 }} /></TableCell>
                <TableCell>
                  <Chip size="small" label={t.status} color={t.status === 'active' ? 'success' : 'error'}
                    variant={t.status === 'active' ? 'filled' : 'outlined'} sx={{ textTransform: 'capitalize', fontWeight: 700 }} />
                </TableCell>
                <TableCell align="right">{t.counts?.users ?? 0}</TableCell>
                <TableCell align="right">{t.counts?.products ?? 0}</TableCell>
                <TableCell align="right">{t.counts?.sales ?? 0}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{t.expiresAt ? new Date(t.expiresAt).toLocaleDateString() : '—'}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(t)}><Edit fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title={t.status === 'active' ? 'Suspend' : 'Activate'}>
                    <IconButton size="small" color={t.status === 'active' ? 'error' : 'success'} onClick={() => toggleStatus(t)}>
                      {t.status === 'active' ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Shop' : 'Add Shop'}</DialogTitle>
        <DialogContent dividers>
          {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField label="Shop name" fullWidth size="small" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Slug (optional)" fullWidth size="small" value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Contact name" fullWidth size="small" value={form.contactName || ''} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Contact phone" fullWidth size="small" value={form.contactPhone || ''} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Plan" fullWidth size="small" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                <MenuItem value="trial">Trial</MenuItem><MenuItem value="basic">Basic</MenuItem><MenuItem value="pro">Pro</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}><TextField label="Expires on" type="date" InputLabelProps={{ shrink: true }} fullWidth size="small" value={form.expiresAt || ''} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></Grid>

            {!editId && (
              <>
                <Grid item xs={12}><Typography variant="subtitle2" sx={{ mt: 1 }}>Shop Admin login</Typography></Grid>
                <Grid item xs={12} sm={6}><TextField label="Admin name" fullWidth size="small" value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Admin email" fullWidth size="small" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Admin password" type="password" fullWidth size="small" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} /></Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}
            disabled={!form.name || (!editId && (!form.adminEmail || !form.adminPassword))}>
            {editId ? 'Save' : 'Create Shop'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
