import { Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

interface ConsultationConfirmationProps {
  fullName: string;
  preferredDate: string;
  preferredTime: string;
  projectSummary: string;
}

function formatDate(isoDate: string): string {
  // Input: YYYY-MM-DD → Output: e.g. "Friday, 15 May 2026"
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(time: string): string {
  // Input: HH:MM or HH:MM:SS → Output: e.g. "2:30 PM"
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 || 12;
  return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`;
}

export function ConsultationConfirmation({
  fullName,
  preferredDate,
  preferredTime,
  projectSummary,
}: ConsultationConfirmationProps) {
  return (
    <EmailLayout
      preview="Your consultation request has been received"
      heading={`Thanks, ${fullName.split(" ")[0]}!`}
    >
      <Text style={textStyle}>
        We've received your consultation request. Our team will reach out shortly
        to confirm your appointment.
      </Text>

      <Section style={summaryBox}>
        <Text style={summaryHeading}>Your requested appointment</Text>
        <Text style={summaryItem}>
          <strong>Date:</strong> {formatDate(preferredDate)}
        </Text>
        <Text style={summaryItem}>
          <strong>Time:</strong> {formatTime(preferredTime)}
        </Text>
        <Text style={summaryNote}>
          We'll confirm or suggest a nearby time that suits you.
        </Text>
      </Section>

      <Section style={summaryBox}>
        <Text style={summaryHeading}>Your project</Text>
        <Text style={summaryItem}>{projectSummary}</Text>
      </Section>

      <Text style={textStyle}>
        Need to change anything? Just reply to this email.
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

const summaryNote = {
  color: "#666666",
  fontSize: "13px",
  fontStyle: "italic" as const,
  margin: "8px 0 0 0",
};