import { FaGamepad, FaCalculator, FaChessKnight } from "react-icons/fa";

interface ProjectCardProps {
  title: string;
  description: string;
  technicalSpecs: string;
  backgroundImage: string;
  href: string;
  icon: React.ReactElement;
}

export function ProjectCard({
  title,
  description,
  technicalSpecs,
  backgroundImage,
  href,
  icon,
}: ProjectCardProps) {
  return (
    <a
      href={href}
      className="card shadow-lg hover:shadow-xl transition-shadow duration-300 bg-cover bg-center h-80 relative overflow-hidden group"
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
    >
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.7)] group-hover:bg-[rgba(0,0,0,0.5)] transition-all duration-300" />
      <div className="card-body items-center text-center text-white relative z-10 p-6">
        <div className="text-[#ff0000] mb-4">{icon}</div>
        <div>
          <h2 className="card-title text-2xl mb-2">{title}</h2>
          <p className="mb-4 text-sm">{description}</p>
        </div>
        <div className="badge badge-outline text-xs mb-4">{technicalSpecs}</div>
      </div>
    </a>
  );
}
