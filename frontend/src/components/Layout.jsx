import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Box, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Avatar, Menu, MenuItem, Button, useMediaQuery, Tooltip, Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon, PointOfSale, Inventory2, Category, People, LocalShipping,
  ShoppingCart, Assessment, Settings as SettingsIcon, Group, History, Menu as MenuIcon,
  Translate, Logout, StorefrontRounded, AssignmentReturn, AssignmentReturned, MenuBook,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { sidebar } from '../theme.js';

const drawerWidth = sidebar.width;

export default function Layout() {
  const { user, logout, isAdmin, can } = useAuth();
  const { t, toggleLang, lang } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const isMobile = useMediaQuery('(max-width:900px)');

  const isVisible = (n) => {
    if (n.admin) return isAdmin;
    if (n.anyPerm) return isAdmin || n.anyPerm.some((p) => can(p));
    return n.perm ? can(n.perm) : true;
  };

  const navGroups = [
    { items: [
      { to: '/', label: t('dashboard'), icon: <DashboardIcon /> },
      { to: '/pos', label: t('pos'), icon: <PointOfSale />, perm: 'pos' },
    ] },
    { heading: 'Catalog', items: [
      { to: '/products', label: t('products'), icon: <Category />, perm: 'products' },
      { to: '/inventory', label: t('inventory'), icon: <Inventory2 />, perm: 'inventory' },
    ] },
    { heading: 'People', items: [
      { to: '/customers', label: t('customers'), icon: <People />, perm: 'customers' },
      { to: '/suppliers', label: t('suppliers'), icon: <LocalShipping />, perm: 'suppliers' },
    ] },
    { heading: 'Transactions', items: [
      { to: '/purchases', label: t('purchases'), icon: <ShoppingCart />, perm: 'purchases' },
      { to: '/sale-returns', label: 'Sale Returns', icon: <AssignmentReturn />, perm: 'sale-returns' },
      { to: '/purchase-returns', label: 'Purchase Returns', icon: <AssignmentReturned />, perm: 'purchase-returns' },
    ] },
    { heading: 'Finance', items: [
      { to: '/ledgers', label: 'Ledgers', icon: <MenuBook />, anyPerm: ['customers', 'suppliers'] },
      { to: '/reports', label: t('reports'), icon: <Assessment />, perm: 'reports' },
    ] },
    { heading: 'Admin', items: [
      { to: '/users', label: t('users'), icon: <Group />, admin: true },
      { to: '/audit-logs', label: t('auditLogs'), icon: <History />, admin: true },
      { to: '/settings', label: t('settings'), icon: <SettingsIcon />, admin: true },
    ] },
  ]
    .map((g) => ({ ...g, items: g.items.filter(isVisible) }))
    .filter((g) => g.items.length);

  const allItems = navGroups.flatMap((g) => g.items);
  const pageTitle = allItems.find((n) => n.to === location.pathname)?.label || t('dashboard');

  const drawer = (
    <Box
      sx={{
        height: '100%',
        bgcolor: sidebar.bg,
        color: sidebar.text,
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: `radial-gradient(120% 60% at 0% 0%, ${sidebar.bgAccent} 0%, ${sidebar.bg} 55%)`,
      }}
    >
      {/* Brand */}
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 40, height: 40, borderRadius: 2.5, display: 'grid', placeItems: 'center',
            background: 'linear-gradient(135deg,#3b82f6,#0d9488)',
            boxShadow: '0 6px 16px rgba(37,99,235,0.45)', color: '#fff',
          }}
        >
          <StorefrontRounded fontSize="small" />
        </Box>
        <Box sx={{ lineHeight: 1.1 }}>
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.05rem' }}>POS System</Typography>
          <Typography sx={{ color: 'rgba(148,163,184,0.85)', fontSize: '0.72rem', fontWeight: 500 }}>
            Inventory &amp; Sales
          </Typography>
        </Box>
      </Box>

      {/* Nav (grouped) */}
      <List sx={{ px: 1.5, pt: 0.5, flexGrow: 1, overflowY: 'auto' }}>
        {navGroups.map((group, gi) => (
          <Box key={group.heading || gi} sx={{ mb: 0.5 }}>
            {group.heading && (
              <Typography
                sx={{ px: 1.5, pt: gi === 0 ? 0.5 : 1.75, pb: 0.5, fontSize: '0.66rem', fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.55)' }}
              >
                {group.heading}
              </Typography>
            )}
            {group.items.map((n) => {
              const active = location.pathname === n.to;
              return (
                <ListItemButton
                  key={n.to}
                  selected={active}
                  onClick={() => { navigate(n.to); setMobileOpen(false); }}
                  sx={{
                    mb: 0.25, py: 0.85, color: active ? sidebar.textActive : sidebar.text,
                    '& .MuiListItemIcon-root': { color: active ? '#60a5fa' : 'rgba(148,163,184,0.85)', minWidth: 38 },
                    '&:hover': { bgcolor: sidebar.hoverBg, color: '#fff' },
                    '&.Mui-selected, &.Mui-selected:hover': { bgcolor: sidebar.activeBg, color: '#fff' },
                  }}
                >
                  <ListItemIcon>{n.icon}</ListItemIcon>
                  <ListItemText primary={n.label} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: active ? 700 : 500 }} />
                </ListItemButton>
              );
            })}
          </Box>
        ))}
      </List>

      {/* User card */}
      <Box sx={{ p: 1.5 }}>
        <Box
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25, borderRadius: 3,
            border: `1px solid ${sidebar.border}`, bgcolor: 'rgba(148,163,184,0.06)',
          }}
        >
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#2563eb', fontSize: '0.9rem', fontWeight: 700 }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography noWrap sx={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{user?.name}</Typography>
            <Typography noWrap sx={{ color: 'rgba(148,163,184,0.85)', fontSize: '0.72rem', textTransform: 'capitalize' }}>
              {user?.role}
            </Typography>
          </Box>
          <Tooltip title={t('logout')}>
            <IconButton size="small" onClick={() => { logout(); navigate('/login'); }}
              sx={{ color: 'rgba(226,232,240,0.7)', '&:hover': { color: '#f87171', bgcolor: 'rgba(248,113,113,0.12)' } }}>
              <Logout fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" sx={{ zIndex: (th) => th.zIndex.drawer + 1, width: { md: `calc(100% - ${drawerWidth}px)` }, ml: { md: `${drawerWidth}px` } }}>
        <Toolbar>
          {isMobile && (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 1.5 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>{pageTitle}</Typography>
          <Button
            variant="outlined" size="small" startIcon={<Translate />} onClick={toggleLang}
            sx={{ mr: 1, color: 'text.secondary', borderColor: 'divider', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}
          >
            {lang === 'en' ? 'اردو' : 'EN'}
          </Button>
          <Tooltip title={user?.name || ''}>
            <IconButton onClick={(e) => setAnchor(e.currentTarget)}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.9rem', fontWeight: 700 }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
            <MenuItem disabled sx={{ opacity: '1 !important' }}>
              <Box>
                <Typography variant="subtitle2">{user?.name}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{user?.role}</Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { logout(); navigate('/login'); }}>
              <Logout fontSize="small" sx={{ mr: 1 }} /> {t('logout')}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'} open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Box sx={{ mt: 1 }}><Outlet /></Box>
      </Box>
    </Box>
  );
}
