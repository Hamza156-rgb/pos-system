import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, Stack,
  InputAdornment, IconButton, Divider, CircularProgress,
} from '@mui/material';
import {
  StorefrontRounded, EmailOutlined, LockOutlined, Visibility, VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@pos.com');
  const [password, setPassword] = useState('admin123');
  const [showPw, setShowPw] = useState(false);
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

  const fillDemo = (em, pw) => { setEmail(em); setPassword(pw); };

  return (
    <Box
      sx={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
        position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(120% 120% at 100% 0%, #1e3a8a 0%, #0f172a 45%, #0b1220 100%)',
      }}
    >
      {/* decorative glows */}
      <Box sx={{ position: 'absolute', width: 480, height: 480, borderRadius: '50%', top: -160, right: -120,
        background: 'radial-gradient(circle, rgba(13,148,136,0.35), transparent 60%)' }} />
      <Box sx={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', bottom: -160, left: -120,
        background: 'radial-gradient(circle, rgba(37,99,235,0.35), transparent 60%)' }} />

      <Card sx={{ width: 420, maxWidth: '100%', position: 'relative', boxShadow: '0 24px 60px rgba(2,6,23,0.45)' }}>
        <CardContent sx={{ p: { xs: 3, sm: 4.5 } }}>
          <Stack alignItems="center" spacing={1.5} mb={3}>
            <Box sx={{ width: 56, height: 56, borderRadius: 3, display: 'grid', placeItems: 'center', color: '#fff',
              background: 'linear-gradient(135deg,#3b82f6,#0d9488)', boxShadow: '0 10px 24px rgba(37,99,235,0.4)' }}>
              <StorefrontRounded />
            </Box>
            <Box textAlign="center">
              <Typography variant="h5" fontWeight={800}>Welcome back</Typography>
              <Typography variant="body2" color="text.secondary">
                Al-Madina Stationery &amp; Books — Lahore
              </Typography>
            </Box>
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={submit}>
            <Stack spacing={2}>
              <TextField
                label={t('email')} value={email} onChange={(e) => setEmail(e.target.value)} fullWidth autoFocus
                InputProps={{ startAdornment: (<InputAdornment position="start"><EmailOutlined fontSize="small" /></InputAdornment>) }}
              />
              <TextField
                label={t('password')} type={showPw ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)} fullWidth
                InputProps={{
                  startAdornment: (<InputAdornment position="start"><LockOutlined fontSize="small" /></InputAdornment>),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPw((s) => !s)} edge="end" size="small">
                        {showPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ mt: 0.5 }}>
                {loading ? <CircularProgress size={22} color="inherit" /> : t('login')}
              </Button>
            </Stack>
          </form>

          <Divider sx={{ my: 2.5 }}><Typography variant="caption" color="text.secondary">Demo accounts</Typography></Divider>
          <Stack direction="row" spacing={1.5}>
            <Button fullWidth variant="outlined" size="small" onClick={() => fillDemo('admin@pos.com', 'admin123')}>
              Admin
            </Button>
            <Button fullWidth variant="outlined" size="small" onClick={() => fillDemo('cashier@pos.com', 'cashier123')}>
              Cashier
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
