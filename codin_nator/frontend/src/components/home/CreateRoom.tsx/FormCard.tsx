interface FormCardProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function FormCard({ icon, title, description, children }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* 1. 카드 헤더 */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {title}
        </h2>

        {description && (
          <p className="text-sm text-gray-500 mt-1 ml-7">{description}</p>
        )}
      </div>

      {/* 2. 카드 바디 */}
      <div className="p-6 space-y-6">{children}</div>
    </div>
  );
}
