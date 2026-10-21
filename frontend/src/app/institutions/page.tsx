import { redirect } from "next/navigation";

// Compatibility only: institutional context always comes from the configured origin.
export default function InstitutionsPage() { redirect("/courses"); }
