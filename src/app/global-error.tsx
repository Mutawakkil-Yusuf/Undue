"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#f8f0e5",
          color: "#191713",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
          textAlign: "center",
        }}
      >
        <main style={{ maxWidth: 420 }}>
          <div
            style={{
              width: 96,
              height: 96,
              margin: "0 auto 24px",
              borderRadius: 999,
              background: "#ff6b5a",
              display: "grid",
              placeItems: "center",
              fontSize: 42,
            }}
            aria-hidden="true"
          >
            !
          </div>
          <h1 style={{ fontSize: 36, lineHeight: 0.95, margin: 0 }}>Something broke.</h1>
          <p style={{ color: "#756b5f", lineHeight: 1.6 }}>
            Your local data has not been touched. Reload the page to try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: 48,
              border: 0,
              borderRadius: 999,
              background: "#191713",
              color: "#fffdf9",
              padding: "0 24px",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest ? (
            <p style={{ color: "#756b5f", fontSize: 12 }}>Reference: {error.digest}</p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
