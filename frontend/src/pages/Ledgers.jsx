import { useState } from 'react';
import {
  Box, Tabs, Tab, Autocomplete, TextField, Grid, Table, TableHead, TableRow, TableCell, TableBody,
  Typography, Paper, Stack, Chip,
} from '@mui/material';
import { useFetch } from '../hooks/useApi.js';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, TableCard, EmptyState, StatCard } from '../components/ui.jsx';
import { AccountBalanceWalletOutlined, ReceiptLongOutlined } from '@mui/icons-material';

const money = (n) => 'Rs ' + Number(n || 0).toLocaleString();

function LedgerView({ kind, options, labelKey }) {
  const [party, setParty] = useState(null);
  const [ledger, setLedger] = useState(null);

  const pick = async (p) => {
    setParty(p);
    if (!p) { setLedger(null); return; }
    const res = await api.get(`/ledgers/${kind}/${p.id}`);
    setLedger(res.data.data);
  };

  const balanceLabel = kind === 'customer' ? 'Receivable (they owe)' : 'Payable (we owe)';

  return (
    <Box>
      <Autocomplete
        options={options}
        getOptionLabel={(o) => o[labelKey] || ''}
        value={party}
        onChange={(_, v) => pick(v)}
        renderInput={(p) => <TextField {...p} label={kind === 'customer' ? 'Select customer' : 'Select supplier (party)'} size="small" />}
        sx={{ maxWidth: 420, mb: 2.5 }}
      />

      {!ledger && <EmptyState icon={<ReceiptLongOutlined />} title="Select a party" subtitle="Choose a name to view its credit/debit statement." />}

      {ledger && (
        <>
          <Grid container spacing={2.5} mb={2.5}>
            <Grid item xs={12} sm={4}><StatCard label={balanceLabel} value={money(ledger.currentBalance)} icon={<AccountBalanceWalletOutlined />} color={kind === 'customer' ? 'error' : 'warning'} /></Grid>
            <Grid item xs={6} sm={4}><StatCard label="Total Debit" value={money(ledger.totals.debit)} icon={<ReceiptLongOutlined />} color="secondary" /></Grid>
            <Grid item xs={6} sm={4}><StatCard label="Total Credit" value={money(ledger.totals.credit)} icon={<ReceiptLongOutlined />} color="success" /></Grid>
          </Grid>

          <TableCard>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell><TableCell>Ref</TableCell><TableCell>Description</TableCell>
                  <TableCell align="right">Debit</TableCell><TableCell align="right">Credit</TableCell><TableCell align="right">Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ledger.entries.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No transactions.</TableCell></TableRow>
                )}
                {ledger.entries.map((e, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ color: 'text.secondary' }}>{new Date(e.date).toLocaleDateString()}</TableCell>
                    <TableCell><Chip size="small" label={e.ref} variant="outlined" /></TableCell>
                    <TableCell>{e.description}</TableCell>
                    <TableCell align="right" sx={{ color: e.debit ? 'error.main' : 'text.disabled', fontWeight: e.debit ? 600 : 400 }}>{e.debit ? money(e.debit) : '—'}</TableCell>
                    <TableCell align="right" sx={{ color: e.credit ? 'success.dark' : 'text.disabled', fontWeight: e.credit ? 600 : 400 }}>{e.credit ? money(e.credit) : '—'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{money(e.balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </>
      )}
    </Box>
  );
}

export default function Ledgers() {
  const { can } = useAuth();
  const canCust = can('customers');
  const canSup = can('suppliers');
  const [tab, setTab] = useState(canCust ? 0 : 1);

  const { data: custData } = useFetch('customers', '/customers');
  const { data: supData } = useFetch('suppliers', '/suppliers');
  const customers = custData?.data || [];
  const suppliers = supData?.data || [];

  return (
    <Box>
      <PageHeader title="Ledgers" subtitle="Running credit/debit statements for customers and suppliers" />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2.5, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        {canCust && <Tab label="Customer Ledger" value={0} />}
        {canSup && <Tab label="Party (Supplier) Ledger" value={1} />}
      </Tabs>
      {tab === 0 && canCust && <LedgerView kind="customer" options={customers} labelKey="name" />}
      {tab === 1 && canSup && <LedgerView kind="supplier" options={suppliers} labelKey="name" />}
    </Box>
  );
}
