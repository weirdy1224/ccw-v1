import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useState, useEffect } from 'react';

const validationSchema = Yup.object({
  name: Yup.string().required('Required'),
  mobile: Yup.string().matches(/^\d{10}$/, 'Mobile must be exactly 10 digits').required('Required'),
  email: Yup.string().email('Invalid email').required('Required'),
  account_type: Yup.string().required('Required'),
  account_ownership: Yup.string().required('Required'),
  account_number: Yup.string().matches(/^\d{9,18}$/, 'Account number must be 9–18 digits').required('Required'),
  ncrp_ack_number: Yup.string().matches(/^329/,'Must start with 329 if inside Tamil Nadu, else contact other state police'),
  // account_opening_year: Yup.string().matches(/^\d{4}$/, 'Year must be a 4-digit number').test('valid-year', 'Enter a valid year', val => {
  //     const year = Number(val);return year > 1900 && year <= new Date().getFullYear();
  //   }).required('Required'),
  id_proof_type: Yup.string().required('Required'),
});

const PublicUserForm = () => {
  const [theme, setTheme] = useState(document.body.className);

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setTheme(document.body.className)
    );
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <section className="page-wrapper">
      <div className="card">
        <h2 className="title">Raise Unfreeze Request</h2>
        <Formik
          initialValues={{
            name: '', mobile: '', email: '', address: '', account_type: '', account_ownership: '',
            account_number: '', ncrp_ack_number: '', business_description: '',
            transaction_reason: '', id_proof_type: '', documents: null
          }}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            const formData = new FormData();
            Object.entries(values).forEach(([key, value]) => {
              if (key === 'documents' && value) {
                Array.from(value).forEach(file => formData.append('documents', file));
              } else {
                formData.append(key, value);
              }
            });

            try {
              const res = await axios.post('/api/requests/submit', formData, {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              });
              alert(`Request submitted! Ref #: ${res.data.reference_number}`);
              resetForm();
            } catch (error) {
              alert('Submission error: ' + (error.response?.data?.message || error.message));
            }
            setSubmitting(false);
          }}
        >
          {({ setFieldValue, isSubmitting }) => (
            <Form>
              <div className="grid">
                {[
                  ['name', 'Name'],
                  ['mobile', 'Mobile'],
                  ['email', 'Email'],
                  ['address', 'Address'],
                  ['account_number', 'Account Number'],
                  ['ncrp_ack_number', 'NCRP Acknowledgement'],
                  // ['account_opening_year', 'Opening Year']
                ].map(([field, label]) => (
                  <div className="input-group" key={field}>
                    <label>{label}</label>
                    <Field name={field} className="input" />
                    <ErrorMessage name={field} component="div" className="error" />
                  </div>
                ))}

                <div className="input-group">
                  <label>Account Type</label>
                  <Field as="select" name="account_type" className="input">
                    <option value="">Select</option>
                    <option value="Savings">Savings</option>
                    <option value="Current">Current</option>
                    <option value="Merchant">Merchant</option>
                    <option value="Escrow">Escrow</option>
                  </Field>
                  <ErrorMessage name="account_type" component="div" className="error" />
                </div>

                <div className="input-group">
                  <label>Ownership</label>
                  <Field as="select" name="account_ownership" className="input">
                    <option value="">Select</option>
                    <option value="Personal">Personal</option>
                    <option value="Business">Business</option>
                    <option value="Company">Company</option>
                    <option value="Nodal">Nodal</option>
                  </Field>
                  <ErrorMessage name="account_ownership" component="div" className="error" />
                </div>

                <div className="input-group">
                  <label>Business Description</label>
                  <Field as="textarea" name="business_description" className="input" />
                </div>

                <div className="input-group">
                  <label>Transaction Reason</label>
                  <Field as="textarea" name="transaction_reason" className="input" />
                </div>

                <div className="input-group">
                  <label>ID Proof Type</label>
                  <Field as="select" name="id_proof_type" className="input">
                    <option value="">Select</option>
                    <option value="Aadhaar">Aadhaar</option>
                    <option value="PAN">PAN</option>
                    <option value="Passport">Passport</option>
                  </Field>
                  <ErrorMessage name="id_proof_type" component="div" className="error" />
                </div>

                <div className="input-group">
                  <label>Upload Documents</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFieldValue('documents', e.target.files)}
                    className="input"
                  />
                </div>
              </div>

              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </section>
  );
};

export default PublicUserForm;
