import { ImageResponse } from "next/og";

export const alt = "Undue: know the last day to cancel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PREVIEW = [
  { name: "Netflix", meta: "Last day today", tone: "#ff6b5a", pill: "Today" },
  { name: "DStv", meta: "Charges 6 Nov", tone: "#f7bd3f", pill: "5 days" },
  { name: "Spotify", meta: "Charges 18 Nov", tone: "#bde66a", pill: "17 days" },
];

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#f8f0e5",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        padding: "62px 68px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -140,
          right: -120,
          width: 460,
          height: 460,
          borderRadius: 999,
          background: "#bde66a",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -150,
          right: 160,
          width: 300,
          height: 300,
          borderRadius: 999,
          background: "#cbb8f7",
          display: "flex",
        }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#bde66a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "relative",
                width: 38,
                height: 32,
                background: "#fffdf9",
                border: "4px solid #191713",
                borderRadius: 10,
                display: "flex",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 5,
                  height: 4,
                  background: "#191713",
                  display: "flex",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 7,
                  top: -8,
                  width: 4,
                  height: 10,
                  background: "#191713",
                  borderRadius: 999,
                  display: "flex",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: 7,
                  top: -8,
                  width: 4,
                  height: 10,
                  background: "#191713",
                  borderRadius: 999,
                  display: "flex",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 5,
                  top: 16,
                  width: 28,
                  height: 5,
                  background: "#ff6b5a",
                  borderRadius: 999,
                  transform: "rotate(-45deg)",
                  display: "flex",
                }}
              />
            </div>
          </div>
          <div style={{ fontSize: 42, fontWeight: 800, color: "#191713" }}>Undue</div>
          <div
            style={{
              marginLeft: 8,
              borderRadius: 999,
              background: "#fffdf9",
              padding: "8px 16px",
              fontSize: 18,
              fontWeight: 700,
              color: "#756b5f",
              display: "flex",
            }}
          >
            Private by design
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          <div
            style={{
              width: 600,
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            <div
              style={{
                fontSize: 82,
                fontWeight: 800,
                color: "#191713",
                lineHeight: 0.94,
                letterSpacing: -3,
                display: "flex",
                flexWrap: "wrap",
              }}
            >
              Know the last day to cancel.
            </div>
            <div
              style={{
                fontSize: 28,
                color: "#756b5f",
                lineHeight: 1.35,
                display: "flex",
                maxWidth: 520,
              }}
            >
              Track every subscription and see the exact day before you are charged again.
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 4,
              }}
            >
              <div
                style={{
                  borderRadius: 999,
                  background: "#191713",
                  padding: "14px 24px",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#f8f0e5",
                  display: "flex",
                }}
              >
                Open Undue
              </div>
              <div
                style={{
                  borderRadius: 999,
                  border: "2px solid #191713",
                  padding: "12px 22px",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#191713",
                  display: "flex",
                }}
              >
                No account
              </div>
            </div>
          </div>

          <div
            style={{
              width: 390,
              borderRadius: 40,
              background: "#171614",
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              boxShadow: "0 30px 60px -20px rgba(25,23,19,0.45)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "2px 6px",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: "rgba(255,253,249,0.45)",
                  display: "flex",
                }}
              >
                YOUR WEEK
              </div>
              <div
                style={{
                  borderRadius: 999,
                  background: "rgba(255,253,249,0.1)",
                  padding: "5px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "rgba(255,253,249,0.6)",
                  display: "flex",
                }}
              >
                3 deadlines
              </div>
            </div>

            {PREVIEW.map((item) => (
              <div
                key={item.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: item.tone,
                  borderRadius: 22,
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: "rgba(255,253,249,0.55)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#191713",
                  }}
                >
                  {item.name.charAt(0)}
                </div>
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ fontSize: 23, fontWeight: 800, color: "#191713" }}>
                    {item.name}
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "rgba(25,23,19,0.6)" }}
                  >
                    {item.meta}
                  </div>
                </div>
                <div
                  style={{
                    borderRadius: 999,
                    background: "#191713",
                    padding: "6px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#fffdf9",
                    display: "flex",
                  }}
                >
                  {item.pill}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: "#ff6b5a",
              display: "flex",
            }}
          />
          <div style={{ fontSize: 22, color: "#756b5f", display: "flex" }}>
            Nothing leaves your device. No account, no server.
          </div>
        </div>
      </div>
    </div>,
    { ...size },
  );
}
