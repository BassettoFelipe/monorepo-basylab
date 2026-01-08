import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Basylab - Desenvolvimento de Software Sob Medida";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #030303 0%, #0a0a0a 50%, #111111 100%)",
          position: "relative",
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Gradient orbs */}
        <div
          style={{
            position: "absolute",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
            top: "-200px",
            right: "-200px",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)",
            bottom: "-150px",
            left: "-150px",
            filter: "blur(60px)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "60px",
            zIndex: 1,
          }}
        >
          {/* Logo/Brand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "40px",
                fontWeight: 700,
                color: "white",
              }}
            >
              B
            </div>
            <span
              style={{
                fontSize: "48px",
                fontWeight: 700,
                color: "white",
                letterSpacing: "-0.02em",
              }}
            >
              Basylab
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "64px",
              fontWeight: 700,
              color: "white",
              lineHeight: 1.1,
              margin: 0,
              marginBottom: "24px",
              maxWidth: "900px",
              letterSpacing: "-0.02em",
            }}
          >
            Chega de software{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              medíocre.
            </span>
          </h1>

          {/* Subheadline */}
          <p
            style={{
              fontSize: "28px",
              color: "rgba(255, 255, 255, 0.7)",
              margin: 0,
              maxWidth: "700px",
              lineHeight: 1.4,
            }}
          >
            Desenvolvimento de software sob medida com rigor técnico e qualidade garantida.
          </p>

          {/* Stats */}
          <div
            style={{
              display: "flex",
              gap: "60px",
              marginTop: "50px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "36px",
                  fontWeight: 700,
                  color: "#6366f1",
                }}
              >
                10k+
              </span>
              <span
                style={{
                  fontSize: "16px",
                  color: "rgba(255, 255, 255, 0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Horas de código
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "36px",
                  fontWeight: 700,
                  color: "#6366f1",
                }}
              >
                30+
              </span>
              <span
                style={{
                  fontSize: "16px",
                  color: "rgba(255, 255, 255, 0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Projetos entregues
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "36px",
                  fontWeight: 700,
                  color: "#6366f1",
                }}
              >
                100%
              </span>
              <span
                style={{
                  fontSize: "16px",
                  color: "rgba(255, 255, 255, 0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Clientes satisfeitos
              </span>
            </div>
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              color: "rgba(255, 255, 255, 0.4)",
            }}
          >
            basylab.com.br
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
