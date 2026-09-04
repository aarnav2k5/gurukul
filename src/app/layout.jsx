import "../styles.css";

export const metadata = {
  title: "Tuition LMS",
  description: "A simple private tuition resource library for students.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
