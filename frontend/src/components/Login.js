import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';

const validationSchema = Yup.object({
  username: Yup.string().required('Required'),
  password: Yup.string().required('Required'),
});

const Login = () => {
  const navigate = useNavigate();
  const [captchaValue, setCaptchaValue] = useState(null);

  return (
    <section className="page-wrapper">
      <div className="card">
        <h2 className="title">Controller Login</h2>
        <Formik
          initialValues={{ username: '', password: '' }}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting }) => {
            if (!captchaValue) {
              alert('Please verify the CAPTCHA');
              setSubmitting(false);
              return;
            }

            try {
              const res = await axios.post('/api/auth/login', {
                ...values,
                captcha: captchaValue, // send captcha token to backend for verification
              });

              localStorage.setItem('token', res.data.token);
              localStorage.setItem('role', res.data.role);

              if (res.data.role === 'admin') navigate('/admin/dashboard');
              else if (res.data.role === 'controller') navigate('/controller/dashboard');
              else if (res.data.role === 'CCPS') navigate('/CCPS/dashboard');
              else if (res.data.role === 'sp') navigate('/sp/dashboard');
              else navigate('/');
            } catch (error) {
              alert('Login failed: ' + (error.response?.data?.message || error.message));
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

              {/* Google reCAPTCHA */}
              <div className="captcha-container">
                <ReCAPTCHA
                  sitekey="6Lfj7LkrAAAAAMo9osOZGuKDdkUtmz6dy1Bzejar"   // Replace with your site key from Google
                  onChange={(value) => setCaptchaValue(value)}
                />
              </div>

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

export default Login;