export function Card({ children, ...props }) {
  return <div className="rounded-xl border bg-white shadow" {...props}>{children}</div>;
}

export function CardContent({ children, ...props }) {
  return <div className="p-4" {...props}>{children}</div>;
}
