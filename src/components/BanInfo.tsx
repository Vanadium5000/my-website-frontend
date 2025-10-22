import { FaBan, FaClock, FaComment } from "react-icons/fa";

interface BanInfoProps {
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: (Date | string | number) | null;
  className?: string;
}

export function BanInfo({
  banned,
  banReason,
  banExpires,
  className = "",
}: BanInfoProps) {
  // If not banned, don't show anything
  if (!banned) {
    return null;
  }

  // Check if ban has expired
  const now = new Date();
  const expiresDate = banExpires ? new Date(banExpires) : null;
  const isExpired = expiresDate && expiresDate <= now;

  // If ban has expired, don't show anything
  if (isExpired) {
    return null;
  }

  const formatDate = (date: Date | string | number) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`alert alert-error ${className}`}>
      <FaBan />
      <div className="flex flex-col gap-1">
        <div className="font-semibold">User is Banned</div>
        {banReason && (
          <div className="flex items-start gap-2 text-sm">
            <FaComment className="mt-0.5 flex-shrink-0" />
            <span>{banReason}</span>
          </div>
        )}
        {expiresDate && (
          <div className="flex items-center gap-2 text-sm">
            <FaClock />
            <span>Expires: {formatDate(expiresDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
