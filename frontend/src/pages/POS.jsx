import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box, Grid, Paper, TextField, Typography, Card, CardActionArea, CardContent, IconButton,
  Button, Divider, Stack, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Chip, Snackbar, Alert,
} from '@mui/material';
import {
  Add, Remove, Delete, Print, WhatsApp, CloudOff, CloudDone, SearchRounded,
  QrCodeScannerRounded, ShoppingCartOutlined, Inventory2Outlined,
} from '@mui/icons-material';
import api from '../services/api.js';
import { useFetch } from '../hooks/useApi.js';
import { useI18n } from '../context/I18nContext.jsx';
import { printReceipt } from '../components/Receipt.jsx';
import { enqueueSale, syncQueue, isOnline, getQueue } from '../utils/offlineQueue.js';
import { PageHeader, EmptyState } from '../components/ui.jsx';
import { InputAdornment } from '@mui/material';

const money = (n) => 'Rs ' + Number(n || 0).toFixed(2);

export default function POS() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [payOpen, setPayOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [toast, setToast] = useState(null);
  const [online, setOnline] = useState(isOnline());
  const [queueCount, setQueueCount] = useState(getQueue().length);
  const barcodeRef = useRef(null);

  const { data: prodData, refetch: refetchProducts } = useFetch('pos-products', '/products', { limit: 100, search });
  const { data: custData } = useFetch('pos-customers', '/customers');
  const { data: settingData } = useFetch('settings', '/settings');
  const products = prodData?.data || [];
  const customers = custData?.data || [];
  const shop = settingData?.data || {};
  const taxPct = Number(shop.taxPercentage || 0);

  useEffect(() => {
    const on = () => { setOnline(true); doSync(); };
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    if (isOnline()) doSync();
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
    // eslint-disable-next-line
  }, []);

  const doSync = async () => {
    try { const r = await syncQueue(); setQueueCount(getQueue().length); if (r.synced) { setToast({ sev: 'success', msg: `Synced ${r.synced} offline sale(s)` }); refetchProducts(); } } catch { /* offline */ }
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const found = prev.find((i) => i.productId === product.id);
      if (found) return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, unitPrice: Number(product.sellingPrice), quantity: 1, discount: 0, stock: product.stockQuantity }];
    });
  };

  const handleBarcode = async (e) => {
    if (e.key !== 'Enter') return;
    const code = e.target.value.trim();
    if (!code) return;
    try {
      const { data } = await api.get(`/products/barcode/${code}`);
      addToCart(data.data);
      e.target.value = '';
    } catch { setToast({ sev: 'error', msg: 'Product not found for barcode' }); }
  };

  const changeQty = (id, delta) => setCart((p) => p.map((i) => i.productId === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  const removeItem = (id) => setCart((p) => p.filter((i) => i.productId !== id));

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.unitPrice * i.quantity - (i.discount || 0), 0), [cart]);
  const taxable = subtotal - Number(discount || 0);
  const tax = +(taxable * (taxPct / 100)).toFixed(2);
  const grandTotal = +(taxable + tax).toFixed(2);
  const isCredit = paymentMethod === 'credit';
  const paid = isCredit ? Number(amountPaid || 0) : paymentMethod === 'mixed' ? Number(cashAmount || 0) + Number(cardAmount || 0) : Number(amountPaid || 0);
  const change = paid > grandTotal ? +(paid - grandTotal).toFixed(2) : 0;

  const resetSale = () => { setCart([]); setDiscount(0); setAmountPaid(''); setCashAmount(''); setCardAmount(''); setCustomerId(''); setPaymentMethod('cash'); };

  const completeSale = async () => {
    const payload = {
      items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount })),
      discount: Number(discount || 0), taxPercentage: taxPct, paymentMethod,
      amountPaid: paid, cashAmount: Number(cashAmount || 0), cardAmount: Number(cardAmount || 0),
      customerId: customerId || null, isCredit,
    };

    if (!online) {
      enqueueSale(payload);
      setQueueCount(getQueue().length);
      setToast({ sev: 'warning', msg: 'Offline — sale queued, will sync when online' });
      setPayOpen(false); resetSale();
      return;
    }

    try {
      const { data } = await api.post('/sales', payload);
      const sale = data.data;
      setPayOpen(false);
      setToast({ sev: 'success', msg: `Sale ${sale.invoiceNumber} completed` });
      printReceipt(sale, shop);
      window._lastSale = sale;
      resetSale();
      refetchProducts(); // refresh on-screen stock counts in real time
    } catch (err) {
      setToast({ sev: 'error', msg: err.response?.data?.message || 'Sale failed' });
    }
  };

  const shareWhatsApp = () => {
    const lines = cart.map((i) => `${i.name} x${i.quantity} = ${money(i.unitPrice * i.quantity)}`).join('%0A');
    const text = `*${shop.shopName || 'Invoice'}*%0A${lines}%0A%0ATotal: ${money(grandTotal)}%0A${shop.receiptFooter || ''}`;
    const cust = customers.find((c) => c.id === Number(customerId));
    const phone = cust?.phone ? cust.phone.replace(/[^0-9]/g, '') : '';
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <Box>
      <PageHeader
        title={t('pos')}
        subtitle="Scan or tap products to build the cart, then check out"
        actions={
          <Chip
            icon={online ? <CloudDone /> : <CloudOff />} color={online ? 'success' : 'warning'}
            variant={online ? 'filled' : 'filled'}
            label={online ? `Online${queueCount ? ` • ${queueCount} queued` : ''}` : `Offline • ${queueCount} queued`}
            sx={{ fontWeight: 700, px: 0.5 }}
          />
        }
      />

      <Grid container spacing={2.5}>
        {/* Product selection */}
        <Grid item xs={12} md={7} lg={8}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2.5}>
              <TextField
                fullWidth size="small" placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> }}
              />
              <TextField
                inputRef={barcodeRef} size="small" placeholder={t('barcode')} onKeyDown={handleBarcode} sx={{ minWidth: { sm: 200 } }}
                InputProps={{ startAdornment: <InputAdornment position="start"><QrCodeScannerRounded fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> }}
              />
            </Stack>
            <Grid container spacing={1.5} sx={{ maxHeight: '66vh', overflow: 'auto', pr: 0.5 }}>
              {products.length === 0 && (
                <Grid item xs={12}>
                  <EmptyState icon={<Inventory2Outlined />} title="No products" subtitle="Try a different search term." />
                </Grid>
              )}
              {products.map((p) => {
                const out = p.stockQuantity <= 0;
                const low = p.stockQuantity <= p.reorderLevel;
                return (
                  <Grid item xs={6} sm={4} md={4} lg={3} key={p.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: '100%', transition: 'all .15s ease', opacity: out ? 0.55 : 1,
                        '&:hover': out ? {} : { borderColor: 'primary.main', boxShadow: '0 6px 18px rgba(37,99,235,0.14)', transform: 'translateY(-2px)' },
                      }}
                    >
                      <CardActionArea onClick={() => addToCart(p)} disabled={out} sx={{ height: '100%', p: 0.5 }}>
                        <CardContent sx={{ p: 1.5 }}>
                          <Typography variant="body2" fontWeight={700} noWrap title={p.name}>{p.name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>{p.sku}</Typography>
                          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={0.5}>
                            <Typography variant="subtitle1" fontWeight={800} color="primary.main">{money(p.sellingPrice)}</Typography>
                            <Chip size="small" label={out ? 'Out' : p.stockQuantity}
                              color={out ? 'error' : low ? 'warning' : 'default'}
                              sx={{ fontWeight: 700 }} />
                          </Stack>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Grid>

        {/* Cart */}
        <Grid item xs={12} md={5} lg={4}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, position: { md: 'sticky' }, top: { md: 88 } }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
              <ShoppingCartOutlined color="primary" />
              <Typography variant="h6">{t('cart')}</Typography>
              <Chip size="small" label={cart.length} color="primary" sx={{ fontWeight: 700 }} />
            </Stack>
            <Box sx={{ maxHeight: '38vh', overflow: 'auto', mx: -0.5, px: 0.5 }}>
              {cart.length === 0 && <EmptyState icon={<ShoppingCartOutlined />} title="Cart is empty" subtitle="Add products to get started." />}
              {cart.map((i) => (
                <Stack key={i.productId} direction="row" alignItems="center" spacing={1}
                  sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body2" fontWeight={600} noWrap>{i.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{money(i.unitPrice)} × {i.quantity}</Typography>
                  </Box>
                  <Stack direction="row" alignItems="center" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <IconButton size="small" onClick={() => changeQty(i.productId, -1)}><Remove fontSize="small" /></IconButton>
                    <Typography sx={{ minWidth: 22, textAlign: 'center', fontWeight: 600 }}>{i.quantity}</Typography>
                    <IconButton size="small" onClick={() => changeQty(i.productId, 1)}><Add fontSize="small" /></IconButton>
                  </Stack>
                  <Typography sx={{ width: 76, textAlign: 'right', fontWeight: 700 }}>{money(i.unitPrice * i.quantity)}</Typography>
                  <IconButton size="small" color="error" onClick={() => removeItem(i.productId)}><Delete fontSize="small" /></IconButton>
                </Stack>
              ))}
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <TextField select size="small" fullWidth label={t('customers')} value={customerId} onChange={(e) => setCustomerId(e.target.value)} sx={{ mb: 1.5 }}>
              <MenuItem value="">Walk-in</MenuItem>
              {customers.map((c) => <MenuItem key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</MenuItem>)}
            </TextField>
            <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5, color: 'text.secondary' }}><span>{t('subtotal')}</span><Typography fontWeight={600} color="text.primary">{money(subtotal)}</Typography></Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
              <Typography color="text.secondary">{t('discount')}</Typography>
              <TextField size="small" type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} sx={{ width: 120 }} />
            </Stack>
            <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5, color: 'text.secondary' }}><span>{t('tax')} ({taxPct}%)</span><Typography fontWeight={600} color="text.primary">{money(tax)}</Typography></Stack>
            <Box sx={{ mt: 1.5, p: 1.75, borderRadius: 2.5, bgcolor: 'primary.main', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography fontWeight={700}>{t('grandTotal')}</Typography>
              <Typography variant="h6" fontWeight={800}>{money(grandTotal)}</Typography>
            </Box>
            <Button variant="contained" size="large" fullWidth disabled={!cart.length} sx={{ mt: 1.5 }}
              onClick={() => { setAmountPaid(grandTotal.toFixed(2)); setPayOpen(true); }}>
              {t('checkout')}
            </Button>
            {window._lastSale && (
              <Button startIcon={<Print />} fullWidth variant="outlined" sx={{ mt: 1 }} onClick={() => printReceipt(window._lastSale, shop)}>
                Reprint last receipt
              </Button>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Payment dialog */}
      <Dialog open={payOpen} onClose={() => setPayOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('checkout')} — {money(grandTotal)}</DialogTitle>
        <DialogContent>
          <TextField select fullWidth label={t('paymentMethod')} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} sx={{ my: 1 }}>
            <MenuItem value="cash">{t('cash')}</MenuItem>
            <MenuItem value="card">{t('card')}</MenuItem>
            <MenuItem value="mixed">{t('mixed')}</MenuItem>
            <MenuItem value="credit">{t('credit')}</MenuItem>
          </TextField>
          {paymentMethod === 'mixed' ? (
            <Stack spacing={1}>
              <TextField label={t('cash')} type="number" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} />
              <TextField label={t('card')} type="number" value={cardAmount} onChange={(e) => setCardAmount(e.target.value)} />
            </Stack>
          ) : (
            <TextField fullWidth label={t('amountPaid')} type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
          )}
          {isCredit && !customerId && <Alert severity="warning" sx={{ mt: 1 }}>Select a customer for credit (Udhaar) sales.</Alert>}
          <Stack direction="row" justifyContent="space-between" mt={2}><span>{t('change')}</span><strong>{money(change)}</strong></Stack>
          {isCredit && <Stack direction="row" justifyContent="space-between"><span>Udhaar Due</span><strong>{money(Math.max(0, grandTotal - paid))}</strong></Stack>}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<WhatsApp />} color="success" onClick={shareWhatsApp}>WhatsApp</Button>
          <Button onClick={() => setPayOpen(false)}>{t('cancel')}</Button>
          <Button variant="contained" disabled={isCredit && !customerId} onClick={completeSale}>{t('completeSale')}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}>
        {toast && <Alert severity={toast.sev} onClose={() => setToast(null)}>{toast.msg}</Alert>}
      </Snackbar>
    </Box>
  );
}
