import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#bde66a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 122,
          height: 118,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 34,
            width: 10,
            height: 34,
            background: "#191713",
            borderRadius: 8,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 34,
            width: 10,
            height: 34,
            background: "#191713",
            borderRadius: 8,
          }}
        />
        <div
          style={{
            position: "relative",
            width: 122,
            height: 94,
            background: "#f7bd3f",
            border: "10px solid #191713",
            borderRadius: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
          }}
        >
          <div
            style={{
              width: 13,
              height: 18,
              background: "#191713",
              borderRadius: 999,
              display: "flex",
            }}
          />
          <div
            style={{
              width: 13,
              height: 18,
              background: "#191713",
              borderRadius: 999,
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 14,
              left: 30,
              width: 16,
              height: 16,
              background: "#ff9d8d",
              borderRadius: 999,
              display: "flex",
              opacity: 0.75,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 14,
              right: 30,
              width: 16,
              height: 16,
              background: "#ff9d8d",
              borderRadius: 999,
              display: "flex",
              opacity: 0.75,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 18,
              left: 49,
              width: 24,
              height: 8,
              background: "#191713",
              borderRadius: 999,
              display: "flex",
            }}
          />
        </div>
      </div>
    </div>,
    { ...size },
  );
}
