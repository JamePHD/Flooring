import { Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

interface QuoteConfirmationProps {
  fullName: string;
  email: string;
  phone: string;
  squareMeterage: number;
  roomType: string;
  preferredTimeframe: string;
  productCount: number;
}

export function QuoteConfirmation({
  fullName,
  email,
  phone,
  squareMeterage,
  roomType,
  preferredTimeframe,
  productCount,
}: QuoteConfirmationProps) {
  return (
    <EmailLayout
      preview="Your quote request has been received"
      heading={`Thanks, ${fullName.split(" ")[0]}!`}
    >
      <Text style={textStyle}>
        We've received your quote request and one of our team members will be in
        touch within 1–2 business days with your personalised pricing.
      </Text>

      <Section style={summaryBox}>
        <Text style={summaryHeading}>Your request summary</Text>
        <Text style={summaryItem}>
          <strong>Products selected:</strong> {productCount}{" "}
          {productCount === 1 ? "product" : "products"}
        </Text>
        <Text style={summaryItem}>
          <strong>Square meterage:</strong> {squareMeterage} m²
        </Text>
        <Text style={summaryItem}>
          <strong>Room type:</strong> {roomType}
        </Text>
        <Text style={summaryItem}>
          <strong>Preferred timeframe:</strong> {preferredTimeframe}
        </Text>
      </Section>

      <Section style={summaryBox}>
        <Text style={summaryHeading}>Your contact details</Text>
        <Text style={summaryItem}>
          <strong>Name:</strong> {fullName}
        </Text>
        <Text style={summaryItem}>
          <strong>Email:</strong> {email}
        </Text>
        <Text style={summaryItem}>
          <strong>Phone:</strong> {phone}
        </Text>
      </Section>

      <Text style={textStyle}>
        If any of these details aren't right, just reply to this email and we'll
        sort it out.
      </Text>
    </EmailLayout>
  );
}

const textStyle = {
  color: "#333333",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px 0",
};

const summaryBox = {
  backgroundColor: "#f9f9f9",
  borderRadius: "4px",
  padding: "16px",
  margin: "16px 0",
};

const summaryHeading = {
  color: "#1a1a1a",
  fontSize: "14px",
  fontWeight: "bold" as const,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 12px 0",
};

const summaryItem = {
  color: "#333333",
  fontSize: "15px",
  lineHeight: "1.5",
  margin: "0 0 4px 0",
};