"use client";

/**
 * Skip link for keyboard and screen reader users. Visible on focus only.
 */
export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-link"
    >
      Skip to main content
    </a>
  );
}
