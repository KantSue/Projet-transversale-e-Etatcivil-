import { Link } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">e-EtatCivily</h1>
        <p style={{ color: '#f0b429' }} className="text-lg">Madagascar 2035</p>
      </div>
      <Link href="/login"  style={{ color: '#f0b429' }} className="text-lg">Login</Link>
    </div>
  );
}