import { useState } from 'react';
import {
  Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Grid, Stack, Chip, Tooltip,
  Divider, FormGroup, FormControlLabel, Checkbox,
} from '@mui/material';
import { Add, Edit, Delete, GroupOutlined, LockOutlined } from '@mui/icons-material';
import { useFetch, useCreate, useUpdate, useRemove } from '../hooks/useApi.js';
import { useI18n } from '../context/I18nContext.jsx';
import { PageHeader, TableCard, EmptyState, NameCell } from '../components/ui.jsx';
import { GRANTABLE_SCREENS, DEFAULT_CASHIER_PERMISSIONS } from '../config/permissions.js';

const empty = { name: '', email: '', phone: '', role: 'cashier', password: '', isActive: true, permissions: DEFAULT_CASHIER_PERMISSIONS };

export default function Users() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  const { data } = useFetch('users', '/users');
  const users = data?.data || [];
  const createM = useCreate('/users', 'users');
  const updateM = useUpdate((id) => `/users/${id}`, 'users');
  const removeM = useRemove((id) => `/users/${id}`, 'users');

  const openCreate = () => { setForm(empty); setEditId(null); setOpen(true); };
  const openEdit = (u) => {
    setForm({ ...empty, ...u, password: '', permissions: Array.isArray(u.permissions) ? u.permissions : [] });
    setEditId(u.id); setOpen(true);
  };

  const togglePerm = (key) => setForm((f) => {
    const set = new Set(f.permissions || []);
    if (set.has(key)) set.delete(key); else set.add(key);
    return { ...f, permissions: [...set] };
  });

  const save = async () => {
    const body = { ...form };
    if (editId && !body.password) delete body.password;
    if (editId) await updateM.mutateAsync({ id: editId, ...body });
    else await createM.mutateAsync(body);
    setOpen(false);
  };
  const del = async (id) => { if (window.confirm('Delete user?')) await removeM.mutateAsync(id); };

  return (
    <Box>
      <PageHeader
        title={t('users')}
        subtitle="Staff accounts and their access roles"
        actions={<Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add User</Button>}
      />

      <TableCard>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('name')}</TableCell><TableCell>Email</TableCell><TableCell>Phone</TableCell>
              <TableCell>Role</TableCell><TableCell>Status</TableCell><TableCell align="right">{t('actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 && (
              <TableRow><TableCell colSpan={6} sx={{ border: 0 }}>
                <EmptyState icon={<GroupOutlined />} title="No users yet" subtitle="Add a staff account to get started." />
              </TableCell></TableRow>
            )}
            {users.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell><NameCell name={u.name} secondary={u.email} /></TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{u.email}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{u.phone}</TableCell>
                <TableCell><Chip size="small" label={u.role} color={u.role === 'admin' ? 'primary' : 'default'} variant={u.role === 'admin' ? 'filled' : 'outlined'} sx={{ textTransform: 'capitalize', fontWeight: 700 }} /></TableCell>
                <TableCell><Chip size="small" label={u.isActive ? 'active' : 'inactive'} color={u.isActive ? 'success' : 'default'} variant={u.isActive ? 'filled' : 'outlined'} sx={{ textTransform: 'capitalize' }} /></TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(u)}><Edit fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => del(u.id)}><Delete fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} mt={0}>
            <Grid item xs={12} sm={6}><TextField label={t('name')} fullWidth size="small" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Email" fullWidth size="small" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Phone" fullWidth size="small" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Role" fullWidth size="small" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <MenuItem value="admin">admin</MenuItem>
                <MenuItem value="cashier">cashier</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}><TextField label={editId ? 'New Password (optional)' : 'Password'} type="password" fullWidth size="small" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Grid>
            {editId && (
              <Grid item xs={12} sm={6}>
                <TextField select label="Status" fullWidth size="small" value={form.isActive ? 'true' : 'false'} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}>
                  <MenuItem value="true">active</MenuItem>
                  <MenuItem value="false">inactive</MenuItem>
                </TextField>
              </Grid>
            )}

            <Grid item xs={12}>
              {form.role === 'admin' ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', color: 'text.secondary' }}>
                  <LockOutlined fontSize="small" />
                  <Typography variant="body2">Admins have full access to every screen.</Typography>
                </Box>
              ) : (
                <>
                  <Divider sx={{ mb: 1.5 }} />
                  <Typography variant="subtitle2" gutterBottom>Screen Access</Typography>
                  <Typography variant="caption" color="text.secondary">Choose which screens this cashier can open.</Typography>
                  <FormGroup>
                    <Grid container>
                      {GRANTABLE_SCREENS.map((s) => (
                        <Grid item xs={12} sm={6} key={s.key}>
                          <FormControlLabel
                            control={<Checkbox size="small" checked={(form.permissions || []).includes(s.key)} onChange={() => togglePerm(s.key)} />}
                            label={s.label}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </FormGroup>
                </>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={save} disabled={!form.name || !form.email || (!editId && !form.password)}>{t('save')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
