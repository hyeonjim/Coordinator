import { NavLink } from "react-router-dom";
import { useSidebarStore } from "../../stores/sidebarStore";

export default function Tab({ to, icon }: TabProps) {
  const { activePath } = useSidebarStore();

  const fullPath = `/home${to}`;
  const isActive = activePath === fullPath;

  return (
    <NavLink to={fullPath}>
      <span
        className={`
          flex items-center justify-center
          ${isActive ? "text-primary" : "text-muted-foreground"}
        `}
      >
        {icon}
      </span>
    </NavLink>
  );
}
