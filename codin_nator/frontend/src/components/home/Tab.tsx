import { NavLink } from "react-router-dom";

export default function Tab({ to, icon }: TabProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center justify-center ${
          isActive ? "text-primary" : "text-muted-foreground"
        }`
      }
    >
      {icon}
    </NavLink>
  );
}
