// Admin section has its own layout — no public Navbar/Footer
export const metadata = {
  title: 'CRM Admin — Auto Directo',
  robots: { index: false, follow: false }, // Never index admin pages
};

export default function AdminLayout({ children }) {
  return <>{children}</>;
}
