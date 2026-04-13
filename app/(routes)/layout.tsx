import Navbar from "@/components/Navbar";

// Shared layout for all (routes) pages — includes Navbar.
// Home page (app/page.tsx) is outside this group and won't show the Navbar.
export default function RoutesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
