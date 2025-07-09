"use client";

import { forwardRef } from "react";

export const ScrollLink = forwardRef(({ href, children, ...props }, ref) => {
  const handleScroll = (e) => {
    e.preventDefault();
    
    // Remove the # from the href
    const targetId = href.replace("#", "");
    const element = document.getElementById(targetId);
    
    if (element) {
      window.scrollTo({
        top: element.offsetTop, // Adjust offset for navbar height
        behavior: "smooth"
      });
      
      // Update URL without reloading page
      window.history.pushState({}, "", href);
    }
  };
  
  return (
    <a href={href} onClick={handleScroll} ref={ref} {...props}>
      {children}
    </a>
  );
});

ScrollLink.displayName = "ScrollLink";