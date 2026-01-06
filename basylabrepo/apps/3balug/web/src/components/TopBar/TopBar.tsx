import { ChevronDown } from "lucide-react";
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { getActiveGroup, getActiveRoute, navGroups } from "./navigation-config";
import * as styles from "./TopBar.css";

export function TopBar() {
  const location = useLocation();

  const activeRoute = useMemo(() => getActiveRoute(location.pathname), [location.pathname]);
  const activeGroup = useMemo(() => getActiveGroup(location.pathname), [location.pathname]);

  return (
    <div className={styles.topBar}>
      <nav className={styles.navContainer}>
        {navGroups.map((group, index) => {
          const GroupIcon = group.icon;
          const isActive = group.label === activeGroup;
          const hasMultipleItems = group.items.length > 1;
          // Últimos 3 itens posicionam dropdown à direita para não vazar da tela
          const isLastItems = index >= navGroups.length - 3;

          if (!hasMultipleItems) {
            const item = group.items[0];
            const ItemIcon = item.icon;
            const itemActive = item.path === activeRoute;

            return (
              <Link
                key={group.label}
                to={item.path}
                className={`${styles.navGroupWrapper} ${styles.navGroup} ${itemActive ? styles.navGroupActive : ""}`}
              >
                <ItemIcon size={18} />
                <span className={styles.navGroupLabel}>{group.label}</span>
              </Link>
            );
          }

          return (
            <div key={group.label} className={styles.navGroupWrapper}>
              <button
                type="button"
                className={`${styles.navGroup} ${isActive ? styles.navGroupActive : ""}`}
                aria-haspopup="true"
              >
                <GroupIcon size={18} />
                <span className={styles.navGroupLabel}>{group.label}</span>
                <ChevronDown size={14} className={styles.chevron} />
              </button>

              <div
                className={`${styles.dropdown} ${isLastItems ? styles.dropdownRight : ""}`}
                role="menu"
              >
                {group.items.map((item) => {
                  const ItemIcon = item.icon;
                  const itemActive = item.path === activeRoute;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`${styles.dropdownItem} ${itemActive ? styles.dropdownItemActive : ""}`}
                      role="menuitem"
                    >
                      <ItemIcon size={18} />
                      <span className={styles.dropdownItemLabel}>{item.label}</span>
                      {item.badge && <span className={styles.badge}>{item.badge}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
