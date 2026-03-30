import { Link } from "react-router";
import logoPng from "../../assets/logo.png";

interface BilgenlyLogoProps {
  size?: number;
  showText?: boolean;
}

export function BilgenlyLogo({
  size = 40,
  showText = true,
}: BilgenlyLogoProps) {
  return (
    <Link
      to="/"
      className="group inline-flex items-center gap-2 transition-all duration-300 hover:[filter:drop-shadow(0_0_10px_rgba(33,145,246,0.35))]"
    >
      <img
        src={logoPng}
        alt="Bilgenly Logo"
        style={{ width: size, height: size, display: "block" }}
      />
      {showText ? (
        <span className="auth-brand-name text-xl font-semibold">Bilgenly</span>
      ) : null}
    </Link>
  );
}
