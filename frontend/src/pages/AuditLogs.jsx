import { useState } from 'react';
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody, Pagination, Stack, Chip,
} from '@mui/material';
import { HistoryOutlined } from '@mui/icons-material';
import { useFetch } from '../hooks/useApi.js';
import { useI18n } from '../context/I18nContext.jsx';
import { PageHeader, TableCard, EmptyState } from '../components/ui.jsx';

export default function AuditLogs() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useFetch('audit', '/audit-logs', { page, limit: 20 });
  const logs = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <Box>
      <PageHeader title={t('auditLogs')} subtitle="A trail of key actions performed across the system" />
      <TableCard>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell><TableCell>User</TableCell><TableCell>Action</TableCell>
              <TableCell>Entity</TableCell><TableCell>Description</TableCell><TableCell>IP</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>Loading…</TableCell></TableRow>}
            {!isLoading && logs.length === 0 && (
              <TableRow><TableCell colSpan={6} sx={{ border: 0 }}>
                <EmptyState icon={<HistoryOutlined />} title="No audit entries" subtitle="Activity will be recorded here as it happens." />
              </TableCell></TableRow>
            )}
            {logs.map((l) => (
              <TableRow key={l.id} hover>
                <TableCell sx={{ color: 'text.secondary' }}>{new Date(l.createdAt).toLocaleString()}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{l.User?.name || '-'}</TableCell>
                <TableCell><Chip size="small" label={l.action} sx={{ textTransform: 'capitalize', fontWeight: 600 }} /></TableCell>
                <TableCell>{l.entity}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{l.description}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{l.ip}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>
      <Stack alignItems="center" mt={2.5}>
        <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" />
      </Stack>
    </Box>
  );
}
