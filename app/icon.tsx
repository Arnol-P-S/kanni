import { ImageResponse } from "next/og";

export const size = {
  width: 96,
  height: 96,
};

export const contentType = "image/png";

export default function Icon() {
  const nodeStyle = {
    position: "absolute" as const,
    width: 22,
    height: 22,
    border: "6px solid #0f766e",
    borderRadius: "999px",
    background: "#f7faf7",
  };

  return new ImageResponse(
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        borderRadius: 22,
        background: "#f7faf7",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 44,
          left: 23,
          width: 51,
          height: 6,
          borderRadius: 8,
          background: "#0f766e",
          transform: "rotate(23deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 45,
          left: 22,
          width: 53,
          height: 6,
          borderRadius: 8,
          background: "#0f766e",
          transform: "rotate(-27deg)",
        }}
      />
      <div style={{ ...nodeStyle, top: 17, left: 14 }} />
      <div style={{ ...nodeStyle, top: 57, left: 16 }} />
      <div style={{ ...nodeStyle, top: 37, left: 62 }} />
    </div>,
    size,
  );
}
