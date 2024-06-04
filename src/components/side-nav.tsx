import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import CandlesIcon from "/public/assets/icons/candles.svg";
import { RocketIcon } from "@radix-ui/react-icons";
import { Paintbrush2Icon } from "lucide-react";
import SwapIcon from "/public/assets/icons/swap.svg";
import LogoText from "/public/assets/icons/logo.svg";
import Link from "next/link";

const menuLinks = [
  {
    href: "/", 
    path: '/swap', 
    label: "Swap", 
    target: "_self",
    icon: <SwapIcon color="white" width={20} height={20}/>, 
    selectedColor: "#ffffff",
    description: "Best Prices"
  },
  {
    href: "/createMarket", 
    path: '/tools', 
    label: "Create Market", 
    target: "_self",
    icon: <RocketIcon color="white" width={20} height={20}/>, 
    selectedColor: "#ffffff",
    description: "Openbook V2"
  },
  {
    href: "/themes", 
    path: '/themes', 
    label: "Themes", 
    target: "_self",
    icon: <Paintbrush2Icon color="white" width={20} height={20}/>, 
    selectedColor: "#ffffff",
    description: "Customize UI"
  },
  {
    href: "/trade", 
    path: '/trade', 
    label: "Trade", 
    target: "_self",
    icon: <CandlesIcon color="white" width={20} height={20}/>, 
    selectedColor: "#ffffff",
    description: "Set your Price"
  }
];

function SideNav() {
  const router = useRouter();
  const isActivePath = (path: string) => router.pathname.includes(path);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`side-nav ${isMobile ? "mobile" : "desktop"}`}>
      <LogoText height={32} />
      <div className={`menu-links ${isMobile ? "mobile-links" : "desktop-links"}`}>
        {menuLinks.map((item, i) => (
          <Link href={item.href} target={item.target} key={i} className="link">
            <div className={`icon-wrapper ${isActivePath(item.path) ? "active" : ""}`}>
              {React.cloneElement(item.icon, { width: 24, height: 24 })}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default SideNav;
