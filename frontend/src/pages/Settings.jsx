import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, MenuItem, Stack, Snackbar, Alert,
} from '@mui/material';
import { Save, StorefrontOutlined, ReceiptLongOutlined } from '@mui/icons-material';
import { useFetch } from '../hooks/useApi.js';
import { useI18n } from '../context/I18nContext.jsx';
import api from '../services/api.js';
import { PageHeader } from '../components/ui.jsx';

const SectionTitle = ({ icon, children }) => (
  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
    <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
    <Typography variant="subtitle1" fontWeight={700}>{children}</Typography>
  </Stack>
);

export default function Settings() {
  const { t } = useI18n();
  const { data, refetch } = useFetch('settings', '/settings');
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (data?.data) setForm(data.data); }, [data]);

  if (!form) return <Typography color="text.secondary">Loading…</Typography>;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    await api.put('/settings', {
      shopName: form.shopName, address: form.address, phone: form.phone, logoUrl: form.logoUrl,
      taxPercentage: Number(form.taxPercentage) || 0, currency: form.currency,
      receiptFooter: form.receiptFooter, receiptTemplate: form.receiptTemplate,
    });
    setSaved(true); refetch();
  };

  return (
    <Box>
      <PageHeader title={t('settings')} subtitle="Shop details, tax, currency and receipt configuration" />
      <Box sx={{ maxWidth: 760 }}>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 2.5 }}>
          <SectionTitle icon={<StorefrontOutlined fontSize="small" />}>Shop Information</SectionTitle>
          <Typography variant="body2" color="text.secondary" mb={2}>Appears on receipts and invoices.</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField label="Shop Name" fullWidth size="small" value={form.shopName || ''} onChange={set('shopName')} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Phone" fullWidth size="small" value={form.phone || ''} onChange={set('phone')} /></Grid>
            <Grid item xs={12}><TextField label="Address" fullWidth size="small" multiline rows={2} value={form.address || ''} onChange={set('address')} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Logo URL" fullWidth size="small" value={form.logoUrl || ''} onChange={set('logoUrl')} /></Grid>
            <Grid item xs={6} sm={3}><TextField label="Tax %" type="number" fullWidth size="small" value={form.taxPercentage ?? 0} onChange={set('taxPercentage')} /></Grid>
            <Grid item xs={6} sm={3}><TextField label="Currency" fullWidth size="small" value={form.currency || 'PKR'} onChange={set('currency')} /></Grid>
          </Grid>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <SectionTitle icon={<ReceiptLongOutlined fontSize="small" />}>Receipt</SectionTitle>
          <Typography variant="body2" color="text.secondary" mb={2}>Printing format and footer message.</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField select label="Receipt Template" fullWidth size="small" value={form.receiptTemplate || '80mm'} onChange={set('receiptTemplate')}>
                <MenuItem value="58mm">58mm Thermal</MenuItem>
                <MenuItem value="80mm">80mm Thermal</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField label="Receipt Footer" fullWidth size="small" value={form.receiptFooter || ''} onChange={set('receiptFooter')} /></Grid>
          </Grid>
        </Paper>

        <Stack direction="row" justifyContent="flex-end" mt={2.5}>
          <Button variant="contained" size="large" startIcon={<Save />} onClick={save}>{t('save')}</Button>
        </Stack>
      </Box>
      <Snackbar open={saved} autoHideDuration={2500} onClose={() => setSaved(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSaved(false)} variant="filled">Settings saved</Alert>
      </Snackbar>
    </Box>
  );
}
