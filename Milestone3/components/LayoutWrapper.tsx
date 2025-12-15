"use client";
import Navbar from "./Navbar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}

