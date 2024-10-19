// Modify the handleSubmit function
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setError('');

  try {
    if (isCreatingAdmin) {
      const response = await fetch('/api/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsCreatingAdmin(false);
        setError(t('adminCreatedSuccessfully'));
      } else {
        setError(data.error || t('failedToCreateAdmin'));
      }
    } else {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data);
        navigate(data.user.isAdmin ? '/admin' : '/status');
      } else {
        setError(data.error || t('invalidCredentials'));
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    setError(t('loginError'));
  }
};
