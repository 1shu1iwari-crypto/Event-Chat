import Link from "next/link";
export function Brand({ href = "/command" }: { href?: string }) {
  return (
    <Link className="brand" href={href} aria-label="EventOps home">
      <span className="brand-symbol" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>eventops</span>
    </Link>
  );
}
