import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useState, useEffect } from 'react';

// File validation helper
const isPdfUnder2mb = (file) => {
  if (!file) return false;
  if (file.type !== 'application/pdf') return false;
  if (file.size > 2 * 1024 * 1024) return false; // > 2 MB
  return true;
};

// Validation schemas
const infoSchema = Yup.object({
  name: Yup.string().required('Required'),
  mobile: Yup.string()
    .required('Required')
    .matches(/^\d+$/, 'Only digits allowed')
    .min(10, 'Mobile must be exactly 10 digits')
    .max(10, 'Mobile must be exactly 10 digits'),
  email: Yup.string().email('Invalid email').required('Required'),
  account_type: Yup.string().required('Required'),
  account_type_other: Yup.string().when('account_type', {
    is: 'Others',
    then: () => Yup.string().min(2, 'Specify account type').required('Required'),
    otherwise: () => Yup.string().notRequired(),
  }),
  account_number: Yup.string()
    .matches(/^\d{9,18}$/, 'Account number must be 9–18 digits')
    .required('Required'),
  ncrp_ack_number: Yup.string()
    .matches(
      /^329/,
      "The entire acknowledgement number doesn't pertain to the state of Tamil Nadu."
    )
    .notRequired(),
  business_description: Yup.string().when('account_type', {
    is: 'Current',
    then: () => Yup.string().min(2, 'Business description required for Current account').required('Required'),
    otherwise: () => Yup.string().notRequired(),
  }),
  transaction_reason: Yup.string().notRequired(),
  id_proof_type: Yup.string().required('Required'),
});

const fileSchema = Yup.object({
  id_proof_file: Yup.mixed()
    .required('Required')
    .test('fileType', 'Only PDFs under 2 MB allowed', isPdfUnder2mb),
  account_opening_file: Yup.mixed()
    .required('Required')
    .test('fileType', 'Only PDFs under 2 MB allowed', isPdfUnder2mb),
  business_proof_file: Yup.mixed()
    .required('Required')
    .test('fileType', 'Only PDFs under 2 MB allowed', isPdfUnder2mb),
});

const defaultInfoVals = {
  name: '',
  mobile: '',
  email: '',
  address: '',
  account_type: '',
  account_type_other: '',
  account_number: '',
  ncrp_ack_number: '',
  business_description: '',
  transaction_reason: '',
  id_proof_type: '',
};
const defaultFilesVals = {
  id_proof_file: null,
  account_opening_file: null,
  business_proof_file: null,
};

const PublicUserForm = () => {
  const [theme, setTheme] = useState(document.body.className);
  const [submitStatus, setSubmitStatus] = useState({ sent: false, ref: null, error: null });

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(document.body.className));
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const [infoFormValues, setInfoFormValues] = useState(defaultInfoVals);

  const handleDetailsSubmit = (values) => {
    setInfoFormValues({
      ...values,
      account_type: values.account_type === 'Others' ? values.account_type_other : values.account_type,
    });
    setSubmitStatus({ sent: false, ref: null, error: null });
  };

  const handleFinalSubmit = async (files, { setSubmitting, resetForm }) => {
    const formData = new FormData();
    Object.entries(infoFormValues).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });

    formData.append('id_proof', files.id_proof_file);
    formData.append('account_opening_form', files.account_opening_file);
    formData.append('business_proof', files.business_proof_file);

    try {
      const res = await axios.post('/api/requests/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmitStatus({ sent: true, ref: res.data.reference_number, error: null });
      resetForm();
      setInfoFormValues(defaultInfoVals);
    } catch (error) {
      setSubmitStatus({
        sent: false,
        ref: null,
        error: error.response?.data?.message || error.message,
      });
    }
    setSubmitting(false);
  };

  return (
    <section className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Details Form */}
      <div className="card">
        <h2 className="title">Account Unfreeze Request Form</h2>
        <Formik
          initialValues={defaultInfoVals}
          validationSchema={infoSchema}
          onSubmit={handleDetailsSubmit}
          validateOnBlur={true}
          validateOnChange={true}
        >
          {({ values, errors, touched, isValid, dirty, handleSubmit }) => (
            <Form onSubmit={handleSubmit}>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px 16px' }}>
                <div className="input-group">
                  <label htmlFor="name">Name</label>
                  <Field name="name" className="input" />
                  <ErrorMessage name="name" component="div" className="error" />
                </div>
                <div className="input-group">
                  <label htmlFor="mobile">Mobile</label>
                  <Field name="mobile" className="input" />
                  <ErrorMessage name="mobile" component="div" className="error" />
                </div>
                <div className="input-group">
                  <label htmlFor="email">Email</label>
                  <Field name="email" className="input" type="email" />
                  <ErrorMessage name="email" component="div" className="error" />
                </div>
                <div className="input-group">
                  <label htmlFor="address">Address</label>
                  <Field name="address" className="input" as="textarea" />
                  <ErrorMessage name="address" component="div" className="error" />
                </div>
                <div className="input-group">
                  <label htmlFor="account_number">Account Number</label>
                  <Field name="account_number" className="input" />
                  <ErrorMessage name="account_number" component="div" className="error" />
                </div>
                <div className="input-group">
                  <label htmlFor="ncrp_ack_number">NCRP Acknowledgement</label>
                  <Field name="ncrp_ack_number" className="input" />
                  <ErrorMessage name="ncrp_ack_number" component="div" className="error" />
                </div>

                {/* Account type */}
                <div className="input-group" style={{ gridColumn: '1 / span 2' }}>
                  <label>Account Type</label>
                  <div style={{ display: 'flex', gap: 21, alignItems: 'center' }}>
                    <label>
                      <Field type="radio" name="account_type" value="Savings" />
                      Savings
                    </label>
                    <label>
                      <Field type="radio" name="account_type" value="Current" />
                      Current
                    </label>
                    <label>
                      <Field type="radio" name="account_type" value="Others" />
                      Others
                    </label>
                    {values.account_type === 'Others' && (
                      <Field
                        name="account_type_other"
                        className="input"
                        placeholder="Please specify..."
                        style={{ width: 180 }}
                      />
                    )}
                  </div>
                  <ErrorMessage name="account_type" component="div" className="error" />
                  {values.account_type === 'Others' && (
                    <ErrorMessage name="account_type_other" component="div" className="error" />
                  )}
                </div>

                {values.account_type === 'Current' && (
                  <div className="input-group" style={{ gridColumn: '1 / span 2' }}>
                    <label htmlFor="business_description">Business Description</label>
                    <Field as="textarea" name="business_description" className="input" />
                    <ErrorMessage name="business_description" component="div" className="error" />
                  </div>
                )}

                <div className="input-group" style={{ gridColumn: '1 / span 2' }}>
                  <label htmlFor="transaction_reason">Transaction Reason (optional)</label>
                  <Field as="textarea" name="transaction_reason" className="input" />
                </div>

                <div className="input-group" style={{ gridColumn: '1 / span 2' }}>
                  <label htmlFor="id_proof_type">ID Proof Type</label>
                  <Field as="select" name="id_proof_type" className="input">
                    <option value="">Select</option>
                    <option value="Aadhaar">Aadhaar</option>
                    <option value="PAN">PAN</option>
                    <option value="Passport">Passport</option>
                  </Field>
                  <ErrorMessage name="id_proof_type" component="div" className="error" />
                </div>
              </div>

              <button
                type="submit"
                disabled={!(dirty && isValid)}
                style={{ marginTop: 20, cursor: !(dirty && isValid) ? 'not-allowed' : 'pointer' }}
              >
                Save Details (Then upload documents below)
              </button>
            </Form>
          )}
        </Formik>
      </div>

      {/* Document Upload Form */}
      <div
        className="card"
        style={{
          opacity: infoSchema.isValidSync(infoFormValues) ? 1 : 0.5,
          pointerEvents: infoSchema.isValidSync(infoFormValues) ? 'all' : 'none',
          transition: 'opacity 0.3s',
        }}
      >
        <h2 className="title">Upload Required Documents</h2>
        <Formik
          initialValues={defaultFilesVals}
          validationSchema={fileSchema}
          onSubmit={handleFinalSubmit}
          enableReinitialize
        >
          {({ setFieldValue, values, isSubmitting, isValid }) => (
  <Form>
    <div className="grid" style={{ gridTemplateColumns: '1fr', gap: 23 }}>
      {/* ID Proof */}
      <div className="input-group">
        <label htmlFor="id_proof_file">ID Proof (PDF, &lt;2MB)</label>
        <input
          id="id_proof_file"
          name="id_proof_file"
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            setFieldValue('id_proof_file', e.currentTarget.files[0]);
          }}
          className="input"
        />
        {values.id_proof_file && (
          <div style={{ marginTop: 6 }}>
            <small>
              File: <b>{values.id_proof_file.name}</b> (
              {(values.id_proof_file.size / 1024 / 1024).toFixed(2)} MB)
            </small>
            {values.id_proof_file.size > 2 * 1024 * 1024 ? (
              <div className="error">❌ File too large (max 2MB)</div>
            ) : values.id_proof_file.type !== 'application/pdf' ? (
              <div className="error">❌ Only PDF allowed</div>
            ) : (
              <div style={{ color: 'green' }}>✅ File under limit</div>
            )}
          </div>
        )}
        <ErrorMessage name="id_proof_file" component="div" className="error" />
      </div>

      {/* Account Opening Form */}
      <div className="input-group">
        <label htmlFor="account_opening_file">Account Ownership Proof (PDF, &lt;2MB)</label>
        <input
          id="account_opening_file"
          name="account_opening_file"
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            setFieldValue('account_opening_file', e.currentTarget.files[0]);
          }}
          className="input"
        />
        {values.account_opening_file && (
          <div style={{ marginTop: 6 }}>
            <small>
              File: <b>{values.account_opening_file.name}</b> (
              {(values.account_opening_file.size / 1024 / 1024).toFixed(2)} MB)
            </small>
            {values.account_opening_file.size > 2 * 1024 * 1024 ? (
              <div className="error">❌ File too large (max 2MB)</div>
            ) : values.account_opening_file.type !== 'application/pdf' ? (
              <div className="error">❌ Only PDF allowed</div>
            ) : (
              <div style={{ color: 'green' }}>✅ File under limit</div>
            )}
          </div>
        )}
        <ErrorMessage name="account_opening_file" component="div" className="error" />
      </div>

      {/* Business Proof */}
      <div className="input-group">
        <label htmlFor="business_proof_file">Business Establishment Proof (PDF, &lt;2MB)</label>
        <input
          id="business_proof_file"
          name="business_proof_file"
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            setFieldValue('business_proof_file', e.currentTarget.files[0]);
          }}
          className="input"
        />
        {values.business_proof_file && (
          <div style={{ marginTop: 6 }}>
            <small>
              File: <b>{values.business_proof_file.name}</b> (
              {(values.business_proof_file.size / 1024 / 1024).toFixed(2)} MB)
            </small>
            {values.business_proof_file.size > 2 * 1024 * 1024 ? (
              <div className="error">❌ File too large (max 2MB)</div>
            ) : values.business_proof_file.type !== 'application/pdf' ? (
              <div className="error">❌ Only PDF allowed</div>
            ) : (
              <div style={{ color: 'green' }}>✅ File under limit</div>
            )}
          </div>
        )}
        <ErrorMessage name="business_proof_file" component="div" className="error" />
      </div>
    </div>

    <button type="submit" disabled={!isValid || isSubmitting} style={{ marginTop: 25 }}>
      {isSubmitting ? 'Submitting...' : 'Submit Request'}
    </button>
  </Form>
)}

        </Formik>

        {submitStatus.sent && (
          <div style={{ marginTop: 28, color: '#26974e', fontWeight: 500 }}>
            Request submitted! Reference #: {submitStatus.ref}
          </div>
        )}
        {submitStatus.error && <div className="error" style={{ marginTop: 14 }}>{submitStatus.error}</div>}
      </div>
    </section>
  );
};

export default PublicUserForm;
