"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ color: "#666", marginTop: "0.5rem" }}>
          {error?.message || "An unexpected error occurred."}
        </p>
        {error?.digest && (
          <p style={{ color: "#999", fontSize: "0.75rem", marginTop: "0.5rem" }}>
            Digest: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1.5rem",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: "9999px",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
