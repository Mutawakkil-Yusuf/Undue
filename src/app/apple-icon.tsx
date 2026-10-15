import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#f6f1e7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          width: 104,
          height: 104,
          border: "14px solid #1b1a17",
          borderTopColor: "#f6f1e7",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 40,
          right: 40,
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "#e4572e",
        }}
      />
    </div>,
    { ...size },
  );
}
