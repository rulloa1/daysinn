import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCode({
  value,
  size = 200,
  className,
  alt = "QR code",
}: {
  value: string;
  size?: number;
  className?: string;
  alt?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: { dark: "#1a2333ff", light: "#ffffffff" },
    })
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => {
        if (active) setSrc(null);
      });
    return () => {
      active = false;
    };
  }, [value, size]);

  return (
    <div className={className} style={{ width: size, height: size }} aria-label={alt}>
      {src ? (
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="h-full w-full bg-white p-2"
        />
      ) : (
        <div className="h-full w-full animate-pulse bg-ink/10" />
      )}
    </div>
  );
}
