interface GameCardProps {
  title: string;
  description: string;
  technicalSpecs: string;
  backgroundImage: string;
  href: string;
  extraButtons?: { label: string; href: string }[];
}

export function GameCard({
  title,
  description,
  technicalSpecs,
  backgroundImage,
  href,
  extraButtons = [],
}: GameCardProps) {
  return (
    <a href={href}>
      <div className="h-full card card-side bg-neutral text-neutral-content border border-base-200 overflow-hidden relative group transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-accent/20 flex">
        {/* Text Content - Left Side */}
        <div className="card-body p-8 flex flex-col justify-between w-3/5">
          <div>
            <h2 className="card-title text-3xl mb-3 text-balance">{title}</h2>
            <p className="mb-4 leading-relaxed">{description}</p>
            {technicalSpecs && (
              <div className="text-sm bg-base-100 text-base-content p-3 rounded border border-base-300 my-4">
                <span className="font-semibold text-accent">Technical:</span>{" "}
                {technicalSpecs}
              </div>
            )}
          </div>
          <div className="card-actions flex flex-wrap gap-2">
            <a
              href={href}
              className="btn btn-success px-6 py-3 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary group-hover:shadow-lg group-hover:shadow-primary/50"
            >
              Play Now
            </a>
            {extraButtons.map((button, index) => (
              <a
                key={index}
                href={button.href}
                className="btn btn-outline btn-primary px-6 py-3 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary group-hover:shadow-lg group-hover:shadow-primary/50"
              >
                {button.label}
              </a>
            ))}
          </div>
        </div>
        {/* Background Image - Right Side */}
        <figure className="w-1/4 relative brightness-75 group-hover:brightness-110 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-base-100/20" />
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${backgroundImage})`,
            }}
          />
        </figure>
      </div>
    </a>
  );
}
