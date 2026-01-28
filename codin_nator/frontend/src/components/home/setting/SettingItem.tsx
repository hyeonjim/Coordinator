import type ItemProps from "../../../types/setting/item";

export default function SettingItem({
  title,
  description,
  textColor,
}: ItemProps) {
  return (
    <div className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 ">
      <div
        className={`leading-none font-semibold ${textColor ? textColor : ""}`}
      >
        {title}
      </div>
      <div className="text-gray-400 text-sm">{description}</div>
    </div>
  );
}
