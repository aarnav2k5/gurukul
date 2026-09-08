import "../styles.css";

export const metadata = {
  title: "gurukul",
  description: "A simple learning resource library for students.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
