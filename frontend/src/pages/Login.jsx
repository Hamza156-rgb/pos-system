import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Stack } from '@mui/material';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@pos.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#1565c0,#00897b)' }}>
      <Card sx={{ width: 400, maxWidth: '90%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} align="center" gutterBottom>POS & Inventory</Typography>
          <Typography variant="body2" align="center" color="text.secondary" mb={3}>Al-Madina Stationery, Lahore</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={submit}>
            <Stack spacing={2}>
              <TextField label={t('email')} value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
              <TextField label={t('password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
              <Button type="submit" variant="contained" size="large" disabled={loading}>
                {loading ? '...' : t('login')}
              </Button>
            </Stack>
          </form>
          <Typography variant="caption" display="block" align="center" mt={2} color="text.secondary">
            admin@pos.com / admin123 &nbsp;•&nbsp; cashier@pos.com / cashier123
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
