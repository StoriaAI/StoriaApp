import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Paper, 
  Grid, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Alert,
  Snackbar,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const Dashboard = () => {
  const { adminUser, logout, authAxios, isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog states
  const [openNewOrgDialog, setOpenNewOrgDialog] = useState(false);
  const [openAddLicenseDialog, setOpenAddLicenseDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  
  // Form states
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgLicenseCount, setNewOrgLicenseCount] = useState(5);
  const [newOrgAdminUsername, setNewOrgAdminUsername] = useState('');
  const [newOrgAdminPassword, setNewOrgAdminPassword] = useState('');
  
  const [selectedOrg, setSelectedOrg] = useState('');
  const [addLicenseCount, setAddLicenseCount] = useState(5);
  const [deleteOrg, setDeleteOrg] = useState(null);
  
  // Notification state
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login/admin');
    }
  }, [isAuthenticated, navigate]);

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        const response = await authAxios().get('/api/admin/organizations');
        setOrganizations(response.data);
      } catch (err) {
        console.error('Error fetching organizations:', err);
        setError('Failed to fetch organizations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [isAuthenticated, authAxios]);

  // Handle dialog open/close
  const handleOpenNewOrgDialog = () => setOpenNewOrgDialog(true);
  const handleCloseNewOrgDialog = () => {
    setOpenNewOrgDialog(false);
    // Reset form
    setNewOrgName('');
    setNewOrgLicenseCount(5);
    setNewOrgAdminUsername('');
    setNewOrgAdminPassword('');
  };

  const handleOpenAddLicenseDialog = () => setOpenAddLicenseDialog(true);
  const handleCloseAddLicenseDialog = () => {
    setOpenAddLicenseDialog(false);
    setSelectedOrg('');
    setAddLicenseCount(5);
  };

  const handleOpenDeleteDialog = (org) => {
    setDeleteOrg(org);
    setOpenDeleteDialog(true);
  };
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeleteOrg(null);
  };

  // Handle form submissions
  const handleCreateOrganization = async () => {
    if (!newOrgName || !newOrgAdminUsername || !newOrgAdminPassword) {
      setNotification({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }

    try {
      const response = await authAxios().post('/api/admin/organizations', {
        name: newOrgName,
        licenseCount: newOrgLicenseCount,
        adminUsername: newOrgAdminUsername,
        adminPassword: newOrgAdminPassword
      });

      setNotification({
        open: true,
        message: 'Organization created successfully',
        severity: 'success'
      });

      // Refresh organizations list
      const { data } = await authAxios().get('/api/admin/organizations');
      setOrganizations(data);

      // Close dialog
      handleCloseNewOrgDialog();
    } catch (err) {
      console.error('Error creating organization:', err);
      setNotification({
        open: true,
        message: err.response?.data?.error || 'Failed to create organization',
        severity: 'error'
      });
    }
  };

  const handleAddLicenseKeys = async () => {
    if (!selectedOrg) {
      setNotification({
        open: true,
        message: 'Please select an organization',
        severity: 'error'
      });
      return;
    }

    try {
      const response = await authAxios().post(`/api/admin/organizations/${selectedOrg}/license-keys`, {
        licenseCount: addLicenseCount
      });

      setNotification({
        open: true,
        message: response.data.message,
        severity: 'success'
      });

      // Close dialog
      handleCloseAddLicenseDialog();
    } catch (err) {
      console.error('Error adding license keys:', err);
      setNotification({
        open: true,
        message: err.response?.data?.error || 'Failed to add license keys',
        severity: 'error'
      });
    }
  };

  const handleDeleteOrganization = async () => {
    if (!deleteOrg) return;

    try {
      await authAxios().delete(`/api/admin/organizations/${deleteOrg.id}`);
      
      setNotification({
        open: true,
        message: 'Organization deleted successfully',
        severity: 'success'
      });

      // Refresh organizations list
      const { data } = await authAxios().get('/api/admin/organizations');
      setOrganizations(data);

      // Close dialog
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Error deleting organization:', err);
      setNotification({
        open: true,
        message: err.response?.data?.error || 'Failed to delete organization',
        severity: 'error'
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login/admin');
  };

  // Handle notification close
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  if (loading && organizations.length === 0) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh' 
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">Admin Dashboard</Typography>
          <Box>
            <Typography variant="subtitle1" sx={{ mr: 2, display: 'inline' }}>
              Logged in as: {adminUser?.username}
            </Typography>
            <Button variant="outlined" color="error" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { transform: 'scale(1.02)' }
              }}
              onClick={handleOpenNewOrgDialog}
            >
              <AddIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
              <Typography variant="h6">Add New Organization</Typography>
              <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                Create a new organization with admin credentials and license keys
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { transform: 'scale(1.02)' }
              }}
              onClick={handleOpenAddLicenseDialog}
            >
              <AddIcon sx={{ fontSize: 60, mb: 2, color: 'secondary.main' }} />
              <Typography variant="h6">Add License Keys</Typography>
              <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                Add more license keys to an existing organization
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>Organizations</Typography>
          
          {organizations.length === 0 ? (
            <Typography>No organizations found. Create one to get started.</Typography>
          ) : (
            <List>
              {organizations.map((org) => (
                <React.Fragment key={org.id}>
                  <ListItem>
                    <ListItemText
                      primary={org.name}
                      secondary={`Created: ${new Date(org.created_at).toLocaleDateString()}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        aria-label="delete" 
                        onClick={() => handleOpenDeleteDialog(org)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Box>
      
      {/* Dialog for creating a new organization */}
      <Dialog open={openNewOrgDialog} onClose={handleCloseNewOrgDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Organization</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Organization Name"
            type="text"
            fullWidth
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Number of License Keys"
            type="number"
            fullWidth
            value={newOrgLicenseCount}
            onChange={(e) => setNewOrgLicenseCount(parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 1 } }}
            required
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Educational Admin Username"
            type="text"
            fullWidth
            value={newOrgAdminUsername}
            onChange={(e) => setNewOrgAdminUsername(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Educational Admin Password"
            type="password"
            fullWidth
            value={newOrgAdminPassword}
            onChange={(e) => setNewOrgAdminPassword(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewOrgDialog}>Cancel</Button>
          <Button 
            onClick={handleCreateOrganization} 
            variant="contained" 
            color="primary"
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog for adding license keys */}
      <Dialog open={openAddLicenseDialog} onClose={handleCloseAddLicenseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add License Keys</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel id="organization-select-label">Organization</InputLabel>
            <Select
              labelId="organization-select-label"
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              label="Organization"
              required
            >
              {organizations.map((org) => (
                <MenuItem key={org.id} value={org.id}>
                  {org.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            margin="dense"
            label="Number of License Keys to Add"
            type="number"
            fullWidth
            value={addLicenseCount}
            onChange={(e) => setAddLicenseCount(parseInt(e.target.value) || 0)}
            InputProps={{ inputProps: { min: 1 } }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddLicenseDialog}>Cancel</Button>
          <Button 
            onClick={handleAddLicenseKeys} 
            variant="contained" 
            color="primary"
          >
            Add Keys
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog for deleting an organization */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Organization</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the organization "{deleteOrg?.name}"?
          </Typography>
          <Typography color="error" sx={{ mt: 2 }}>
            This will also delete all associated license keys and admin credentials.
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button 
            onClick={handleDeleteOrganization} 
            variant="contained" 
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Dashboard; 