// Modify the useEffect hook
useEffect(() => {
  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/tickets', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error('Failed to fetch tickets');
      }

      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError(error.message || t('errorFetchingTickets'));
      if (error.message === 'Authentication failed. Please log in again.') {
        // Optionally, you can log out the user and redirect to login page
        // logout();
        // navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    fetchTickets();
  }
}, [user, t]);
