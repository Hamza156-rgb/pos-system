import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Box, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Divider, Avatar, Menu, MenuItem, Button, useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon, PointOfSale, Inventory2, Category, People, LocalShipping,
  ShoppingCart, Assessment, Settings as SettingsIcon, Group, History, Menu as MenuIcon, Translate, Logout,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';

const drawerWidth = 240;

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const { t, toggleLang, lang } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const isMobile = useMediaQuery('(max-width:900px)');

  const nav = [
    { to: '/', label: t('dashboard'), icon: <DashboardIcon /> },
    { to: '/pos', label: t('pos'), icon: <PointOfSale /> },
    { to: '/products', label: t('products'), icon: <Category /> },
    { to: '/inventory', label: t('inventory'), icon: <Inventory2 /> },
    { to: '/customers', label: t('customers'), icon: <People /> },
    { to: '/suppliers', label: t('suppliers'), icon: <LocalShipping />, admin: true },
    { to: '/purchases', label: t('purchases'), icon: <ShoppingCart />, admin: true },
    { to: '/reports', label: t('reports'), icon: <Assessment />, admin: true },
    { to: '/users', label: t('users'), icon: <Group />, admin: true },
    { to: '/audit-logs', label: t('auditLogs'), icon: <History />, admin: true },
    { to: '/settings', label: t('settings'), icon: <SettingsIcon />, admin: true },
  ].filter((n) => !n.admin || isAdmin);

  const drawer = (
    <Box>
      <Toolbar><Typography variant="h6" fontWeight={700} color="primary">POS System</Typography></Toolbar>
      <Divider />
      <List>
        {nav.map((n) => (
          <ListItemButton key={n.to} selected={location.pathname === n.to}
            onClick={() => { navigate(n.to); setMobileOpen(false); }}>
            <ListItemIcon>{n.icon}</ListItemIcon>
            <ListItemText primary={n.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (th) => th.zIndex.drawer + 1 }}>
        <Toolbar>
          {isMobile && (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Point of Sale & Inventory</Typography>
          <Button color="inherit" startIcon={<Translate />} onClick={toggleLang}>
            {lang === 'en' ? 'اردو' : 'EN'}
          </Button>
          <IconButton onClick={(e) => setAnchor(e.currentTarget)} sx={{ ml: 1 }}>
            <Avatar sx={{ width: 32, height: 32 }}>{user?.name?.[0] || 'U'}</Avatar>
          </IconButton>
          <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
            <MenuItem disabled>{user?.name} ({user?.role})</MenuItem>
            <Divider />
            <MenuItem onClick={() => { logout(); navigate('/login'); }}>
              <Logout fontSize="small" sx={{ mr: 1 }} /> {t('logout')}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer variant={isMobile ? 'temporary' : 'permanent'} open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
