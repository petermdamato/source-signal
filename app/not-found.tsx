import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-4xl font-bold text-primary">Page not found</h1>
      <p className="mt-4 text-muted-foreground">
        The page you’re looking for doesn’t exist or was moved.
      </p>
      <Link href="/" className="mt-8 inline-block">
        <Button variant="primary">Back to home</Button>
      </Link>
    </div>
  );
}
