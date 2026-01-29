import React from "react";

interface AvatarLetterProps {
  firstname?: string;
  lastname?: string;
  email?: string;
  size?: number;
}

const AvatarLetter: React.FC<AvatarLetterProps> = ({
  firstname = "",
  lastname = "",
  email = "",
  size = 80,
}) => {
  const getInitials = () => {
    const name = `${firstname} ${lastname}`.trim() || email;
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const darkBlueShades = ["#001240", "#002060", "#003080"];

  const getColorFromInitial = (char: string): string => {
    const code = char.toUpperCase().charCodeAt(0);
    const index = code % darkBlueShades.length;
    return darkBlueShades[index];
  };

  const initials = getInitials();
  const firstLetter = initials.charAt(0) || "U";
  const color = getColorFromInitial(firstLetter);

  return (
    <div
      className="flex items-center justify-center rounded-full text-white font-semibold shadow-md select-none"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        fontSize: `${size / 2.2}px`,
      }}
    >
      <span className="-translate-x-[1px]">{initials}</span>
    </div>
  );
};

export default AvatarLetter;
