import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { ReactNode } from "react";
import { BUSINESS_INFO } from "../../lib/email/client";

interface EmailLayoutProps {
  preview: string;
  heading: string;
  children: ReactNode;
}

export function EmailLayout({ preview, heading, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Heading style={headingStyle}>{BUSINESS_INFO.name}</Heading>
          </Section>

          <Section style={contentStyle}>
            <Heading as="h2" style={h2Style}>
              {heading}
            </Heading>
            {children}
          </Section>

          <Hr style={hrStyle} />

          <Section style={footerStyle}>
            <Text style={footerText}>
              Need help? Get in touch:
            </Text>
            <Text style={footerText}>
              Email: {BUSINESS_INFO.email}
              <br />
              Phone: {BUSINESS_INFO.phone}
              <br />
              Web: {BUSINESS_INFO.website}
            </Text>
            <Text style={footerSmall}>
              © {new Date().getFullYear()} {BUSINESS_INFO.name}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles — keeping inline for email client compatibility
const bodyStyle = {
  backgroundColor: "#f5f5f5",
  fontFamily: "Helvetica, Arial, sans-serif",
  margin: 0,
  padding: 0,
};

const containerStyle = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0",
  maxWidth: "600px",
};

const headerStyle = {
  backgroundColor: "#1a1a1a",
  padding: "24px",
  textAlign: "center" as const,
};

const headingStyle = {
  color: "#ffffff",
  fontSize: "24px",
  margin: 0,
  fontWeight: "bold" as const,
};

const contentStyle = {
  padding: "32px 24px",
};

const h2Style = {
  color: "#1a1a1a",
  fontSize: "20px",
  marginTop: 0,
  marginBottom: "16px",
};

const hrStyle = {
  borderColor: "#e5e5e5",
  margin: "0 24px",
};

const footerStyle = {
  padding: "24px",
};

const footerText = {
  color: "#666666",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 8px 0",
};

const footerSmall = {
  color: "#999999",
  fontSize: "12px",
  marginTop: "16px",
};