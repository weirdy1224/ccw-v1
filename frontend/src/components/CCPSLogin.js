// src/pages/CCPSLogin.js
import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

const CCPSLogin = () => {
  const navigate = useNavigate();
  const siteKey = "6Lfj7LkrAAAAAMo9osOZGuKDdkUtmz6dy1Bzejar"; // ⚡ Replace with your real site key

  return (
    <section className="page-wrapper flex items-center justify-center min-h-screen bg-gray-100">
      <div className="card bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 className="title text-2xl font-bold text-center mb-6">CCPS Login</h2>

        <Formik
          initialValues={{ username: "", password: "", captchaToken: "" }}
          validate={(values) => {
            const errors = {};
            if (!values.username) errors.username = "Username is required";
            if (!values.password) errors.password = "Password is required";
            if (!values.captchaToken)
              errors.captchaToken = "Please complete captcha";
            return errors;
          }}
          onSubmit={async (values, { setSubmitting, setErrors }) => {
            try {
              const res = await axios.post("/api/auth/ccps-login", values);

              if (res.data.role === "CCPS") {
                localStorage.setItem("token", res.data.token);
                localStorage.setItem("role", res.data.role);
                navigate("/CCPS/dashboard");
              } else {
                setErrors({ general: "Access denied: Not a CCPS user" });
              }
            } catch (err) {
              setErrors({
                general: err.response?.data?.message || "Login failed",
              });
            }
            setSubmitting(false);
          }}
        >
          {({ isSubmitting, setFieldValue, errors }) => (
            <Form className="flex flex-col gap-4">
              {/* Username */}
              <div>
                <Field
                  name="username"
                  className="input w-full px-4 py-2 border rounded-lg"
                  placeholder="Username"
                />
                <ErrorMessage
                  name="username"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Password */}
              <div>
                <Field
                  type="password"
                  name="password"
                  className="input w-full px-4 py-2 border rounded-lg"
                  placeholder="Password"
                />
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* reCAPTCHA */}
              <div className="flex justify-center">
                <ReCAPTCHA
                  sitekey={siteKey}
                  onChange={(token) => setFieldValue("captchaToken", token)}
                />
              </div>
              <ErrorMessage
                name="captchaToken"
                component="div"
                className="text-red-500 text-sm text-center mt-1"
              />

              {/* General errors */}
              {errors.general && (
                <div className="text-red-600 text-center">{errors.general}</div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </section>
  );
};

export default CCPSLogin;
