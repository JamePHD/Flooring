import { Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

interface AdminQuoteNotificationProps {
  quoteId: string;
  fullName: string;
  email: string;
  phone: string;
  squareMeterage: number;
  roomType: string;
  projectDescription: string;
  preferredContactMethod: string;
  preferredTimeframe: string;
  productCount: number;
  userPath: string | null;
  numProperties: number | null;
  totalSqm: number | null;
}

export function AdminQuoteNotification(props: AdminQuoteNotificationProps) {
  const {
    quoteId,
    fullName,
    email,
    phone,
    squareMeterage,
    roomType,
    projectDescription,
    preferredContactMethod,
    preferredTimeframe,
    productCount,
    userPath,
    numProperties,
    totalSqm,
  } = props;

  return (
    <EmailLayout
      preview={`New quote request from ${fullName}`}
      heading="New Quote Request"
    >
      <Text style={textStyle}>
        A new quote request has been submitted via the website.
      </Text>

      <Section style={summaryBox}>
        <Text style={summaryHeading}>Customer details</Text>
        <Text style={summaryItem}>
          <strong>Name:</strong> {fullName}
        </Text>
        <Text style={summaryItem}>
          <strong>Email:</strong> {email}
        </Text>
        <Text style={summaryItem}>
          <strong>Phone:</strong> {phone}
        </Text>
        <Text style={summaryItem}>
          <strong>Preferred contact:</strong> {preferredContactMethod}
        </Text>
        {userPath && (
          <Text style={summaryItem}>
            <strong>User type:</strong> {userPath.replace(/_/g, " ")}
          </Text>
        )}
      </Section>

      <Section style={summaryBox}>
        <Text style={summaryHeading}>Project details</Text>
        <Text style={summaryItem}>
          <strong>Products:</strong> {productCount} selected
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
        {numProperties !== null && (
          <Text style={summaryItem}>
            <strong>Number of properties:</strong> {numProperties}
          </Text>
        )}
        {totalSqm !== null && (
          <Text style={summaryItem}>
            <strong>Total sqm:</strong> {totalSqm} m²
          </Text>
        )}
        <Text style={summaryItem}>
          <strong>Description:</strong>
        </Text>
        <Text style={descriptionStyle}>{projectDescription}</Text>
      </Section>

      <Text style={metaStyle}>Quote reference: {quoteId}</Text>
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

const descriptionStyle = {
  color: "#333333",
  fontSize: "15px",
  lineHeight: "1.5",
  margin: "8px 0 0 0",
  padding: "12px",
  backgroundColor: "#ffffff",
  borderLeft: "3px solid #1a1a1a",
};

const metaStyle = {
  color: "#999999",
  fontSize: "12px",
  fontFamily: "monospace",
  margin: "16px 0 0 0",
};