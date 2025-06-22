import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const validationSchema = Yup.object({
  username: Yup.string().required('Required'),
  password: Yup.string().min(6, 'Min 6 characters').required('Required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Required'),
});

const Register = () => {
  const navigate = useNavigate();

  return (
    <section className="page-wrapper">
      <div className="card">
        <h2 className="title">Register</h2>
        <Formik
          initialValues={{ username: '', password: '', confirmPassword: '' }}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              await axios.post('/api/auth/register', values);
              navigate('/login');
            } catch (error) {
              alert('Registration failed: ' + (error.response?.data?.message || error.message));
            }
            setSubmitting(false);
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="input-group">
                <label htmlFor="username">Username</label>
                <Field name="username" className="input" />
                <ErrorMessage name="username" component="div" className="error" />
              </div>
              <div className="input-group">
                <label htmlFor="password">Password</label>
                <Field type="password" name="password" className="input" />
                <ErrorMessage name="password" component="div" className="error" />
              </div>
              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <Field type="password" name="confirmPassword" className="input" />
                <ErrorMessage name="confirmPassword" component="div" className="error" />
              </div>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>
            </Form>
          )}
        </Formik>
        <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          Already have an account? <Link to="/login" className="nav-link">Login</Link>
        </p>
      </div>
    </section>
  );
};

export default Register;
