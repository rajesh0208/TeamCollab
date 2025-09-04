import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto px-6 py-20 flex flex-col items-center text-center">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">TeamCollab</h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mb-8">
          Collaborate with your team seamlessly. Organize tasks, chat securely, and manage projects with role-based access.
        </p>
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-20 grid sm:grid-cols-3 gap-6">
        <div className="rounded-lg border p-6">
          <h3 className="text-xl font-semibold mb-2">Secure Auth</h3>
          <p className="text-sm text-muted-foreground">JWT-based sessions with bcrypt password hashing.</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="text-xl font-semibold mb-2">Role-based Access</h3>
          <p className="text-sm text-muted-foreground">Granular permissions for users and admins.</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="text-xl font-semibold mb-2">Responsive UI</h3>
          <p className="text-sm text-muted-foreground">Built with Tailwind CSS and shadcn/ui.</p>
        </div>
      </section>
    </main>
  );
}



