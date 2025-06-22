import React, { useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && role === 'admin') {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  return (
    <div className="page-wrapper">
      <div className="card">
        <h2>Admin Login</h2>
        <Formik
          initialValues={{ username: '', password: '' }}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              const res = await axios.post('/api/auth/login', values);
              if (res.data.role === 'admin') {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('role', res.data.role);
                navigate('/admin/dashboard');
              } else {
                alert('Access denied');
              }
            } catch (err) {
              alert(err.response?.data?.message || 'Login failed');
            }
            setSubmitting(false);
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <Field name="username" placeholder="Username" className="input" />
              <Field type="password" name="password" placeholder="Password" className="input" />
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Logging in...' : 'Login'}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AdminLogin;
