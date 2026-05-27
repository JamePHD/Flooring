"use client";

import Link from "next/link";
import Logo from "../components/logo";
import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/send-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          type: "contact",
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: "", email: "", phone: "", message: "" });
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div style={{ background: "#ffffff", width: "100%" }}>
      

      <div style={{ width: "100%", marginBottom: "60px", background: "#ffffff", color: "#333" }}>
        <section style={{ width: "100%", background: "linear-gradient(to right, #0d5a57, #118b85, #15c4c4)", color: "white", padding: "40px 16px", textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "36px", fontWeight: "bold", margin: "0 0 8px 0" }}>Contact Us</h1>
          <p style={{ fontSize: "16px", opacity: 0.9, margin: 0 }}>Get in touch with our team for any inquiries or support.</p>
        </section>

        <div style={{ maxWidth: "1200px", marginLeft: "auto", marginRight: "auto", paddingLeft: "16px", paddingRight: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "60px" }}>
            {/* Contact Form */}
            <section>
              <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px", color: "#0d5a57" }}>Send us a Message</h2>

              {submitted && (
                <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: "8px", padding: "12px", marginBottom: "20px", color: "#047857" }}>
                  ✓ Thank you! We'll get back to you soon.
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, color: "#333" }}>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
                      fontFamily: "Arial, sans-serif",
                      boxSizing: "border-box",
                    }}
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, color: "#333" }}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
                      fontFamily: "Arial, sans-serif",
                      boxSizing: "border-box",
                    }}
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, color: "#333" }}>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
                      fontFamily: "Arial, sans-serif",
                      boxSizing: "border-box",
                    }}
                    placeholder="Your phone number"
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, color: "#333" }}>Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
                      fontFamily: "Arial, sans-serif",
                      boxSizing: "border-box",
                      resize: "vertical",
                    }}
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    background: "linear-gradient(to right, #0d5a57, #118b85, #15c4c4)",
                    color: "white",
                    padding: "12px 24px",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "16px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "opacity 0.3s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Send Message
                </button>
              </form>
            </section>

            {/* Contact Information */}
            <section>
              <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px", color: "#0d5a57" }}>Contact Information</h2>

              <div style={{ marginBottom: "30px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px", color: "#0d5a57" }}>📞 Phone</h3>
                <p style={{ margin: 0, color: "#555", lineHeight: "1.6" }}>
                  <a href="tel:1300119313" style={{ color: "#15c4c4", textDecoration: "none" }}>
                    1300 119 313
                  </a>
                </p>
              </div>

              <div style={{ marginBottom: "30px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px", color: "#0d5a57" }}>📧 Email</h3>
                <p style={{ margin: 0, color: "#555", lineHeight: "1.6" }}>
                  <a href="mailto:info@flooringsolutions.com" style={{ color: "#15c4c4", textDecoration: "none" }}>
                    info@flooringsolutions.com
                  </a>
                </p>
              </div>

              <div style={{ marginBottom: "30px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px", color: "#0d5a57" }}>📍 Address</h3>
                <p style={{ margin: 0, color: "#555", lineHeight: "1.6" }}>
                  123 Flooring Lane<br />
                  Sydney, NSW 2000<br />
                  Australia
                </p>
              </div>

              <div style={{ marginBottom: "30px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px", color: "#0d5a57" }}>🕐 Hours</h3>
                <p style={{ margin: 0, color: "#555", lineHeight: "1.6" }}>
                  Monday - Friday: 9:00 AM - 5:00 PM<br />
                  Saturday: 10:00 AM - 3:00 PM<br />
                  Sunday: Closed
                </p>
              </div>

              <div style={{ background: "#f0f9f9", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #15c4c4" }}>
                <p style={{ margin: 0, color: "#555", fontSize: "14px", lineHeight: "1.6" }}>
                  For general inquiries, product information, or to request a quote, please fill out the form on the left and we'll get back to you within 24 hours.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
