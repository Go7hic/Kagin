import { Link } from "@tanstack/react-router";

type Props = {
  to?: string;
  className?: string;
};

function Mark() {
  return (
    <>
      <picture>
        <source srcSet="/logo.avif" type="image/avif" />
        <img src="/logo.png" alt="" className="kg-logo-icon" width={28} height={28} decoding="async" />
      </picture>
      Kagin
    </>
  );
}

export function BrandMark({ to, className }: Props) {
  const classes = className ? `kg-logo-mark ${className}` : "kg-logo-mark";
  if (to) {
    return (
      <Link to={to} className={classes}>
        <Mark />
      </Link>
    );
  }
  return (
    <div className={classes}>
      <Mark />
    </div>
  );
}
