import { Formik, Form, Field } from 'formik';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha'; // ✅ import captcha

const CCPSLogin = () => {
  const navigate = useNavigate();
  const siteKey = "6Lfj7LkrAAAAAMo9osOZGuKDdkUtmz6dy1Bzejar"; // ⚡ replace with your site key from Google

  return (
    <section className="page-wrapper">
      <div className="card">
        <h2 className="title">CCPS Login</h2>
        <Formik
          initialValues={{ username: '', password: '', captchaToken: '' }}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              if (!values.captchaToken) {
                alert("Please complete captcha");
                setSubmitting(false);
                return;
              }

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
          {({ isSubmitting, setFieldValue }) => (
            <Form>
              <Field name="username" className="input" placeholder="Username" />
              <Field type="password" name="password" className="input" placeholder="Password" />

              {/* ✅ reCAPTCHA widget */}
              <ReCAPTCHA
                sitekey={siteKey}
                onChange={(token) => setFieldValue("captchaToken", token)}
              />

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