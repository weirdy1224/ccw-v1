import { Formik, Form, Field } from 'formik';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CCPSLogin = () => {
  const navigate = useNavigate();

  return (
    <section className="page-wrapper">
      <div className="card">
        <h2 className="title">CCPS Login</h2>
        <Formik
          initialValues={{ username: '', password: '' }}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              const res = await axios.post('/api/auth/login', values);

              if (res.data.role === 'CCPS') {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('role', res.data.role);
                navigate('/CCPS/dashboard');
              } else {
                alert('Access denied: You are not authorized as a CCPS user');
              }
            } catch (err) {
              alert(err.response?.data?.message || 'Login failed');
            }
            setSubmitting(false);
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <Field name="username" className="input" placeholder="Username" />
              <Field type="password" name="password" className="input" placeholder="Password" />
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Logging in...' : 'Login'}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </section>
  );
};

export default CCPSLogin;
