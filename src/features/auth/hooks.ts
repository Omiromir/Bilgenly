import { useState } from "react";

export function usePasswordVisibility(defaultVisible = false) {
  const [isVisible, setIsVisible] = useState(defaultVisible);

  return {
    inputType: isVisible ? "text" : "password",
    isVisible,
    toggleVisibility: () => setIsVisible((current) => !current),
  };
}
