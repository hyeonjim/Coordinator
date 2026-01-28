import { NavLink } from "react-router-dom";

interface TabProps {
  to: string;
  label: string;
}

export default function Tab({ to, label }: TabProps) {
  return <NavLink to={to}>{label}</NavLink>;
}
