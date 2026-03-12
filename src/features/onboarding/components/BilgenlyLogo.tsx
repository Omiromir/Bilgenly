import { Link } from "react-router";
import logoPng from "../../../assets/logo.png";

interface BilgenlyLogoProps {
  size?: number;
}

export function BilgenlyLogo({ size = 40 }: BilgenlyLogoProps) {
  return (
    <Link to="/" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <img
        src={logoPng}
        alt="Bilgenly Logo"
        style={{ width: size, height: size, display: "block" }}
      />
      <span className="auth-brand-name">Bilgenly</span>
    </Link>
  );
}
