import { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Pagination, Stack, Chip,
} from '@mui/material';
import { useFetch } from '../hooks/useApi.js';
import { useI18n } from '../context/I18nContext.jsx';

export default function AuditLogs() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useFetch('audit', '/audit-logs', { page, limit: 20 });
  const logs = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={2}>{t('auditLogs')}</Typography>
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell><TableCell>User</TableCell><TableCell>Action</TableCell>
              <TableCell>Entity</TableCell><TableCell>Description</TableCell><TableCell>IP</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>}
            {!isLoading && logs.length === 0 && <TableRow><TableCell colSpan={6}>No audit entries.</TableCell></TableRow>}
            {logs.map((l) => (
              <TableRow key={l.id} hover>
                <TableCell>{new Date(l.createdAt).toLocaleString()}</TableCell>
                <TableCell>{l.User?.name || '-'}</TableCell>
                <TableCell><Chip size="small" label={l.action} /></TableCell>
                <TableCell>{l.entity}</TableCell>
                <TableCell>{l.description}</TableCell>
                <TableCell>{l.ip}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Stack alignItems="center" mt={2}>
        <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
      </Stack>
    </Box>
  );
}
