// Modify the handleSubmit function
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setError('');
  setIsSubmitting(true);

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch('/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ orderNumber, subject, message }),
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Authentication failed. Please log in again.');
      }
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create ticket');
    }

    const data = await response.json();
    navigate(`/tickets/${data.id}`);
  } catch (error) {
    console.error('Error creating ticket:', error);
    setError(error.message || t('errorCreatingTicket'));
    if (error.message === 'Authentication failed. Please log in again.') {
      // Optionally, you can log out the user and redirect to login page
      // logout();
      // navigate('/login');
    }
  } finally {
    setIsSubmitting(false);
  }
};
