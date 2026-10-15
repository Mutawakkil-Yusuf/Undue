import { ImageResponse } from "next/og";

export const alt = "Undue — know the last day to cancel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#f6f1e7",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div
          style={{
            width: 72,
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              border: "8px solid #1b1a17",
              borderTopColor: "#f6f1e7",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#e4572e",
            }}
          />
        </div>
        <div style={{ fontSize: 44, fontWeight: 700, color: "#1b1a17" }}>Undue</div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div
          style={{ fontSize: 76, fontWeight: 700, color: "#1b1a17", lineHeight: 1.05 }}
        >
          Know the last day to cancel.
        </div>
        <div style={{ fontSize: 34, color: "#6b6660" }}>
          Track every subscription and see the exact day before you are charged again.
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{ width: 24, height: 24, borderRadius: "50%", background: "#e4572e" }}
        />
        <div style={{ fontSize: 28, color: "#6b6660" }}>
          Private by design — nothing leaves your device.
        </div>
      </div>
    </div>,
    { ...size },
  );
}
