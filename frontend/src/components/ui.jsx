import { Box, Paper, Typography, Stack, TextField, InputAdornment, Card, CardContent } from '@mui/material';
import { SearchRounded } from '@mui/icons-material';

/** Page hero: big title + optional subtitle on the left, actions on the right. */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'stretch', sm: 'center' }}
      gap={1.5}
      mb={3}
    >
      <Box>
        <Typography variant="h4">{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
      </Box>
      {actions && <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>{actions}</Stack>}
    </Stack>
  );
}

/** Search input with a leading icon. Pass any TextField props through. */
export function SearchField({ sx, ...props }) {
  return (
    <TextField
      size="small"
      fullWidth
      InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> }}
      sx={{ maxWidth: 520, ...sx }}
      {...props}
    />
  );
}

/** Rounded, outlined surface for tables with horizontal scroll on small screens. */
export function TableCard({ children, sx }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', ...sx }}>
      <Box sx={{ overflowX: 'auto' }}>{children}</Box>
    </Paper>
  );
}

/** Friendly empty state — drop inside a full-width table cell or any container. */
export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <Stack alignItems="center" justifyContent="center" spacing={1.25} sx={{ py: 6, px: 2, textAlign: 'center' }}>
      {icon && (
        <Box sx={{ width: 56, height: 56, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: '#f1f5f9', color: '#94a3b8' }}>
          {icon}
        </Box>
      )}
      <Typography variant="subtitle1" color="text.primary">{title}</Typography>
      {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
      {action}
    </Stack>
  );
}

/** Metric tile with a soft colored icon badge. */
export function StatCard({ label, value, icon, color = 'primary' }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {icon && (
          <Box
            sx={{
              width: 52, height: 52, borderRadius: 3, display: 'grid', placeItems: 'center', flexShrink: 0,
              color: `${color}.main`, background: (th) => `${th.palette[color].main}14`,
            }}
          >
            {icon}
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography color="text.secondary" variant="body2" noWrap>{label}</Typography>
          <Typography variant="h5" fontWeight={800} noWrap>{value}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
