import React from "react";

interface ButtonProps {
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  [key: string]: any;
}

const UIButton: React.FC<ButtonProps> = ({
  type = "button",
  onClick,
  isLoading = false,
  isDisabled = false,
  children,
  className = "",
  size = "md",
  ...props
}) => {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const hasBg = className.includes("bg-") || className.includes("button-bg") || className.includes("panel-bg");
  const hasTextColor = className.includes("text-") || className.includes("text-color") || className.includes("main-page-text-color");

  return (
    <button
      type={type}
      onClick={onClick}
      {...props}
      disabled={isLoading || isDisabled}
      className={`mr-1 rounded-md shadow text-sm font-medium inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-ring-light dark:focus:ring-ring-dark
        ${!hasBg ? "button-bg dark:button-bg" : ""}
        ${!hasTextColor ? "text-white" : ""}
        ${isDisabled || isLoading ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-50" : ""}
        ${sizeClasses[size]} ${className}`}
      style={{ padding: size === "sm" ? "0.25rem 0.5rem" : "0.5rem 1rem", ...props.style }}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
};

export default UIButton;
