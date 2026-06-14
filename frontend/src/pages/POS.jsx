import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box, Grid, Paper, TextField, Typography, Card, CardActionArea, CardContent, IconButton,
  Button, Divider, Stack, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Chip, Snackbar, Alert,
} from '@mui/material';
import { Add, Remove, Delete, Print, WhatsApp, CloudOff, CloudDone } from '@mui/icons-material';
import api from '../services/api.js';
import { useFetch } from '../hooks/useApi.js';
import { useI18n } from '../context/I18nContext.jsx';
import { printReceipt } from '../components/Receipt.jsx';
import { enqueueSale, syncQueue, isOnline, getQueue } from '../utils/offlineQueue.js';

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

  const { data: prodData } = useFetch('pos-products', '/products', { limit: 100, search });
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
    try { const r = await syncQueue(); setQueueCount(getQueue().length); if (r.synced) setToast({ sev: 'success', msg: `Synced ${r.synced} offline sale(s)` }); } catch { /* offline */ }
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight={700}>{t('pos')}</Typography>
        <Chip icon={online ? <CloudDone /> : <CloudOff />} color={online ? 'success' : 'warning'}
          label={online ? `Online${queueCount ? ` • ${queueCount} queued` : ''}` : `Offline • ${queueCount} queued`} />
      </Stack>

      <Grid container spacing={2}>
        {/* Product selection */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} mb={2}>
              <TextField fullWidth size="small" label={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} />
              <TextField inputRef={barcodeRef} size="small" label={t('barcode')} placeholder="Scan / Enter" onKeyDown={handleBarcode} />
            </Stack>
            <Grid container spacing={1} sx={{ maxHeight: '65vh', overflow: 'auto' }}>
              {products.map((p) => (
                <Grid item xs={6} sm={4} md={3} key={p.id}>
                  <Card variant="outlined">
                    <CardActionArea onClick={() => addToCart(p)} disabled={p.stockQuantity <= 0}>
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{p.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{p.sku}</Typography>
                        <Typography variant="subtitle2" color="primary">{money(p.sellingPrice)}</Typography>
                        <Chip size="small" label={`Stock: ${p.stockQuantity}`} color={p.stockQuantity <= p.reorderLevel ? 'error' : 'default'} />
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Cart */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" mb={1}>{t('cart')} ({cart.length})</Typography>
            <Box sx={{ maxHeight: '40vh', overflow: 'auto' }}>
              {cart.length === 0 && <Typography color="text.secondary">No items</Typography>}
              {cart.map((i) => (
                <Stack key={i.productId} direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={600}>{i.name}</Typography>
                    <Typography variant="caption">{money(i.unitPrice)} × {i.quantity}</Typography>
                  </Box>
                  <IconButton size="small" onClick={() => changeQty(i.productId, -1)}><Remove fontSize="small" /></IconButton>
                  <Typography>{i.quantity}</Typography>
                  <IconButton size="small" onClick={() => changeQty(i.productId, 1)}><Add fontSize="small" /></IconButton>
                  <Typography sx={{ width: 70, textAlign: 'right' }}>{money(i.unitPrice * i.quantity)}</Typography>
                  <IconButton size="small" color="error" onClick={() => removeItem(i.productId)}><Delete fontSize="small" /></IconButton>
                </Stack>
              ))}
            </Box>
            <Divider sx={{ my: 1 }} />
            <TextField select size="small" fullWidth label={t('customers')} value={customerId} onChange={(e) => setCustomerId(e.target.value)} sx={{ mb: 1 }}>
              <MenuItem value="">Walk-in</MenuItem>
              {customers.map((c) => <MenuItem key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</MenuItem>)}
            </TextField>
            <Stack direction="row" justifyContent="space-between"><span>{t('subtotal')}</span><span>{money(subtotal)}</span></Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <span>{t('discount')}</span>
              <TextField size="small" type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} sx={{ width: 110 }} />
            </Stack>
            <Stack direction="row" justifyContent="space-between"><span>{t('tax')} ({taxPct}%)</span><span>{money(tax)}</span></Stack>
            <Stack direction="row" justifyContent="space-between" sx={{ fontWeight: 700, fontSize: 20, my: 1 }}>
              <span>{t('grandTotal')}</span><span>{money(grandTotal)}</span>
            </Stack>
            <Button variant="contained" size="large" fullWidth disabled={!cart.length} onClick={() => { setAmountPaid(grandTotal.toFixed(2)); setPayOpen(true); }}>
              {t('checkout')}
            </Button>
            {window._lastSale && (
              <Button startIcon={<Print />} fullWidth sx={{ mt: 1 }} onClick={() => printReceipt(window._lastSale, shop)}>
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
