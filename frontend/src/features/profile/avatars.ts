import avatar1 from "../../assets/avatars/avatar_1.jpg";
import avatar2 from "../../assets/avatars/avatar_2.jpg";
import avatar3 from "../../assets/avatars/avatar_3.jpg";
import avatar4 from "../../assets/avatars/avatar_4.jpg";
import avatar5 from "../../assets/avatars/avatar_5.jpg";
import avatar6 from "../../assets/avatars/avatar_6.jpg";
import avatar7 from "../../assets/avatars/avatar_7.jpg";
import avatar8 from "../../assets/avatars/avatar_8.jpg";
import avatar9 from "../../assets/avatars/avatar_9.jpg";
import avatar10 from "../../assets/avatars/avatar_10.jpg";
import avatar11 from "../../assets/avatars/avatar_11.jpg";
import avatar12 from "../../assets/avatars/avatar_12.jpg";
import avatar13 from "../../assets/avatars/avatar_13.jpg";

export interface StaticAvatarOption {
  id: string;
  label: string;
  src: string;
}

export const STATIC_AVATAR_OPTIONS: StaticAvatarOption[] = [
    { id: "avatar_1", label: "Avatar 1", src: avatar1 },
    { id: "avatar_2", label: "Avatar 2", src: avatar2 },
    { id: "avatar_3", label: "Avatar 3", src: avatar3 },
    { id: "avatar_4", label: "Avatar 4", src: avatar4 },
    { id: "avatar_5", label: "Avatar 5", src: avatar5 },
    { id: "avatar_6", label: "Avatar 6", src: avatar6 },
    { id: "avatar_7", label: "Avatar 7", src: avatar7 },
    { id: "avatar_8", label: "Avatar 8", src: avatar8 },
    { id: "avatar_9", label: "Avatar 9", src: avatar9 },
    { id: "avatar_10", label: "Avatar 10", src: avatar10 },
    { id: "avatar_11", label: "Avatar 11", src: avatar11 },
    { id: "avatar_12", label: "Avatar 12", src: avatar12 },
    { id: "avatar_13", label: "Avatar 13", src: avatar13 },
];

export function resolveAvatarUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = STATIC_AVATAR_OPTIONS.find((option) => option.id === value);
  if (match) return match.src;
  if (/^https?:\/\//i.test(value) || value.startsWith("/") || value.startsWith("data:")) {
    return value;
  }
  return null;
}

export function isStaticAvatarId(value: string | null | undefined): boolean {
  if (!value) return false;
  return STATIC_AVATAR_OPTIONS.some((option) => option.id === value);
}
