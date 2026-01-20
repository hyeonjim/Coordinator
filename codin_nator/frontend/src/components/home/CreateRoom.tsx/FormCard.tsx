interface FormCardProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export default function FormCard({
  icon,
  title,
  description,
  children,
  className,
}: any) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 overflow-hidden ${className}`}
    >
      {/* 1. 카드 헤더 */}
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-1">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {title}
        </h2>

        {description && (
          <p className="text-sm text-gray-500 mt-1 ml-7">{description}</p>
        )}
        <hr
          className={`bg-white border border-gray-100 overflow-hidden ${className} mt-2`}
        ></hr>
      </div>

      {/* 2. 카드 바디 */}
      <div className="p-6 pt-0 space-y-6">{children}</div>
    </div>
  );
}
